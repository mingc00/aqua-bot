import process from 'process';
import { Client, MessageEmbed } from 'discord.js';
import axios from 'axios';
import pttParser from './ptt-parser';
import ImageCommandHandler from './image-commands';

const imageCommandHandler = new ImageCommandHandler();

async function handleCommand(command: string): Promise<MessageEmbed | null> {
  return imageCommandHandler.get(command);
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

const bot = new Client();

bot
  .on('ready', () => {
    console.log('Aqua bot is ready');
    console.log(
      `https://discordapp.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&scope=bot&permissions=0`
    );
  })
  .on('message', async (message) => {
    if (!message.author || message.author.bot || !message.content) {
      return;
    }
    const content = message.content;
    let msg: MessageEmbed | null = null;
    try {
      let match: RegExpMatchArray | null;
      if (['!', '！'].includes(content.charAt(0))) {
        msg = await handleCommand(content.slice(1));
      } else if (
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

bot.login(process.env.DISCORD_TOKEN);
