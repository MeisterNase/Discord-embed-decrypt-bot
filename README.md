# Discord Bot Template

A simple Discord bot template to decrypt all embed messages in a discord channel. Auto export function. This bot can be hosted locally with ngrok and provides slash commands.

## 🎯 Features

- **Test Command** (`/test`): Simple test command
- **Message Export** (`/cstart`): Exports all embed messages from the channel to a text file

## 📋 Prerequisites

- [Node.js](https://nodejs.org/en/download/) (Version 18 or higher)
- A Discord account
- [ngrok](https://ngrok.com/) for local hosting

## 🚀 Installation

### 1. Clone the repository

```bash
git clone (https://github.com/MeisterNase/Discord-embed-decrypt-bot.git)
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create Discord App

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click on "New Application"
3. Give your app a name
4. Go to the "Bot" tab and create a bot
5. Enable the following Privileged Gateway Intents under "Bot":
   - Message Content Intent (if you want to read message contents)
6. Go to the "OAuth2" → "URL Generator" tab
7. Select the following scopes:
   - `applications.commands`
   - `bot`
8. Select under "Bot Permissions":
   - Read Messages/View Channels
   - Send Messages
   - Read Message History
9. Copy the generated URL or installation app URL and add your bot to your server and user

### 4. Configure credentials

1. rename `.env.sample` to `.env`

2. Fill in the `.env` file with your Discord app credentials:
   - **APP_ID**: Found under "General Information" → "Application ID"
   - **DISCORD_TOKEN**: Found under "Bot" → "Token" (click "Reset Token" if needed)
   - **PUBLIC_KEY**: Found under "General Information" → "Public Key"
   - **GUILD_ID** (optional): Your test server ID for faster command registration during development

### 5. Register slash commands

```bash
npm run register
```

> **Tip**: With `GUILD_ID` set, commands are registered as guild commands (visible within seconds). Without `GUILD_ID`, commands are registered globally (can take up to 1 hour).

### 6. Set up ngrok

1. [Install ngrok](https://ngrok.com/download)
2. Start ngrok on port 3000:
   ```bash
   ngrok http 3000
   ```

3. Copy the HTTPS fourward URL (e.g. `https://1234-abcd.ngrok.io`)
4. Go to your app in the [Discord Developer Portal](https://discord.com/developers/applications)
5. Navigate to "General Information"
6. Add your ngrok URL + `/interactions` to "Interactions Endpoint URL":
   ```
   https://1234-abcd.ngrok.io/interactions
   ```
7. Click "Save Changes"

### 7. Start the bot

```bash
npm start
```
## 📝 Available Commands

### `/test`
Simple test command that returns a message

### `/cstart`
Exports all messages with embeds from the current channel. Messages are sorted chronologically and saved to a text file in the `logs/` folder.

**Note**: The command is only visible to the executing user (ephemeral) and deletes itself automatically after completion.

## 🛠️ Project Structure

```
├── main.js         -> Main entry point of the bot
├── commands.js     -> Slash command definitions
├── utils.js        -> Helper functions
├── .env.sample     -> Sample environment variables file
├── package.json    -> Node.js dependencies
└── logs/           -> Exported message logs (created automatically)
```

## 🔧 Customization

### Adding custom commands

1. Define your command in `commands.js`:
```javascript
const MY_COMMAND = {
  name: 'mycommand',
  description: 'Description of my command',
  type: 1,
  integration_types: [0, 1],
  contexts: [0, 1, 2],
};
```

2. Add the command to the `ALL_COMMANDS` array

3. Implement the command logic in `main.js` under `InteractionType.APPLICATION_COMMAND`

4. Re-register the commands with `npm run register`

### Customizing message export

The export filter in `main.js` currently exports all messages with embeds. You can customize the filter logic around line ~95 to match your specific needs.

## 📦 Dependencies

- **discord-interactions**: Discord Interactions API
- **dotenv**: Load environment variables
- **express**: Web server for interactions endpoint
- **nodemon** (dev): Auto-restart on file changes

## 🐛 Troubleshooting

### Commands not showing up
- Make sure you ran `npm run register`
- With global registration (without `GUILD_ID`) it can take up to 1 hour
- Set `GUILD_ID` in `.env` for instant visibility on your test server

### Bot not responding
- Check if ngrok is running and the URL is correctly entered in Discord
- Make sure the bot is running (`npm start`)
- Check the console for errors

### Rate Limit Errors
The `DiscordRequest` function in `utils.js` automatically handles rate limits with retry logic.

## 📄 License



