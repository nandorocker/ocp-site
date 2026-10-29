---
layout: page.njk
title: Using OCP
description: Understand profiles, shared components, multiple machines, agent-assisted configuration, and OCP's commands.
navKey: docs
permalink: /docs/index.html
---
OCP reads a source directory you maintain and generates configuration for your coding-agent harness. OpenCode is supported today; other harnesses are coming soon. If you're starting from scratch, [install OCP and follow the quick start](../quick-start/).

<h2 id="profiles">Profiles</h2>

Keep shared settings in `ocp.yaml`. Each profile adds the differences it needs. A profile can inherit another profile with `extends`:

```yaml ocp.yaml
version: 1
config:
  formatter: true
```

```yaml profiles/everyday.yaml
config:
  model: openai/your-coding-model
```

```yaml profiles/review.yaml
extends: everyday
config:
  model: anthropic/your-review-model
```

The model IDs are placeholders. Replace them with IDs available through your own OpenCode providers. Both profiles inherit the formatter setting; `review` changes the model.

```sh
ocp apply
ocp list
ocp use review
```

`apply` renders your local source. `use` activates an already rendered profile for subsequent OpenCode runs. `ocp run everyday` uses a profile for one run without changing the active one.

Edit source files, not generated configuration. Generated edits count as drift and can block the next render. Applying normally keeps your active profile. If you remove it, OCP falls back to `default` when available; otherwise no profile is active. Check `ocp status` after changing profile names or host availability.

### Shared components

Instructions, agents, skills, and plugins can live in the same source:

```yaml ocp.yaml with shared components
version: 1
instructions:
  - instructions/shared.md
agents:
  reviewer:
    file: agents/reviewer.md
skills:
  - writing
plugins:
  - harness-bridge.ts
```

Create the referenced files and directories before applying. Agent and instruction paths are relative to the source root. Local skills live under `skills/`, such as `skills/writing/SKILL.md`; local plugin files live under `plugins/`. A folder's existence doesn't enable a component: list what the profile should use.

