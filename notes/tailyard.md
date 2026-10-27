---
title: A terminal UI for local dev: logs, HTTP requests, LLM calls and Redis queues in one screen
date: 2026-10-27
description: tailyard runs your docker compose stack and dev servers, records HTTP traffic and LLM API calls through two local proxies, captures the browser console and watches Redis queues, all in one terminal, filterable by request id.
keywords: terminal UI, TUI, local development, docker compose logs, reverse proxy, LLM API, Redis streams, Go, Bubble Tea
---

A bug in a local stack usually crosses several windows. The browser shows an
error, the API log has a 422, the request body that caused it lives in the
DevTools network tab, and the job it queued is somewhere in Redis. Each one is a
different tool, and none of them knows about the others.

On a recent project I was running a FastAPI API, two Python workers, Postgres
and Redis in docker compose, with a React app on Vite from a second repo.
Debugging one request meant a terminal for `docker compose up`, another for
`nvm use 20 && npm run dev`, a `docker compose logs -f` each for the API and the
worker, `redis-cli` somewhere, and DevTools. tailyard started as a script for
that one stack, called devtui, and I split a generic version out of it the same
day.

[tailyard](https://github.com/shivamsingh262/tailyard) puts all of it in one
terminal: every log stream, every HTTP request with its bodies, the browser
console, every LLM API call, and your Redis queues, in tabs, filterable by a
request id. It's written in Go with [Bubble Tea](https://github.com/charmbracelet/bubbletea).

```sh
brew install --cask shivamsingh262/tap/tailyard
cd your-project
tailyard -init      # writes an annotated tailyard.yml
tailyard
```

## One config file for the whole stack

A `tailyard.yml` says what to run and what to watch. A compose backend plus a
Vite frontend looks like this:

```yaml
compose:
  files: [docker-compose.yml]
sources:
  - name: api
    compose: api
    health: http://localhost:8000/health
  - name: web
    command: npm run dev
    dir: ./frontend
proxy:
  target: http://localhost:5173   # open http://127.0.0.1:8899 instead
  inject_console: true
redis:
  addr: 127.0.0.1:6379
correlation:
  keys: [request_id]
```

tailyard runs `docker compose up -d` on start and `stop` on quit (`d` detaches
and leaves the containers running). Each source gets a tab, plus HTTP, Browser,
LLM, Redis, System and All.

## Logs: three kinds of source

Each source is one of three things:

- **A compose service.** tailyard runs `docker compose logs -f --timestamps`
  for it. When a container is recreated, the log stream ends, so it reconnects
  with `--since` set to the last timestamp it saw and drops anything at or
  before it. Restarting a service doesn't replay its history into the tab.
- **A command** like `npm run dev`. tailyard starts it under `sh -c` in its own
  process group. That matters because `npm run dev` is a shell that starts a
  package runner that starts the real server. Signalling only the shell leaves
  the server running and holding its port. Signalling the group stops all of
  them, and anything still alive after a few seconds is killed.
- **A file**, followed like `tail -F`: it waits for the file to appear and
  reopens it when it's truncated or replaced.

Every line goes through a parser. It reads JSON logs (zap, zerolog, pino,
structlog, slog), lays out access-log lines as request rows, and reads Postgres
and Redis server logs. It also **folds multi-line errors** into the entry they
belong to: a Python traceback or a JS stack trace becomes one entry with the
frames as its detail, not twenty separate lines.

## HTTP: a recording reverse proxy

Requests are recorded by a reverse proxy, so you open the app at
`127.0.0.1:8899` instead of the dev server's port. If the frontend dev server
proxies `/api` to the backend, tailyard goes in front of the dev server: page
loads and API calls both pass through it.

Each request is recorded with its query, both bodies and its timing. A few
details made this work:

- **Bodies arrive uncompressed.** The proxy deletes the browser's
  `Accept-Encoding` header before forwarding. Go's HTTP client then asks the
  upstream for gzip itself and decompresses it transparently, so the recorded
  body is plain text and JSON can be pretty-printed.
- **Bodies are copied as they stream**, into a buffer that keeps the first
  `max_body` bytes and counts the rest. Your app gets the full body; the
  recording says when it was truncated.
- **Dev-server noise is skipped by default.** Vite's `/@vite/` and `/@fs/`
  paths, Next's `/_next/static/`, and anything ending in `.js`, `.css`, `.png`
  and so on aren't recorded, or they'd bury the API calls.
- **Secrets are masked in the copy, not the traffic.** Values under keys
  containing `password`, `secret`, `token`, `api_key`, `authorization` or
  `cookie` are masked in JSON bodies at any depth, form bodies and query
  strings.

## The browser console, through the same proxy

With `inject_console: true`, the proxy adds one tag to the top of `<head>` in
every HTML page it serves:

```html
<script src="/__tailyard/console.js"></script>
```

It goes at the top so it's in place before the page's own scripts run. The
script wraps `console.log`, `info`, `warn`, `error` and `debug`, listens for
uncaught errors and unhandled promise rejections, and sends them back to the
proxy in batches: queued for 100 ms, then sent with `navigator.sendBeacon`, and
flushed on `pagehide` so the last messages before a navigation aren't lost. They
show up in the Browser tab, and in the All tab alongside the logs and requests.

One side effect: DevTools now shows the wrapper as the source of every console
message. Adding `/__tailyard/` to DevTools' ignore list fixes that.

## LLM calls: a second proxy

The LLM tab came in v0.2.0. A second proxy, on port 8898, forwards
`/anthropic/...` to the Anthropic API and `/openai/...` to OpenAI (Ollama,
OpenRouter, Groq, Together, or any OpenAI-compatible server can be added).
SDKs already read a base URL from the environment, so tailyard sets
`ANTHROPIC_BASE_URL` and `OPENAI_BASE_URL` for the commands it starts, unless
they're already set. No code changes, and the API key passes through without
being recorded.

Each call shows the model asked for and the model that answered, the stop
reason, tokens including cache reads and writes, time to first token, and cost
if you configure prices. Streams are forwarded chunk by chunk
(`FlushInterval: -1`) and parsed as they pass, so only the current server-sent
event is ever buffered.

Some calls are flagged:

- **It hit the output cap** (`max_tokens`, `length` or `max_output_tokens`).
  This is the failure from [my note on truncated JSON and a silent
  fallback](/notes/llm-output-token-cap/), and it's invisible unless you check
  the stop reason.
- **It was refused** or content-filtered.
- **A different model answered.** Dated variants (`gpt-4o` answered by
  `gpt-4o-2024-08-06`), `-latest` aliases and router prefixes
  (`openai/gpt-4o`) don't count.
- **It failed**, including an error sent inside a stream that started with a
  200.
- **The stream ended before the model finished**, usually because the client
  stopped reading.

Each attempt is its own row, so an SDK retrying after a 429 shows up as several
calls, not one slow one.

## Bugs the LLM proxy review caught

The LLM tab went through a review before it merged, and the fixes are in the
commit history:

- **Redaction hid the numbers that matter.** `token` is in the default
  redaction list, which masked `max_tokens`, `input_tokens` and every other
  count. Exempting keys that looked like counts would also have unmasked keys
  like `device_tokens` in the HTTP tab. The fix is an explicit list of known
  token-count fields; everything else containing `token` stays masked.
- **A race on the request body.** A request body can still be uploading when
  the response arrives and the recorder reads it, so the capture buffer is now
  locked.
- **Errors inside a 200 stream** weren't flagged, and neither were refusals in
  streamed Responses API calls.
- **Tool loops showed a stale prompt.** A call that sends tool results back
  showed the last user question, which could be several turns old. It now
  shows "tool results".
- **Text was cut mid-character** when prompts and answers were shortened for
  display. Cuts now land on UTF-8 boundaries.

## Two bugs from the first day

**It flooded its own log.** The status bar checked the API's `/health` every 3
seconds, and uvicorn logged every check, so the API tab filled with my own
polling. A plain port check wasn't an option: with `--reload`, uvicorn keeps the
port open even when the app fails to import, so the API would look healthy while
broken. The checks are tagged with `?tailyard=1`, and only those lines are
dropped.

**The console bridge fed itself.** The first version forwarded console calls
over Vite's dev-server connection. When Vite restarted, its client logged
"server connection lost". Forwarding that threw `send was called before
connect` through `console.error`, which got forwarded again: 925,484 errors in
about 4 seconds. tailyard's script posts with `sendBeacon` instead, so it
doesn't depend on Vite's connection.

## Redis: queues, not keys

Redis is sampled every 2 seconds. Streams and their consumer groups are
discovered automatically and shown with length, pending, lag, the age of the
oldest pending message, and consumers. A row turns red when a message has been
pending for over a minute, or when a stream marked as a dead-letter queue has
anything in it.

`MONITOR` is off until you press `m`, because it slows Redis down. tailyard
names its own connections `tailyard` and leaves their commands out, and
commands workers issue constantly (`PING`, `XREADGROUP`, `BRPOP` and so on) are
dimmed so the rest stand out.

## Following one request through everything

The part that ties it together is correlation. You name the id fields in the
config (`request_id`, `trace_id`), or a regex for ids in plain text or paths.
tailyard looks for the id in JSON log fields, query parameters, URL paths, and
`X-Request-Id`-style headers on LLM calls.

Press `f` on any entry and its id is pinned: every tab shows only what mentions
it. The access log line, the request and its body, the worker's log, and the
LLM call it made are all filtered down to that one request. If the Redis tail is a glob like
`events:*`, the tail switches to that id's stream too.

## What it doesn't do

- Only HTTP that goes through the proxy is recorded. WebSockets are forwarded
  but not recorded.
- LLM calls are recorded only if the SDK honours a base URL. AWS Bedrock signs
  requests for its own host, so it can't go through the proxy.
- Brotli and zstd bodies aren't decoded. Since the proxy asks for gzip or
  nothing, that's rare.
- It builds for Windows, but process control and the UI are mostly tested on
  macOS and Linux.

It's MIT licensed, and the code, binaries and an annotated example config are on
[GitHub](https://github.com/shivamsingh262/tailyard). Without Homebrew,
`go install github.com/shivamsingh262/tailyard@latest` works with Go 1.24+.
