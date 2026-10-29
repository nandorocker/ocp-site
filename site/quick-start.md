---
layout: page.njk
title: Getting started with OCP
description: Install OCP on macOS or Linux, create a shared source, and use your first OpenCode profiles.
navKey: quick-start
permalink: /quick-start/index.html
---
Setup is easy: import your existing config or start fresh. Switching profiles is a breeze, and you can sync across machines with one command.

<h2 id="install">Install OCP</h2>

Choose your system, then run the installer in your terminal.

<div class="install-tabs">
<div class="install-tablist" aria-label="Operating system" hidden>
<button type="button" id="tab-macos" data-panel="macos">macOS</button>
<button type="button" id="tab-linux" data-panel="linux">Linux</button>
</div>

<div class="install-panel" id="macos">

<h3>macOS</h3>

Works on Apple silicon and Intel Macs.

```sh Install OCP on macOS
curl -fsSL https://raw.githubusercontent.com/nandorocker/ocp/main/install.sh | sh
```

If `ocp` isn't found, add the install directory to your zsh `PATH`, then open a new terminal:

```sh ~/.zshrc
export PATH="$HOME/.local/bin:$PATH"
```

</div>

<div class="install-panel" id="linux">

<h3>Linux</h3>

Works on x86-64 and ARM64. You'll need `curl`, `tar`, and a checksum tool (`sha256sum`, `shasum`, or `openssl`).

```sh Install OCP on Linux
curl -fsSL https://raw.githubusercontent.com/nandorocker/ocp/main/install.sh | sh
```

If `ocp` isn't found, add this to `~/.bashrc` (or `~/.zshrc` for zsh), then open a new terminal:

```sh Shell profile
export PATH="$HOME/.local/bin:$PATH"
```

</div>
</div>

The installer verifies the release checksum and installs to `~/.local/bin`. Rerun it to update. [Read the installer](https://github.com/nandorocker/ocp/blob/main/install.sh) or [download a release](https://github.com/nandorocker/ocp/releases). Native Windows isn't supported yet.

## Make a source directory

Keep shared settings and profiles in a source directory. Edit these files, not the generated config. Choose a fresh directory, such as `~/ocp-config`:

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
- [Ask a coding agent to help](../docs/#agents).
- [Restore your earlier configuration](../docs/#reset) if you want to undo setup.
