import { vi } from "vitest";

export type RealtimeHandler = (payload: { new: Record<string, unknown> }) => void;

export interface SupabaseMockState {
  currentUser: { id: string } | null;
  selectRows: Record<string, unknown>[];
  insertError: { message: string } | null;
  insertedRows: Record<string, unknown>[];
  realtimeHandler: RealtimeHandler | null;
  channelRemoved: boolean;
}

export function createSupabaseMock(initial?: Partial<SupabaseMockState>) {
  const state: SupabaseMockState = {
    currentUser: { id: "user-self" },
    selectRows: [],
    insertError: null,
    insertedRows: [],
    realtimeHandler: null,
    channelRemoved: false,
    ...initial,
  };

  const selectBuilder = () => {
    const builder: Record<string, unknown> = {};
    builder.select = vi.fn(() => builder);
    builder.eq = vi.fn(() => builder);
    builder.order = vi.fn(() => builder);
    builder.limit = vi.fn(() => Promise.resolve({ data: state.selectRows, error: null }));
    builder.insert = vi.fn((row: Record<string, unknown> | Record<string, unknown>[]) => {
      const rows = Array.isArray(row) ? row : [row];
      state.insertedRows.push(...rows);
      return Promise.resolve({ error: state.insertError });
    });
    return builder;
  };

  const supabase = {
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: state.currentUser }, error: null })
      ),
    },
    from: vi.fn(() => selectBuilder()),
    channel: vi.fn(() => {
      const ch: Record<string, unknown> = {};
      ch.on = vi.fn((_evt: string, _filter: unknown, handler: RealtimeHandler) => {
        state.realtimeHandler = handler;
        return ch;
      });
      ch.subscribe = vi.fn(() => ch);
      return ch;
    }),
    removeChannel: vi.fn(() => {
      state.channelRemoved = true;
    }),
  };

  return { supabase, state };
}
