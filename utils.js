import 'dotenv/config';

export async function DiscordRequest(endpoint, options, retryCount = 0) {
  const url = 'https://discord.com/api/v10/' + endpoint;
  if (options.body) options.body = JSON.stringify(options.body);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'User-Agent': 'DiscordBot (discord-bot-template, 1.0.0)',
    },
    ...options
  });

  if (res.status === 429) {
    let retryAfter = 1.0;
    try {
      const data = await res.json();
      retryAfter = data.retry_after || retryAfter;
      console.log('Rate limited. Retrying after', retryAfter, 'seconds');
    } catch (e) {
      console.log('Rate limit without body, using default 1s');
    }
    await new Promise(r => setTimeout(r, Math.ceil(retryAfter * 1000)));
    if (retryCount > 10) throw new Error('Too many rate limit retries');
    return DiscordRequest(endpoint, options, retryCount + 1);
  }

  if (!res.ok) {
    let data;
    try { data = await res.json(); } catch (_) { data = { message: 'Unknown error' }; }
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  return res;
}

export async function InstallGlobalCommands(appId, commands) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${appId}/commands`;

  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    await DiscordRequest(endpoint, { method: 'PUT', body: commands });
  } catch (err) {
    console.error(err);
  }
}

export async function InstallGuildCommands(appId, guildId, commands) {
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;

  try {
    await DiscordRequest(endpoint, { method: 'PUT', body: commands });
  } catch (err) {
    console.error(err);
  }
}

// Simple method that returns a random emoji from list
export function getRandomEmoji() {
  const emojiList = ['😭','😄','😌','🤓','😎','😤','🤖','😶‍🌫️','🌏','📸','💿','👋','🌊','✨'];
  return emojiList[Math.floor(Math.random() * emojiList.length)];
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
