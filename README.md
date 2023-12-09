# Highlighter

manage, display the highlights, and comment them in a elegant way.

## ⚙️ Usage

## 📥 Installation

- [ ] From Obsidian's community plugins
- [x] Using BRAT with `https://github.com//highlighter`
- [x] From the release page:
- Download the latest release
- Unzip `highlighter.zip` in `.obsidian/plugins/` path
- In Obsidian settings, reload the plugin
- Enable the plugin

## 🤖 Developing

To make changes to this plugin, first ensure you have the dependencies installed.

```
npm install
```

To start building the plugin with what mode enabled run the following command:

```
npm run dev
```

> **Note**
> If you haven't already installed the hot-reload-plugin you'll be prompted to. You need to enable that plugin in your obsidian vault before hot-reloading will start. You might need to refresh your plugin list for it to show up.
> To start a release build run the following command:

```
npm run build
```

> **Note**
> You can use the `.env` file with adding the key `VAULT_DEV` to specify the path to your Obsidian (development) vault. This will allow you to test your plugin without specify each times the path to the vault.

### 📤 Export

You can use the `npm run export` command to export your plugin to your Obsidian Main Vault. To do that, you need the `.env` file with the following content:

```env
VAULT="path/to/your/obsidian/vault"
VAULT_DEV="path/to/your/dev/vault"
```