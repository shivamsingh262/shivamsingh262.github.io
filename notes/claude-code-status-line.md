---
title: A Claude Code status line with cost, usage limits and a cache timer
date: 2026-10-27
description: moodline is a custom Claude Code status line in bash and jq. It shows session cost, 5-hour and weekly limits, when the prompt cache goes cold, and a kaomoji whose mood follows your repo.
keywords: Claude Code, Claude Code status line, statusline, Claude Code cost, Claude Code usage limits, prompt cache, bash, jq
---

[moodline](https://github.com/shivamsingh262/moodline) is a status line for
Claude Code. It's two bash scripts and an installer, and it prints up to four
lines under the prompt:

```text
╭─ (ง •̀_•́)ง you@mac ~/code/app (main) · Opus 5.5 · effort:medium · ⚡fast
├─ ctx ▰▰▰▱▱ 42% · 5h ▰▰▰▰▱ 63% → 16:30 · wk ▰▰▰▰▰ 85% → Wed
│  ⏱ 1h32m · $3.46 · 🕐 14:30 · cache warm till 15:10 (84k)
╰─ refactor auth flow
```

The first line says where you are and which model you're on. The second shows
how much of the context window, the 5-hour limit and the weekly limit you've
used, with reset times. The third shows how long the session has run, what it
has cost, and how long the prompt cache stays warm. The last is the session
name. The face at the start changes with what's going on.

It started with a question: the Claude app shows a ring for how much context
you've used, so what does the CLI have? Only `/context`, when you ask. I wanted
context, my 5-hour and weekly usage, session cost and time always on screen,
and it grew from there into four lines.

## What Claude Code gives a status line

A status line in Claude Code is just a command. You point `statusLine` in
`~/.claude/settings.json` at a script, and on every refresh Claude Code runs it,
pipes the session as JSON to its stdin, and shows whatever it prints.

These are the fields moodline reads:

| Field | Shown as |
| --- | --- |
| `workspace.current_dir` | directory and git branch |
| `model.display_name`, `effort.level`, `fast_mode` | model, `effort:medium`, `⚡fast` |
| `context_window.used_percentage` | `ctx` bar |
| `rate_limits.five_hour` / `seven_day` (`used_percentage`, `resets_at`) | `5h` and `wk` bars with reset times |
| `cost.total_duration_ms`, `cost.total_cost_usd` | `⏱ 1h32m · $3.46` |
| `prompt_cache` (`warm`, `expires_at`, `recache_tokens_if_cold`) | `cache warm till 15:10 (84k)` |
| `exceeds_200k_tokens` | the `/compact` hint |
| `session_id`, `session_name` | mood state file, last line |

So the cost, the limits and the cache expiry aren't estimated. Claude Code
already knows them, and the script formats them. Any field that isn't in the
JSON is left out, and a line with nothing on it isn't drawn.

## One jq call, then plain bash

A status line runs on every refresh, so it should be quick. moodline reads all
the fields in **one** `jq` call that prints shell assignments, and `eval`s the
result:

```bash
vars=$(jq -r '
  def s: if . == null then "" else tostring end;
  def n: if type == "number" then floor | tostring else "" end;
  @sh "dir=\(.workspace.current_dir | s)",
  @sh "ctx=\(.context_window.used_percentage | n)",
  @sh "cost=\(.cost.total_cost_usd | s)",
  ...
' 2>/dev/null) || { printf 'moodline: could not parse session JSON'; exit 0; }
eval "$vars"
```

`@sh` quotes every value, so a directory or session name with spaces or quotes
can't break out of the assignment. A missing field becomes an empty string,
which is how the rest of the script decides what to skip. Numbers are floored,
so 42.7% shows as 42% and bash can compare them as integers.

Everything after that is bash arithmetic and `printf`. The only other processes
are `git` (for the branch and dirty check) and `date`.

## Bars, colors and reset times

Each usage bar has five segments, rounded up: 1% fills one, 21% fills two, 81%
and above fills all five. A bar turns yellow at 50% and red at 80%, and both
thresholds are configurable.

Reset times are shown as a clock time when the reset is less than a day away
(`→ 16:30`) and as a weekday otherwise (`→ Wed`). The 5-hour window almost
always gets a clock time, and the weekly one usually gets a day.

Times go through a small helper that tries BSD `date -r` and falls back to GNU
`date -d @`, so the same script runs on macOS and Linux.

## The prompt cache timer

The third line ends with the cache state:

- `cache warm till 15:10 (84k)` while the cache is warm and `expires_at` is
  still in the future.
- `cache cold (182k)` once it isn't.

The number in brackets is `recache_tokens_if_cold`: how many tokens the next
message would have to send again without the cache. With the expiry time on
screen, you can tell before you step away whether the next message will pay to
rebuild an 84k-token cache.

It shows a clock time, not a countdown, on purpose. Claude Code only redraws
the status line when something happens in the session, so a countdown would
freeze the moment you walked away. `cache warm till 15:10` is still right when
you come back. It's also how I decide on `/compact`: a cold cache on a small
session costs little, but past 150k tokens I compact before continuing.

moodline also suggests `/compact`, but only in two cases:

- the context is over 200k tokens (`💡 /compact`), or
- the cache is cold **and** the next message would re-send more than 150k tokens
  (`💡 /compact before next msg`).

A cold cache on a small session isn't worth compacting, so there's no hint for it.

## How the mood is chosen

The avatar is the first match in this list:

| Avatar | When |
| --- | --- |
| `(ง •̀_•́)ง` | Claude is working on your prompt |
| `(・‿・)ﾉ` | Claude finished and is waiting for you |
| `(－_－) zZ` | It's between midnight and 6am |
| `(・ω・)` | Not in a git repo |
| `(•̀ᴗ•́)و` | The repo has uncommitted changes |
| `(◕‿◕)` | The repo is clean |

The last four come from the clock and `git`. The dirty check is
`git status --porcelain | head -1`, run with `--no-optional-locks` so a status
line refreshing in the background doesn't take git's index lock while Claude is
also running git commands.

The first two need something the session JSON doesn't have: whether Claude is
working right now. moodline gets that from hooks. The installer adds four:

| Hook | Writes |
| --- | --- |
| `UserPromptSubmit` | `working` |
| `Stop`, `StopFailure` | `waiting` |
| `SessionEnd` | deletes the file |

Each one runs `moodline-hook.sh`, which writes the word to
`~/.claude/moodline-state/<session id>`. The status line reads that file, and
because it's keyed by session, two Claude Code windows have their own moods.
Without `StopFailure`, a request that errored would leave the face stuck on
"working".

The session ID ends up in a file path, so both scripts reject IDs that contain
a `/` or start with a `.` and use `default` instead. The hook also exits 0 on
every failure, so it can never block Claude.

## Small things that would have been bugs

- **Hours with a leading zero.** `date +%H` prints `08` and `09`, which bash
  arithmetic reads as invalid octal. The hour is parsed as `$((10#$hour))`.
- **Missing jq.** Without `jq` the script prints `moodline: jq is required` and
  exits 0, instead of erroring in the status bar. Bad JSON is handled the same
  way.
- **Your other hooks.** The installer edits `settings.json` with `jq`: it
  backs the file up with a timestamp, removes any earlier moodline hooks, and
  appends its own. Other hooks and settings stay as they were, and running it
  again doesn't add duplicates. If you already had a status line, it tells you
  which command it's replacing.

One did get through. The first version never showed `cache cold`: once the
cache expired, the cold state was never reached, and I only noticed when
testing with an expired timestamp. That's why the test fixtures now pin the
clock and cover warm, cold and missing data.

## Install

You need `bash`, `jq` and `git`, on macOS or Linux.

```sh
git clone https://github.com/shivamsingh262/moodline.git
cd moodline
./install.sh
```

This copies the scripts to `~/.claude/moodline/` and adds the status line and
the four hooks to `~/.claude/settings.json`. It respects `CLAUDE_CONFIG_DIR` if
you've set it. Start a new Claude Code session to see it. Run the installer
again to update, and `./install.sh --uninstall` to remove it.

After installing, the relevant part of `settings.json` looks like this (paths
shortened):

```json
{
  "statusLine": { "type": "command", "command": "~/.claude/moodline/statusline.sh" },
  "hooks": {
    "UserPromptSubmit": [
      { "matcher": "", "hooks": [{ "type": "command", "command": "~/.claude/moodline/moodline-hook.sh working" }] }
    ],
    "Stop": [
      { "matcher": "", "hooks": [{ "type": "command", "command": "~/.claude/moodline/moodline-hook.sh waiting" }] }
    ]
  }
}
```

`StopFailure` and `SessionEnd` are added the same way.

## Configure

Everything is set with environment variables, either in your shell profile or
inline in the command, e.g.
`"MOODLINE_HIDE_HOST=1 ~/.claude/moodline/statusline.sh"`.

| Variable | Default | Effect |
| --- | --- | --- |
| `MOODLINE_HIDE_HOST` | unset | `1` hides `user@host`, for screenshots and streams |
| `MOODLINE_LINES` | `head,limits,spend,name` | Which lines to show, in that order |
| `MOODLINE_WARN` | `50` | Percentage at which bars turn yellow |
| `MOODLINE_CRIT` | `80` | Percentage at which bars turn red |
| `MOODLINE_FACE_WORKING`, `_WAITING`, `_NIGHT`, `_NOREPO`, `_DIRTY`, `_CLEAN` | the faces above | Your own avatars |

For example, `MOODLINE_LINES=head,limits` gives you a two-line status line with
just the model and the usage bars.

## Testing a status line

The output depends on the clock, the timezone, the git state and the hook
state, so the tests pin all of them. `MOODLINE_NOW` replaces the current time,
`TZ` is UTC, `HOME` is a temp directory with a plain folder and two throwaway
git repos (one clean, one with an untracked file), and the state directory is
temporary too.

Each case feeds a JSON fixture to `statusline.sh`, strips the color codes and
compares the result with a golden file in `test/expected/`. There are ten of
them: clean, dirty, no repo, working, waiting, night, cold cache, over 200k, a
line filter and a custom face. Since thresholds only change colors, that test
checks the raw escape codes instead. Other tests feed the hook a session ID of
`../escape` and check nothing is written outside the state directory.

The run ends with the installer. It starts from a `settings.json` with a theme
and someone else's `Stop` hook, installs twice, and checks there are exactly
four moodline hooks and the other hook is still there. Then it uninstalls and
checks the file is back to what it was. CI runs all of it on Ubuntu and macOS,
along with `shellcheck`.

The code is MIT licensed and on
[GitHub](https://github.com/shivamsingh262/moodline).
