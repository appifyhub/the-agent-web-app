![License](https://img.shields.io/github/license/appifyhub/the-agent-web-app?logo=github&logoColor=white&label=License&color=FA3080)
![Code](https://img.shields.io/github/repo-size/appifyhub/the-agent-web-app?logo=github&logoColor=white&label=Sources&color=FAFA20)
![Issues](https://img.shields.io/github/issues-closed/appifyhub/the-agent-web-app?logo=github&logoColor=white&label=Issues&color=blue)
![PRs](https://img.shields.io/github/issues-pr-closed/appifyhub/the-agent-web-app?logo=github&logoColor=white&label=PRs&color=blue)

# The Agent's Web App

A modern, open-source frontend for [The Agent](https://github.com/appifyhub/the-agent) – your open intelligent virtual assistant. Built for speed, accessibility, and a beautiful user experience.

## About the project

The Agent's Web App is the official frontend for interacting with The Agent, providing a fast, responsive, and visually appealing interface (or at least, trying to). It is designed with a focus on:

- Modern, clean aesthetics (with dark, accented gradients)
- Accessibility and responsiveness
- Clear, readable text and intuitive controls
- Multi-language support, so you can use it in your language

See the rest of this document for a developer's overview and information on how to use it yourself.

### Access

This app currently supports several Telegram bots. For privacy reasons, we're not listing each bot here individually – but you can run [the service](https://github.com/appifyhub/the-agent) locally on your machine and connect it to your own bot, and use this app to interact with it.

## ⚠️ Before you continue…

If you plan on contributing to this project in any way, please read and acknowledge the [Contributing guide](./CONTRIBUTING.md) first.

Please also take note of the [License](./LICENSE).

## Developer's Overview

Because the complete codebase is open-source, you can inspect and run the service yourself.

### Tech Stack

- **Framework**: React
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS, PostCSS
- **UI Libraries**: Radix UI, Lucide Icons
- **Routing**: React Router
- **State/Theme**: next-themes
- **Linting/Formatting**: ESLint, Stylelint

### Getting Started

#### Prerequisites

- [Bun](https://bun.sh) (v1.2.+ recommended)
- [Node.js](https://nodejs.org) (v23.11.+ recommended)

#### Installation

```sh
bun install
```

#### Development

If the prerequisites are met, you still need to provide a single piece of information to run the app: the environment file. You can create it by copying the example file:

```sh
cp .env.example .env
```

Edit the `.env` file to point the frontend to the right backend. Then you can run the app:

```sh
bun run dev
```

or, if you want to expose the app to the network, use:

```sh
bun run dev --host
```

This will live-update the app as you make changes. Check the console for the URL.

#### Linting & Formatting

```sh
bun run lint
```

#### Build for Production

```sh
bun run build
```

#### Help and other tools

The tool list will be kept updated in the `package.json` file, and to see the whole list of tools, you can run:

```sh
bun run
```

### License

Check out the license [here](./LICENSE).

---

For backend and API details, see the [backend repository](https://github.com/appifyhub/the-agent).
