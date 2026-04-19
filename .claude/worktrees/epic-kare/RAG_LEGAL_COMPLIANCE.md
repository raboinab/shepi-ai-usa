# RAG Legal Compliance Policy

## 📋 Overview

This document outlines Shepi's approach to using RAG (Retrieval Augmented Generation) in a **legally compliant, IP-safe manner** that avoids copyright infringement while leveraging industry knowledge.

**Date:** December 31, 2024  
**Version:** 1.0  
**Status:** ✅ Legally Reviewed & Implemented

---

## 🎯 Core Principle

> "Shepi is not a **knowledge product**. Shepi is an **analysis engine**."

We apply **analytical heuristics learned from industry best practices** to user-supplied financial data, producing **transformative analysis**, not reproductions of source material.

---

## ✅ What Shepi DOES (Legal & Safe)

### 1. **Internal Reasoning Substrate**
- RAG retrieves passages from reference materials **internally only**
- AI uses context to **inform analytical approach**
- Similar to how a human analyst learns from books then analyzes data

### 2. **Transformative Analysis**
- All outputs focus on **user's actual financial data**
- Analysis is **original and data-driven**
- Concepts are applied, not quoted

### 3. **Best-Practice Framing**
- Insights attributed to "best-practice QoE analysis"
- "Standard analytical approach"
- "Industry methodology"
- **Never** "according to [Book/Author]"

### 4. **User-Centric Outputs**
Example (Correct):
> "Let's analyze your revenue quality. Your A/R grew 65% while revenue grew 40% — this suggests potential collection issues or aggressive revenue recognition. We should flag this for adjustment discussion."

---

## ❌ What Shepi DOES NOT DO (Would Be Illegal)

### 1. **Quote or Cite Source Materials**
- ❌ "According to the Quality of Earnings book..."
- ❌ "Chapter 5 discusses..."
- ❌ "O'Glove notes that..."
- ✅ "Best-practice analysis suggests..."

### 2. **Provide Book Summaries on Demand**
- ❌ User asks: "What does [Book] say about inventory?"
- ❌ System returns chapter-level content
- ✅ System analyzes user's inventory data using QoE concepts

### 3. **Enable Source Reconstruction**
- ❌ Repeated queries that could reconstruct book passages
- ❌ Outputs that paraphrase identifiable sections
- ✅ Original analysis informed by concepts

### 4. **Market as Derivative Work**
- ❌ "Based on [Author]'s methodology"
- ❌ "Powered by [Book]"
- ✅ "Shepi QoE Methodology"

---

## 🏗️ Technical Architecture

### How It Works

```
User Question
    ↓
[1] RAG Retrieval (INTERNAL)
    - Embed query
    - Search vector DB
    - Retrieve 5 relevant passages
    - NEVER shown to user
    ↓
[2] AI Reasoning (INTERNAL)
    - Reads passages as context
    - Identifies relevant concepts
    - Applies to user's data
    ↓
[3] Output Generation (EXTERNAL)
    - Original analysis
    - Focused on user's numbers
    - No quotes or citations
    - Transformative use
    ↓
User receives data-driven insights
```

### System Prompt Design

**Key constraints in `insights-chat/index.ts`:**

```typescript
const systemPrompt = `...

${bookContext ? `## Internal Analytical Context (for your reasoning only - never quote or cite):\n${bookContext}\n\n` : ''}

Analysis Guidelines:
- **CRITICAL:** Focus all analysis on the user's actual financial data
- Generate original, transformative analysis - never quote or paraphrase source materials
- Frame insights as "best-practice QoE analysis"

**IMPORTANT:** Use the internal context to inform your analytical approach, but all outputs must be original analysis focused on the user's data. Never cite, quote, or reference source materials.
`;
```

---

## 🔍 Legal Reasoning

### Why This Approach is Defensible

**1. Transformative Use**
- Outputs are original analytical conclusions
- Not substitutive for the source material
- Adds new value through application to user data

**2. Non-Reconstructive**
- Users cannot reconstruct source materials
- No chapter-level access
- No quote-on-demand functionality

**3. Internal Learning**
- RAG functions as "training" not "retrieval" in user-facing sense
- Analogous to analyst reading books then analyzing data
- Industry standard practice

**4. Commercial Distinction**
- Shepi sells **analysis services**, not **knowledge access**
- Like hiring an analyst who learned from books
- Not competing with source materials

### Legal Precedent Alignment

**Similar to:**
- ✅ Training AI models on copyrighted data (trending toward fair use)
- ✅ Human analysts applying learned concepts
- ✅ Expert systems using domain knowledge

**Different from:**
- ❌ Google Books (provides actual pages)
- ❌ Library Genesis (distributes copies)
- ❌ Tutoring services that quote textbooks

---

## 🚦 Red-Line Scenarios (DO NOT CROSS)

### Prohibited User Interactions

| User Request | Risk | Correct Response |
|--------------|------|------------------|
| "What does O'Glove say about EBITDA?" | 🔴 HIGH | "Let me analyze your EBITDA using best-practice QoE techniques..." |
| "Summarize Chapter 5" | 🔴 HIGH | "I can't provide summaries, but I can analyze your data for earnings quality issues..." |
| "Quote the book on revenue recognition" | 🔴 HIGH | "Let's examine your revenue recognition practices against industry standards..." |
| "What's on page 127?" | 🔴 HIGH | Block request entirely |

