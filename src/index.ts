import process from 'process';
import { APIMessage, Client, MessageEmbed } from 'discord.js';
import axios from 'axios';
import pttParser from './ptt-parser.js';
import fbParser from './fb-parser.js';
import ImageCommandHandler from './image-commands.js';
import { SlashCommandController } from './slash-command.js';

const APP_ID = process.env.DISCORD_CLIENT_ID || '';
const BOT_TOKEN = process.env.DISCORD_TOKEN || '';

const imageCommandHandler = new ImageCommandHandler();

function createMessageEmbed({
  url,
  title,
  author,
  description,
  thumbnail,
}: {
  url: string;
  title: string;
  author: string;
  description: string;
  thumbnail?: string;
}) {
  const embed = new MessageEmbed()
    .setURL(url)
    .setTitle(title)
    .setAuthor(author)
    .setDescription(
      description.length > 100
        ? `${description.substr(0, 100)}...`
        : description
    );
  if (thumbnail) {
    embed.setThumbnail(thumbnail);
  }
  return embed;
}

async function createPTTEmbed(url: string): Promise<MessageEmbed | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        Cookie: 'over18=1',
      },
    });
    const result = pttParser(response.data);
    if (!result) {
      return null;
    }
    return createMessageEmbed({ ...result, url });
  } catch (e) {
    return null;
  }
}

async function createFbEmbed(path: string): Promise<MessageEmbed | null> {
  try {
    const response = await axios.get(`https://mbasic.facebook.com/${path}`);
    const result = fbParser(response.data);
    if (!result) {
      return null;
    }
    return createMessageEmbed({
      ...result,
      url: `https://www.facebook.com/${path}`,
    });
  } catch (e) {
    return null;
  }
}

function notInQuote(str: string, position: number | undefined): boolean {
  const startIndex = str.lastIndexOf('\n', position);
  return !str.slice(startIndex + 1, position).includes('>');
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
    console.log(
      `https://discord.com/api/oauth2/authorize?client_id=${APP_ID}&permissions=0&scope=bot%20applications.commands`
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
      let match: RegExpMatchArray | null;
      if (
        (match = content.match(
          /https?:\/\/www.ptt.cc\/bbs\/gossiping\/[\w.]+.html/i
        )) &&
        notInQuote(content, match.index)
      ) {
        embed = await createPTTEmbed(match[0]);
      } else if (
        (match = content.match(/https:\/\/www.facebook.com\/([\w./]+)/)) &&
        notInQuote(content, match.index)
      ) {
        embed = await createFbEmbed(match[1]);
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
