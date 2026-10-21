---
title: Stopping an LLM from making up numbers in an AI analyst
date: 2026-10-21
description: How I stopped an LLM marketing analyst from writing numbers it didn't compute, and the five places they still slipped through.
keywords: LLM, AI agents, hallucination, grounding, marketing analytics
---

I lead the build of an AI analyst for e-commerce marketing teams. You ask it
things like "why did ROAS drop last week?" and it pulls data from the ad
platforms, analytics and the store, runs checks, and writes an answer.

The worst thing it can do is write a wrong number confidently. A media buyer who
sees one wrong spend figure stops trusting every other figure on the screen. So
the system follows one rule: **code computes every number, the LLM only
interprets.**

## Numbers are facts, not text

Every number the analyst can show comes from code. Plain functions compute
spend, conversion rate, the gap between two sources and so on, and each one
produces a *fact*: a key, a value, a format (money, percent, count) and the step
and source it came from.

The LLM never sees a number it is allowed to type. It writes placeholders
instead:

```text
Spend rose to {{fact:f_3a9c.spend}} while purchases fell to {{fact:f_3a9c.purchases}}.
```

Code swaps each placeholder for the fact's value, formatted in the brand's
reporting currency. So numbers always render the same way, the LLM can't mistype
them, and every value on screen links back to the step that produced it.

## Validating every number

After each LLM call, a validator reads the text:

- A placeholder with an unknown fact key fails.
- **Any literal digit left in the text fails.** The only exceptions are a small
  allowlist: list markers, date strings copied from the analysis window, and
  attribution labels like "7-day click".
- On failure, the model gets **one** retry that names the exact keys or tokens
  that broke the rule.
- If the retry fails too, the offending sentence is dropped and a warning is
  shown. A shorter answer is better than a wrong one.

The eval suite checks for zero ungrounded numbers on every recorded question,
not just for the "right" answer.

## The audit: five places numbers still got through

Placeholders covered the obvious case. When I audited every LLM call in the
pipeline, five places still let an LLM-written or LLM-chosen number through:

1. **Dates and period lengths.** The validator had exempted ISO dates, month
   names and "N days". So the model could write "over the last 45 days" when the
   window was 28. Now the answer step receives every window the turn actually
   used, and any date or duration outside them is a violation.
2. **Named periods.** The planner was turning "last month" or "Q3" into date
   ranges itself, which meant the LLM did date arithmetic. Common phrases
   ("last 30 days", "in September", "year to date", "yesterday") are now parsed
   in code. Only phrases that are ambiguous or match nothing go to the planner.
3. **Conceptual answers.** For "what's a good CTR?" there's no data, so the model
   reached for benchmarks it half-remembered. Those answers may now only repeat
   numbers the user wrote, and the prompt asks for explanations in words.
4. **Follow-up suggestions.** "Want me to look at why CPA is up 40%?" is still a
   number. Suggestions that state a figure without a fact behind it are dropped.
5. **Planner filters.** "Show me campaigns with ROAS below 2" is fine. But the
   planner also invented thresholds for vague wording like "underperforming
   campaigns". A `gt`/`lt` filter is now kept only if the user stated that number;
   otherwise the planner sorts and limits instead.

The pattern: the LLM chose a number in places that didn't look like "writing a
number", such as a date range, a filter or a follow-up question.

## Small rules that saved retries

Strict validation costs retries, and each retry is another full LLM call. A few
fixes in code removed the most common ones:

- **Currency before a placeholder.** The model kept writing
  `INR {{fact:spend}}` for a fact that already renders as "INR 60K". Code now
  strips the typed currency when the fact brings its own, rather than failing the
  whole draft.
- **Figures from other findings.** Each finding may name other findings by
  title. But it may only quote its own fact labels and text values, so it can't
  repeat another finding's "over 90%" outside that finding's context.
- **Streaming.** Answers now stream to the UI sentence by sentence. A sentence
  already on screen can't be rewritten, so a streamed sentence that fails
  validation is dropped instead of retried.

## What it costs

The prose is stiffer. Without the freedom to say "nearly double" or "about a
third", the model writes more literal sentences. Some sentences get dropped.
Retries add latency.

I'll take that trade every time. Users have to trust the numbers before the
interpretation is worth anything to them.

I've released the core of this as an open-source Python library,
[factguard](https://github.com/shivamsingh262/factguard): fact placeholders,
the validator with its date windows, the single retry and dropping the sentence.

*Related: [When an LLM hits its output cap](/notes/llm-output-token-cap/), on what happened when one of these interpretation calls outgrew its token limit.*
