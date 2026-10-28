---
layout: page.njk
title: How do I install OCP?
description: Install OCP on macOS or Linux, check your PATH, and verify the installed version.
navKey: install
permalink: /install/index.html
---
OCP is a command-line program. The installer downloads a release for your operating system and processor, checks its SHA-256 checksum, and places the executable in `~/.local/bin`.

Choose your operating system: [macOS](#macos) or [Linux](#linux). You don't need Go to install a release. Install [OpenCode](https://opencode.ai/docs/) separately and authenticate with your model provider before running coding sessions.

## macOS

Both Apple silicon (arm64) and Intel (amd64) releases are available. Open Terminal and run:

```sh
curl -fsSL https://raw.githubusercontent.com/nandorocker/ocp/main/install.sh | sh
```

The installer needs `curl`, `tar`, and a checksum tool. It accepts `shasum`, `sha256sum`, or `openssl`. You can [read the installer](https://github.com/nandorocker/ocp/blob/main/install.sh) before running it.

If `ocp version` says “command not found”, add the install directory to your `PATH`. `PATH` is the list of directories your shell searches for commands.

For zsh, the default shell on recent macOS versions, add this line to `~/.zshrc`:

```sh
export PATH="$HOME/.local/bin:$PATH"
```

Open a new terminal, then run `ocp version`. If you use Bash, put the line in the startup file your terminal reads, such as `~/.bash_profile`.

## Linux

Releases are available for x86-64 (amd64) and ARM64 (arm64). You need `curl`, `tar`, and one of `sha256sum`, `shasum`, or `openssl`. Install missing tools through your distribution's package manager, then run:

```sh
curl -fsSL https://raw.githubusercontent.com/nandorocker/ocp/main/install.sh | sh
```

Run `ocp version` to check the installation. If your shell cannot find OCP, add this to `~/.bashrc` for Bash or `~/.zshrc` for zsh:

```sh
export PATH="$HOME/.local/bin:$PATH"
```

Open a new terminal and try again. For other shells, use that shell's syntax for adding a directory to `PATH`. The default installation stays in your home directory and does not need `sudo`.

## What about Windows?

Native Windows isn't supported yet. The current installer and release downloads target macOS and Linux. We haven't established a tested WSL setup to document here.

## Can I download it myself?

Yes. [Browse the releases](https://github.com/nandorocker/ocp/releases), download the archive for your OS and architecture, and check it against `checksums.txt` from that release. Extract `ocp`, make it executable, and put it in a directory on your `PATH`.

You can also choose the installer's version and destination. This example installs version 0.1.2 in your home directory:

```sh
curl -fsSL https://raw.githubusercontent.com/nandorocker/ocp/main/install.sh | OCP_VERSION=0.1.2 OCP_INSTALL="$HOME/.local/bin" sh
```

## How do I update or remove OCP?

Rerun the installer to install the latest release, or set `OCP_VERSION` to choose one. Read the release notes before updating. `ocp upgrade` is currently deferred; it does not update the executable.

Removing the executable and restoring your previous configuration are different operations. If you want to stop using OCP, first read [how to restore your existing configuration](../docs/#reset). Don't delete OCP's state or preserved configuration before resetting it.

After detaching OCP, remove the `ocp` executable from the directory where you installed it. This does not remove your source repository.

## What next?

Follow the [quick start](../quick-start/). It explains what you'll create, what OCP changes, and how to run your first profile. If you prefer to build OCP from source, see the [software repository's developer setup](https://github.com/nandorocker/ocp#developer-setup).
