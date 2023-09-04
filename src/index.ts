import process from 'process';
import { Client, GatewayIntentBits, Events } from 'discord.js';
import { pttParserConfig } from './parser/ptt-parser.js';
// import { wikipediaParserConfig } from './parser/wikipedia-parser.js';
import { lineTodayParserConfig } from './parser/line-today-parser.js';
import { createMessageEmbed } from './embed.js';

const APP_ID = process.env.DISCORD_CLIENT_ID || '';
const BOT_TOKEN = process.env.DISCORD_TOKEN || '';

function notInQuote(str: string, position: number | undefined): boolean {
  const startIndex = str.lastIndexOf('\n', position);
  return !str.slice(startIndex + 1, position).includes('>');
}

function matchURL(re: RegExp, content: string): RegExpMatchArray | null {
  const match = content.match(re);
  return match && notInQuote(content, match.index) ? match : null;
}

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

bot
  .on(Events.ClientReady, () => {
    console.log('Aqua bot is ready');
    // Manage Message
    console.log(
      `https://discord.com/api/oauth2/authorize?client_id=${APP_ID}&permissions=8192&scope=bot%20applications.commands`
    );
  })
  .on(Events.MessageCreate, async (message) => {
    if (!message.author || message.author.bot || !message.content) {
      return;
    }
    const content = message.content;
    let embed: ReturnType<typeof createMessageEmbed> | null = null;
    try {
      for (const { match, transform } of [
        pttParserConfig,
        // wikipediaParserConfig,
        lineTodayParserConfig,
      ]) {
        const m = matchURL(match, content);
        if (m) {
          const embedConfig = await transform(m);
          if (embedConfig) {
            embed = createMessageEmbed(embedConfig);
          }
          break;
        }
      }
    } catch (e) {
      console.error(e);
    }

    if (embed) {
      message.suppressEmbeds(true);
      message.reply({ embeds: [embed] });
    }
  })
  .on('error', () => {
    /* ignore */
  });

bot.login(BOT_TOKEN);
