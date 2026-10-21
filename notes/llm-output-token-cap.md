---
title: "When an LLM hits its output cap: cut-off JSON, a quiet fallback and a 6-minute scan"
date: 2026-10-21
description: A 41-finding scan outgrew the model's output limit and quietly switched providers. Splitting the work fixed it, and splitting it too far broke something else.
---

Our AI marketing analyst has a "health scan": it runs a set of checks across a
brand's ad and analytics accounts, ranks the findings, and then asks an LLM to
explain each finding and suggest what to do about it.

One day a scan took almost seven minutes. Nothing failed, nothing alerted, and
the report looked fine. That made it worth looking into.

## What happened

The scan had raised 41 findings, and the code asked for every interpretation in
**one** reply, as a single JSON object.

The reply outgrew the call's **8,192-token output cap**. The model stopped
mid-object, the JSON didn't parse, and our LLM layer did what it was built to do
with an invalid reply: retry on the fallback provider. That happened twice.

The scan took **407 seconds**. Most of it went on generating long replies that
got cut off and then thrown away, and a different model than intended wrote the
final report.

All of this was silent:

- No exception reached the user, because the fallback worked.
- The report looked normal, because the fallback model was good enough.
- The only symptom was latency, and scans run in the background where nobody
  watches latency.

## Why it slipped past testing

The output size grows with the number of findings. Test brands raised 6 to 12
findings, which fit easily. A real brand with a lot going wrong raised 41. The
prompt hadn't changed, but the output was several times bigger.

## Fix 1: treat "stopped at the cap" as its own failure

A reply cut off by the output cap is not the same as malformed JSON. The API
tells you why it stopped (`stop_reason: "max_tokens"`), so:

- It's logged as `llm_output_truncated`, with its own count on the dashboard.
- **Retrying the same request on the same provider is pointless**, because it
  will hit the same cap. For batched calls, a cut-off reply goes straight to the
  fallback instead of a live retry that is bound to fail the same way.

## Fix 2: split the work into groups

Findings are now interpreted in **groups of 12**, all sent at once:

- Each group's reply stays well inside the cap, however many findings a scan
  raises.
- Each group gets its own validation and retry, so one bad group doesn't redo
  the other three.
- Every group uses the same skill set, so the system prompts are identical and
  share the prompt cache.

The same scan then ran with no truncation and no fallback in **253 seconds
instead of 407**.

## Then I split it too far

Live chat turns had the same shape on a smaller scale: one call explaining six
findings took 34 to 36 seconds, the slowest step in a turn. The obvious next step
was one call per finding, all at once, so the step takes only as long as the
slowest finding.

It was faster, and the answers got worse. Explaining findings together had been
doing work I hadn't noticed:

- An action stopped naming the ad set that *another* finding said to scale.
- A gap between two data sources stopped pointing at the tracking problem
  another finding had already found.
- Two findings gave contradicting causes for the same drop.
- A finding recommended running an analysis that a sibling finding already was.

I tried giving each call every finding as shared, cached context, with a short
part naming the one finding to explain. That brought back most of the links, but
it added prompt complexity and new edge cases (citing another finding's numbers,
for one). The same day, I reverted to groups.

## What I took from it

- **Output size is a function of your input.** If a reply lists one item per
  input, its worst case is set by your largest customer, not your test fixtures.
- **Check the stop reason before you parse.** Cut-off JSON is a capacity
  problem, not a formatting one, and needs a different response.
- **Fallbacks hide problems.** Record when a fallback fires, and alert on it.
- **Parallel calls lose shared reasoning.** Splitting a prompt splits what the
  model can connect. Make each batch as small as the limit requires, and no
  smaller.
