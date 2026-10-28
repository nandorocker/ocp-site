---
layout: page.njk
title: How do I start using OCP?
description: Create a shared configuration, make two profiles, and learn what setup, apply, and use do.
navKey: quick-start
permalink: /quick-start/index.html
---
Let's make two profiles that share a setting, then use one in OpenCode. Start with [OCP installed](../install/). You can do this locally; you won't need Git until you want to sync with another machine.

## What am I creating?

Your **source** is a directory of files you edit and keep. A **profile** describes a configuration for a particular kind of work. OCP reads the source and **renders** (generates) the configuration files your harness uses.

A **harness** is the application that runs your coding session and connects to models and tools. OpenCode is the harness supported today. OCP prepares its configuration; it doesn't replace the coding agent or its provider login.

Edit your source when you want to change something. Generated files belong to OCP, so changes made there can block the next render instead of flowing back into your source.

## Make a source directory

Choose a directory you aren't already using for another configuration. This example uses `~/ocp-config`:

```sh
mkdir -p ~/ocp-config/profiles
cd ~/ocp-config
```

Create `ocp.yaml` in that directory:

```yaml ocp.yaml
version: 1

config:
  formatter: true
```

YAML stores settings as `key: value` pairs. Indentation groups related settings, so use spaces rather than tabs. Here, `formatter` is a native OpenCode setting inside `config`, and every profile will share it. `version: 1` selects OCP's configuration format.

## Add your first profile

Create `profiles/everyday.yaml`:

```yaml profiles/everyday.yaml
config:
  model: openai/your-coding-model
```

**The model ID is a placeholder.** Replace it with a model available through your OpenCode provider. OCP does not supply model access or credentials.

Now create `profiles/focused.yaml`:

```yaml profiles/focused.yaml
extends: everyday
config:
  model: anthropic/your-review-model
```

Replace that model ID too. `extends` means “start with the everyday profile, then apply these differences.” Both profiles keep the shared formatter setting; `focused` changes the model. You can use the same provider for both.

## Set up OCP

Before continuing, keep a backup of any OpenCode configuration you care about. Setup preserves an existing global configuration so you can restore it later with `ocp reset`. OCP will manage the global configuration path used by OpenCode.

```sh
ocp setup --source "$HOME/ocp-config" --machine laptop
```

Passing `--source` selects this directory without interactive prompts. `--machine laptop` gives this machine a name you can use for local settings later; choose a name that makes sense for yours. Git is not required for this example.

Check the result:

```sh
ocp status
ocp list
```

Status shows the source and active profile. The profile list should include `everyday` and `focused`.

## Apply and choose a profile

```sh
ocp apply
ocp use focused
opencode
```

`apply` renders the source without Git sync. `use focused` chooses the rendered profile for subsequent OpenCode runs. `opencode` starts the coding session. Make sure you've authenticated in OpenCode with the provider you selected.

To use another profile for one run without changing the active profile:

```sh
ocp run everyday
```

## Change something

Edit the model in `profiles/focused.yaml`, then run `ocp apply` again. Run `ocp status` to check which profile is active. You don't need to copy generated files or edit another configuration directory.

Later, `ocp sync` can synchronize a Git-backed source and render profiles in one operation. It can commit source changes when automatic commits are enabled, and can push existing commits even when they're disabled. Read [how sync works](../docs/#machines) before using it on a shared repository.

## Where do I go from here?

- [Learn how profiles and shared components work](../docs/#profiles).
- [Bring the setup to another machine](../docs/#machines).
- [Edit profiles in the browser](../docs/#browser), or [ask a coding agent to help](../docs/#agents).
- [Restore your earlier configuration](../docs/#reset) if you want to undo setup.
