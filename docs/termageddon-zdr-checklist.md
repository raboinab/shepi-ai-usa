# Termageddon Privacy Policy — ZDR Update Checklist

The Privacy Policy at `/privacy` is hosted by Termageddon and embedded via
their script — it cannot be edited from this repo. Apply the following
updates in the Termageddon dashboard so the public Privacy Policy mirrors
the language in `src/pages/DPA.tsx` §6 and `src/pages/Subprocessors.tsx`.

## 1. Sub-processor list

If the policy enumerates AI sub-processors by name, replace any standalone
references to **OpenAI**, **Google AI / Gemini**, or **Anthropic** with a
single entry:

> **Vercel (AI Gateway)** — AI model routing for document parsing,
> financial analysis, narrative generation, and vector embeddings. Operates
> under a Zero Data Retention agreement; upstream model providers
> (Anthropic Claude, OpenAI) process requests as sub-processors under
> no-retention terms. Location: United States.

## 2. AI processing / retention clause

Add (or update) a clause describing how customer data is handled by AI
sub-processors:

> All AI model requests are routed through Vercel AI Gateway under a Zero
> Data Retention (ZDR) agreement. Prompts and completions containing
> customer data are **not stored** by the upstream model provider after
> the request completes, and are **not used to train** any model. ZDR
> enforcement is verified at runtime before any AI request is issued.

## 3. "How we use your data" section

If the policy lists purposes of processing, ensure AI-assisted analysis is
disclosed:

- Document parsing and OCR
- Financial statement analysis and anomaly detection
- Narrative generation for reports
- Vector embeddings for retrieval-augmented Q&A

## 4. Training / model improvement disclaimer

Explicitly state:

> We do **not** sell customer data. We do **not** permit AI sub-processors
> to retain or train on prompts derived from customer data.

## 5. Update the "Last updated" date

Bump the policy's effective date in Termageddon so the change is visible
to users.

---

After publishing in Termageddon, no code change is needed — the embedded
script pulls the latest version automatically. Sanity-check by loading
`/privacy` and confirming the new language appears.