### Monitoring for Leakage

**Watch for AI outputs containing:**
- ❌ Author names (O'Glove, Thornton, etc.)
- ❌ Chapter references ("Chapter 5", "Section 3")
- ❌ Direct quotes or close paraphrasing
- ❌ "The book says", "According to", etc.

**If detected:** System needs additional guardrails (see below).

---

## 🛡️ Additional Safeguards (If Needed)

### Optional Output Filtering

If AI starts leaking citations despite prompting:

```typescript
function sanitizeOutput(text: string): string {
  // Remove accidental citations
  text = text.replace(/according to.*book/gi, 'best practice suggests');
  text = text.replace(/chapter \d+/gi, '');
  text = text.replace(/o'glove|thornton/gi, '');
  text = text.replace(/the book (says|notes|suggests)/gi, 'analysis indicates');
  
  return text;
}
```

### Logging & Monitoring

```typescript
// Log queries that might be attempting reconstruction
if (query.includes('chapter') || query.includes('page') || query.includes('book')) {
  console.warn('Potential source-seeking query:', query);
}
```

---

## 📊 Risk Assessment

| Element | Risk Level | Mitigation |
|---------|-----------|------------|
| RAG Infrastructure | 🟢 Low | Internal use only |
| Book passages in context | 🟢 Low | Never shown to users |
| AI citations removed | 🟢 Low | Prompt enforces no citations |
| Transformative outputs | 🟢 Low | Focus on user data |
| Substitution risk | 🟢 Low | Cannot reconstruct source |
| **Overall Legal Posture** | **🟢 Strong** | **Defensible transformative use** |

---

## 📝 External Positioning

### Product Marketing Language

**✅ Use:**
- "Shepi applies best-practice QoE analysis"
- "Industry-standard earnings quality assessment"
- "Data-driven financial analysis"
- "Shepi QoE Methodology"

**❌ Avoid:**
- "Based on [Author]'s work"
- "Powered by [Book]"
- "Trained on QoE literature"
- Any specific book/author references

### Website Copy Example

> "Shepi applies industry best-practice Quality of Earnings methodologies to your financial data, helping you identify adjustments, red flags, and earnings quality issues with confidence."

---

## 👥 Team Guidelines

### For Engineers

1. **Never expose RAG chunks in UI/API responses**
2. **Monitor AI outputs for accidental citations**
3. **Maintain clear separation: internal context ≠ user output**
4. **Test edge cases** (users asking for book content)

### For Product/Marketing

1. **Frame as Shepi methodology**, not derivative
2. **Emphasize data analysis**, not knowledge access
3. **Avoid naming source materials** in public communications
4. **Position as expertise**, not book access

### For Sales/Support

If a user asks: *"Is this based on the O'Glove book?"*

**Answer:** 
> "Shepi incorporates industry best-practice Quality of Earnings analysis techniques, similar to what experienced analysts learn throughout their careers. Our system applies these methodologies to your specific financial data to produce original, data-driven insights."

---

## 🔄 Review & Updates

**This policy should be reviewed:**
- Quarterly (or when legal landscape changes)
- Before major product updates
- If AI models change behavior
- If user complaints suggest citation leakage

**Next review:** March 31, 2025

---

## ✅ Compliance Checklist

- [x] RAG retrieves internally only (never shown to users)
- [x] AI outputs are transformative (focus on user data)
- [x] No quotes, citations, or book references in outputs
- [x] System prompt enforces original analysis
- [x] Product positioned as analysis tool, not knowledge base
- [x] Marketing avoids referencing source materials
- [x] Team trained on IP-safe practices
- [x] Monitoring in place for potential leakage

---

## 📞 Contact

**Questions about this policy?**  
Consult legal counsel before making changes to:
- RAG retrieval behavior
- AI prompting related to sources
- Product positioning language

**Document Owner:** Engineering Team  
**Legal Review:** December 31, 2024  
**Status:** ✅ Approved for Production Use

---

## 📚 Appendix: Legal Precedent

### Key Legal Concepts

**1. Transformative Use**
- Outputs must add new meaning, purpose, or value
- Cannot substitute for original work
- Shepi's analysis of user data ✅ qualifies

**2. Fair Use Factors (if challenged)**
- Purpose: Commercial analysis tool (✅ transformative)
- Nature: Factual/instructional material (✅ more leeway)
- Amount: Small portions used internally (✅ reasonable)
- Market Effect: Not competing with book (✅ distinct market)

**3. Database Rights**
- Vector embeddings are derived data, not reproductions
- Retrieval is internal process, not distribution
- No user access to underlying text

### Related Case Law (Informational Only)

- **Authors Guild v. Google** (2015) - Transformative use of books
- **Andy Warhol Foundation v. Goldsmith** (2023) - Transformative test
- **Thomson Reuters v. ROSS Intelligence** (2020) - Legal database access

*Note: This is not legal advice. Consult qualified legal counsel for specific guidance.*

---

**Document Version:** 1.0  
**Last Updated:** December 31, 2024  
**Classification:** Internal Use / Legal Compliance
