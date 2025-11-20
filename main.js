import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import {
  ButtonStyleTypes,
  InteractionResponseFlags,
  InteractionResponseType,
  InteractionType,
  MessageComponentTypes,
  verifyKeyMiddleware,
} from 'discord-interactions';
import { getRandomEmoji, DiscordRequest } from './utils.js';

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// To keep track of our active games
const activeGames = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 * Parse request body and verifies incoming requests using discord-interactions package
 */
app.post('/interactions', verifyKeyMiddleware(process.env.PUBLIC_KEY), async function (req, res) {
  // Interaction id, type and data
  const { id, type, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;

    // "test" command
    if (name === 'test') {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: InteractionResponseFlags.IS_COMPONENTS_V2,
          components: [
            {
              type: MessageComponentTypes.TEXT_DISPLAY,
              // Fetches a random emoji to send from a helper function
              content: `Ping ${getRandomEmoji()}`
            }
          ]
        },
      });
    }

    // "cstart" command - export messages containing "Sprachkanal", sorted by timestamp
    if (name === 'cstart') {
      const channelId = req.body.channel_id;
      const guildId = req.body.guild_id;
      
      // Respond with ephemeral acknowledgement (invisible to others) and auto-delete
      res.send({
        type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          flags: 64 // EPHEMERAL flag - only visible to user who ran the command
        }
      });

      // Fetch messages asynchronously (paginate all)
      try {
        const allMessages = [];
        let before = undefined;

        // Collect all messages from the channel
        while (true) {
          const endpoint = `channels/${channelId}/messages?limit=100` + (before ? `&before=${before}` : '');
          const batchRes = await DiscordRequest(endpoint, { method: 'GET' });
          const batch = await batchRes.json();
          if (!Array.isArray(batch) || batch.length === 0) break;

          allMessages.push(...batch);
          before = batch[batch.length - 1].id;
          
          // Brief delay to smooth bursts (rate limit handler in DiscordRequest handles 429)
          await new Promise((r) => setTimeout(r, 250));
        }

        // Sort by message timestamp (oldest first)
        allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        // Filter: only messages with embeds
        const filteredMessages = allMessages.filter((msg) => {
          return msg.embeds && msg.embeds.length > 0;
        });

        // Create logs directory if it doesn't exist
        const logsDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }

        // Prepare output file
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const filename = `messages_${channelId}_${timestamp}.txt`;
        const filepath = path.join(logsDir, filename);
        const stream = fs.createWriteStream(filepath, { encoding: 'utf8' });

        // Header
        stream.write(`=== Channel Messages Export ===\n`);
        stream.write(`Channel ID: ${channelId}\n`);
        stream.write(`Guild ID: ${guildId}\n`);
        stream.write(`Exported: ${new Date().toLocaleString('de-DE')}\n`);
        stream.write(`Total Messages Fetched: ${allMessages.length}\n`);
        stream.write(`Messages with Embeds: ${filteredMessages.length}\n`);
        stream.write(`${'='.repeat(50)}\n\n`);

        // Write filtered messages in chronological order
        filteredMessages.forEach((msg, index) => {
          const date = new Date(msg.timestamp).toLocaleString('de-DE');
          stream.write(`[${index + 1}] ${date}\n`);
          stream.write(`Author: ${msg.author.username}#${msg.author.discriminator} (ID: ${msg.author.id})\n`);
          stream.write(`Content: ${msg.content || '[Keine Textnachricht]'}\n`);

          if (msg.attachments && msg.attachments.length > 0) {
            stream.write(`Attachments: ${msg.attachments.map(a => a.url).join(', ')}\n`);
          }

          if (msg.embeds && msg.embeds.length > 0) {
            stream.write(`\n📋 Einbettungen (${msg.embeds.length}):\n`);
            msg.embeds.forEach((embed, embedIndex) => {
              stream.write(`  --- Embed ${embedIndex + 1} ---\n`);
              if (embed.title) stream.write(`  Titel: ${embed.title}\n`);
              if (embed.description) stream.write(`  Beschreibung: ${embed.description}\n`);
              if (embed.url) stream.write(`  URL: ${embed.url}\n`);
              if (embed.author) {
                stream.write(`  Autor: ${embed.author.name || ''}\n`);
                if (embed.author.url) stream.write(`  Autor URL: ${embed.author.url}\n`);
              }
              if (embed.fields && embed.fields.length > 0) {
                stream.write(`  Felder:\n`);
                embed.fields.forEach((field) => {
                  stream.write(`    • ${field.name}: ${field.value}\n`);
                });
              }
              if (embed.footer) stream.write(`  Footer: ${embed.footer.text || ''}\n`);
              if (embed.timestamp) {
                const embedDate = new Date(embed.timestamp).toLocaleString('de-DE');
                stream.write(`  Zeitstempel: ${embedDate}\n`);
              }
              if (embed.image) stream.write(`  Bild: ${embed.image.url}\n`);
              if (embed.thumbnail) stream.write(`  Thumbnail: ${embed.thumbnail.url}\n`);
              if (embed.video) stream.write(`  Video: ${embed.video.url}\n`);
              stream.write(`\n`);
            });
          }

          stream.write(`\n${'\u2500'.repeat(50)}\n\n`);
        });

        stream.end();

        // Delete the deferred response (no message in channel)
        await DiscordRequest(`webhooks/${process.env.APP_ID}/${req.body.token}/messages/@original`, {
          method: 'DELETE'
        });

      } catch (error) {
        console.error('Error fetching messages:', error);
        // Silently delete the interaction response on error too
        try {
          await DiscordRequest(`webhooks/${process.env.APP_ID}/${req.body.token}/messages/@original`, {
            method: 'DELETE'
          });
        } catch (deleteError) {
          // Ignore deletion errors
        }
      }

      return;
    }

    console.error(`unknown command: ${name}`);
    return res.status(400).json({ error: 'unknown command' });
  }

  console.error('unknown interaction type', type);
  return res.status(400).json({ error: 'unknown interaction type' });
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
