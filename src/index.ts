import process from 'process';
import { Client, MessageEmbed } from 'discord.js';
import axios from 'axios';
import pttParser from './ptt-parser.js';
import ImageCommandHandler from './image-commands.js';
import { SlashCommandController } from './slash-command.js';

const APP_ID = process.env.DISCORD_CLIENT_ID || '';
const BOT_TOKEN = process.env.DISCORD_TOKEN || '';

const imageCommandHandler = new ImageCommandHandler();

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
    const { title, author, description } = result;
    return new MessageEmbed()
      .setURL(url)
      .setTitle(title)
      .setAuthor(author)
      .setDescription(
        description.length > 100
          ? `${description.substr(0, 100)}...`
          : description
      );
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
    let msg: MessageEmbed | null = null;
    try {
      let match: RegExpMatchArray | null;
      if (
        (match = content.match(
          /https?:\/\/www.ptt.cc\/bbs\/gossiping\/[\w.]+.html/i
        )) &&
        notInQuote(content, match.index)
      ) {
        msg = await createPTTEmbed(match[0]);
      }
    } catch (e) {
      console.error(e);
    }

    if (msg) {
      message.channel?.send(msg);
    }
  })
  .on('error', () => {
    /* ignore */
  });

bot.login(BOT_TOKEN);
