import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createSupabaseMock } from "@/test/supabaseMock";

// Hoisted mock: vi.mock is hoisted above imports, so we need a hoisted holder
const mockHolder = vi.hoisted(() => ({
  current: null as ReturnType<typeof createSupabaseMock> | null,
}));

vi.mock("@/integrations/supabase/client", () => ({
  get supabase() {
    if (!mockHolder.current) throw new Error("supabase mock not initialized");
    return mockHolder.current.supabase;
  },
}));

// Import AFTER the mock is declared
import { EngagementChat } from "./EngagementChat";

const PROJECT_ID = "project-123";

function setup(initial?: Parameters<typeof createSupabaseMock>[0]) {
  mockHolder.current = createSupabaseMock(initial);
  return mockHolder.current;
}

describe("EngagementChat", () => {
  beforeEach(() => {
    mockHolder.current = null;
  });

  it("renders empty state when no messages", async () => {
    setup({ selectRows: [] });
    render(<EngagementChat projectId={PROJECT_ID} />);
    expect(
      await screen.findByText(/no messages yet/i)
    ).toBeInTheDocument();
  });

  it("renders existing messages with self/other labels", async () => {
    setup({
      currentUser: { id: "user-self" },
      selectRows: [
        {
          id: "m1",
          role: "user",
          content: "hello from me",
          created_at: new Date("2026-05-18T10:00:00Z").toISOString(),
          user_id: "user-self",
          metadata: null,
        },
        {
          id: "m2",
          role: "user",
          content: "hi from other",
          created_at: new Date("2026-05-18T10:01:00Z").toISOString(),
          user_id: "user-other",
          metadata: null,
        },
      ],
    });

    render(
      <EngagementChat projectId={PROJECT_ID} selfLabel="Client" otherLabel="CPA" />
    );

    expect(await screen.findByText("hello from me")).toBeInTheDocument();
    expect(screen.getByText("hi from other")).toBeInTheDocument();
    expect(screen.getByText(/Client ·/)).toBeInTheDocument();
    expect(screen.getByText(/CPA ·/)).toBeInTheDocument();
  });

  it("sends a message with correct payload and clears the input", async () => {
    const { state, supabase } = setup({ selectRows: [] });
    const user = userEvent.setup();

    render(<EngagementChat projectId={PROJECT_ID} />);
    await screen.findByText(/no messages yet/i);

    const textarea = screen.getByPlaceholderText(/type a message/i);
    await user.type(textarea, "hello world");
    await user.click(screen.getByRole("button", { name: "" })); // send icon button

    await waitFor(() => expect(state.insertedRows.length).toBe(1));
    expect(state.insertedRows[0]).toMatchObject({
      project_id: PROJECT_ID,
      user_id: "user-self",
      role: "user",
      content: "hello world",
      context_type: "engagement",
    });
    expect((supabase.from as unknown as { mock: { calls: unknown[][] } }).mock.calls.some(
      (c) => c[0] === "chat_messages"
    )).toBe(true);
    expect((textarea as HTMLTextAreaElement).value).toBe("");
    // Optimistic message rendered
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });

  it("rolls back optimistic message when insert fails", async () => {
    const { state } = setup({
      selectRows: [],
      insertError: { message: "RLS denied" },
    });
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<EngagementChat projectId={PROJECT_ID} />);
    await screen.findByText(/no messages yet/i);

    await user.type(screen.getByPlaceholderText(/type a message/i), "fails");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(state.insertedRows.length).toBe(1));
    await waitFor(() =>
      expect(screen.queryByText("fails")).not.toBeInTheDocument()
    );
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
    errorSpy.mockRestore();
  });

  it("appends realtime messages and dedupes by id", async () => {
    const { state } = setup({ selectRows: [] });
    render(<EngagementChat projectId={PROJECT_ID} />);
    await screen.findByText(/no messages yet/i);

    await waitFor(() => expect(state.realtimeHandler).not.toBeNull());

    act(() => {
      state.realtimeHandler!({
        new: {
          id: "rt-1",
          role: "user",
          content: "incoming realtime",
          created_at: new Date().toISOString(),
          user_id: "user-other",
          metadata: null,
          context_type: "engagement",
        },
      });
    });
    expect(await screen.findByText("incoming realtime")).toBeInTheDocument();

    // Duplicate id should be ignored
    act(() => {
      state.realtimeHandler!({
        new: {
          id: "rt-1",
          role: "user",
          content: "duplicate body",
          created_at: new Date().toISOString(),
          user_id: "user-other",
          metadata: null,
          context_type: "engagement",
        },
      });
    });
    expect(screen.queryByText("duplicate body")).not.toBeInTheDocument();

    // Wrong context_type should be ignored
    act(() => {
      state.realtimeHandler!({
        new: {
          id: "rt-2",
          role: "user",
          content: "wrong context",
          created_at: new Date().toISOString(),
          user_id: "user-other",
          metadata: null,
          context_type: "wizard",
        },
      });
    });
    expect(screen.queryByText("wrong context")).not.toBeInTheDocument();
  });

  it("Enter sends, Shift+Enter inserts newline", async () => {
    const { state } = setup({ selectRows: [] });
    const user = userEvent.setup();

    render(<EngagementChat projectId={PROJECT_ID} />);
    await screen.findByText(/no messages yet/i);

    const textarea = screen.getByPlaceholderText(/type a message/i) as HTMLTextAreaElement;
    await user.click(textarea);
    await user.keyboard("line1{Shift>}{Enter}{/Shift}line2");
    expect(textarea.value).toBe("line1\nline2");
    expect(state.insertedRows.length).toBe(0);

    await user.keyboard("{Enter}");
    await waitFor(() => expect(state.insertedRows.length).toBe(1));
    expect(state.insertedRows[0].content).toBe("line1\nline2");
  });

  it("does not send empty/whitespace-only messages", async () => {
    const { state } = setup({ selectRows: [] });
    const user = userEvent.setup();

    render(<EngagementChat projectId={PROJECT_ID} />);
    await screen.findByText(/no messages yet/i);

    await user.type(screen.getByPlaceholderText(/type a message/i), "   ");
    await user.keyboard("{Enter}");
    expect(state.insertedRows.length).toBe(0);
  });
});