An agent Markdown file can contain native OpenCode frontmatter. Assign a different model in a profile with `agents.reviewer.model` without duplicating that Markdown. Native settings belong inside `config`; consult the [OpenCode configuration documentation](https://opencode.ai/docs/config/) for its options.

### Inheritance and merge rules

`extends` accepts one parent. Native configuration objects merge recursively; child scalar values and arrays replace parent values. Instructions append uniquely, agents merge by name, and skills and plugins combine by identity. An empty list does not generally remove inherited components. Put optional components in narrower profiles instead.

Profiles can be flat files such as `profiles/review.yaml` or directories with `profiles/review/profile.yaml`; an optional `guide.md` beside the latter becomes profile instructions. Don't declare the same profile name in both layouts or mix file profiles with legacy inline `profiles` in `ocp.yaml`.

### Git-backed skills

Declare an explicit Git source. This repository and ref are placeholders:

```yaml
skills:
  - git: https://github.com/example/example-skill.git
    ref: refs/heads/main
```

Setup, or sync when bootstrapping is allowed, records the resolved commit in `ocp.lock`. Keep that file in Git so other machines use the same skill content. `apply` needs matching lock entries and won't initialize a new Git skill. `ocp upgrade` is deferred; don't delete lockfiles to work around a mismatch.

<h2 id="machines">Multi-machine setup</h2>

Keep the source at the root of a Git repository. A repository tracks versions of your files; a commit records changes, and a branch's upstream names the remote branch it exchanges them with. OCP uses that upstream rather than assuming `origin/main`.

Set up Git authentication on the new machine first. Replace this repository with your own trusted source and choose an empty destination:

```sh
ocp setup --repo git@github.com:you/agent-config.git --source "$HOME/.config/ocp" --machine laptop
ocp status
ocp sync
```

For an existing checkout, use `ocp setup --source /path/to/checkout --machine laptop`. The branch needs one configured upstream. OCP doesn't manage Git credentials; repository operations disable terminal prompting.

### Git sync and publishing

Automatic commits are enabled by default. Sync can stage all repository changes, including untracked files, commit, fetch, merge, and push, then prepare locked skills and render profiles. Review `git status` and ignore rules before syncing. Keep credentials and session history outside the source; ignoring a file doesn't protect secrets already tracked.

`setup --no-auto-commit` disables automatic commits, **not pushes**. Sync can still push commits you made yourself, and a dirty source blocks it until you handle the changes. Use `ocp apply` when you only want local rendering. Resolve Git conflicts manually; `--force` is not a Git conflict-resolution option.

### Machine-specific settings

Choose a machine name during setup and use it in profile overlays. This is an example for a local model endpoint:

```yaml profiles/local.yaml
machines:
  laptop:
    config:
      provider:
        ollama:
          options:
            baseURL: http://127.0.0.1:11434/v1
```

Add `hosts: [laptop]` to render that profile only there. Without a host restriction it renders on other machines too. A `hosts/laptop.md` file, when present, adds instructions on that machine. Confirm its name with `ocp status`.

<h2 id="existing-setup">Importing an existing configuration</h2>

Keep an independent backup before adopting OCP. You can import an OpenCode directory into a fresh source and inspect the result before setup. Replace both example paths:

```sh
ocp import --source /path/to/new-source /path/to/existing-opencode
ocp setup --source /path/to/new-source
```

Import is best-effort: it reads strict JSON and copies recognized instructions, agent Markdown, and local skills. Inspect plugins and externally referenced files yourself. For JSONC input, convert a separate copy to strict JSON. Import writes source; setup renders it and takes ownership of the global configuration path.

<h3 id="reset">Reset and restoration</h3>

`ocp reset` detaches OCP and restores the original configuration preserved during setup, when available. It leaves your source untouched. It doesn't copy generated-profile edits back into that original configuration. If another tool has replaced the managed path, back it up and inspect the error before approving replacement or using force.

<h2 id="agents">Agent-assisted configuration</h2>

The source is ordinary YAML and Markdown, and agents can use the CLI. Point an agent at the directory reported by `ocp status`, not the generated OpenCode directory. Give it a specific change and ask it to show a diff before applying or syncing.

For example, adapt this prompt to your source. The path and model ID are placeholders:

```text
Work in /path/to/ocp-source. Read ocp.yaml and profiles/review.yaml,
including its parents and referenced reviewer agent.
Change only the reviewer model to provider/example-model.
Explain what it inherits and show the diff.
Ask before running apply, use, sync, reset, or any force option.
Do not push changes or modify credentials.
```

An agent can inspect `ocp status`, `ocp list`, and command help before editing. OCP has no CLI dry-run command in this release. Agree on write operations before it runs them, especially sync, which may publish changes.

If you use something like [T3](https://t3.codes/), OCP helps keep the underlying OpenCode instructions, skills, and profiles consistent between machines. T3 handles the surrounding coding workflow; OCP doesn't configure T3 or sync its sessions. Other harness support is planned.

<h2 id="commands">Command reference</h2>

| Command | What it does |
| --- | --- |
| `ocp setup` | Set up a local source or repository and preserve the existing configuration. |
| `ocp apply` | Render local source without Git sync. |
| `ocp use NAME` | Activate a rendered profile for subsequent sessions. |
| `ocp run NAME [args...]` | Run OpenCode with a profile without changing global activation. |
| `ocp sync` | Synchronize the source repository and render profiles; can commit and push. |
| `ocp list` / `ocp status` | Inspect rendered profiles and local setup. |
| `ocp import [INPUT]` | Import a starter source; use `--source PATH` for an explicit destination. |
| `ocp reset` | Detach OCP and restore its preserved original when available. |
| `ocp version` | Show the installed version. |

Use `ocp help COMMAND` or `ocp COMMAND --help` for options. Put flags before positional arguments. Setup accepts `--source`, `--repo`, `--machine`, and `--no-auto-commit`. Passing a source or repository skips interactive setup prompts. `--force` on apply/sync allows replacement of generated-file drift; it does not force-push Git.

The root configuration accepts `version`, `config`, `instructions`, `agents`, `skills`, `plugins`, and legacy inline `profiles`. File profiles accept `extends`, `hosts`, `machines`, and the composition fields. Unknown OCP keys are errors. Agent/instruction paths are source-relative; skills and local plugins use their standard folders. Don't hand-edit OCP state, manifests, or generated symlinks to bypass validation.

<h2 id="help">Troubleshooting</h2>

- **Command not found:** check `~/.local/bin/ocp version` and the [installation and PATH instructions](../quick-start/#install).
- **Already set up:** use apply or sync for changes. Don't delete state to rerun setup; it records the preserved configuration.
- **Generated files have drifted:** back up edited output, move useful changes into source, and review before allowing replacement.
- **Missing profile or invalid YAML:** check indentation, names, `extends`, host restrictions, and source-relative paths. Don't mix inline and file profiles.
- **Sync fails:** inspect `git status`, your branch's upstream, and repository access. A failed render doesn't prove that an earlier sync step hasn't pushed.
- **Skill-lock errors:** inspect the declaration and matching lock entry. With automatic commits disabled, sync requires matching locks already present. There is no CLI `--bootstrap` flag.

If you're still stuck, [open an issue](https://github.com/nandorocker/ocp/issues) with the error, what you tried, and `ocp version`. Remove credentials and private configuration before sharing logs.
