import process from 'process';
import { APIMessage, Client, MessageEmbed } from 'discord.js';
import { pttParserConfig } from './ptt-parser.js';
import { fbParserConfig, fbVideoParserConfig } from './fb-parser.js';
import { wikipediaParserConfig } from './wikipedia-parser.js';
import { createMessageEmbed } from './embed.js';
import ImageCommandHandler from './image-commands.js';
import { SlashCommandController } from './slash-command.js';

const APP_ID = process.env.DISCORD_CLIENT_ID || '';
const BOT_TOKEN = process.env.DISCORD_TOKEN || '';

const imageCommandHandler = new ImageCommandHandler();

function notInQuote(str: string, position: number | undefined): boolean {
  const startIndex = str.lastIndexOf('\n', position);
  return !str.slice(startIndex + 1, position).includes('>');
}

function matchURL(re: RegExp, content: string): RegExpMatchArray | null {
  const match = content.match(re);
  return match && notInQuote(content, match.index) ? match : null;
}

new SlashCommandController(APP_ID, BOT_TOKEN).create({
  name: 'post',
  description: '貼文',
  options: [
    {
      name: 'image',
      description: '圖片名稱',
      type: 3,
      required: true,
      choices: imageCommandHandler.getChoices(),
    },
  ],
});

const bot = new Client();

bot
  .on('ready', () => {
    console.log('Aqua bot is ready');
    // Manage Message
    console.log(
      `https://discord.com/api/oauth2/authorize?client_id=${APP_ID}&permissions=8192&scope=bot%20applications.commands`
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SlashCommandController.registerHandler(bot, 'post', (options: any) => {
      if (options[0]?.name === 'image') {
        const embed = imageCommandHandler.get(options[0]?.value);
        return embed
          ? {
              content: '',
              embeds: [embed],
            }
          : null;
      }
      return null;
    });
  })
  .on('message', async (message) => {
    if (!message.author || message.author.bot || !message.content) {
      return;
    }
    const content = message.content;
    let embed: MessageEmbed | null = null;
    try {
      for (const { match, transform } of [
        pttParserConfig,
        fbParserConfig,
        fbVideoParserConfig,
        wikipediaParserConfig,
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

    if (embed && message.channel) {
      const apiMessage = APIMessage.create(message.channel, undefined, embed);
      apiMessage.resolveData = function (): APIMessage {
        APIMessage.prototype.resolveData.call(this);
        if (
          !Object.prototype.hasOwnProperty.call(this.data, 'message_reference')
        ) {
          this.data = {
            ...this.data,
            message_reference: {
              message_id: message.id,
              channel_id: message.channel.id,
            },
          };
        }
        return this;
      };
      message.channel.send(apiMessage);
    }
  })
  .on('error', () => {
    /* ignore */
  });

bot.login(BOT_TOKEN);
