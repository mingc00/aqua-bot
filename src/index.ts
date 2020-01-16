import process from 'process';
import {Client, RichEmbed} from 'discord.js';
import axios from 'axios';
import pttParser from './ptt-parser';
import ImageCommandHandler from './image-commands';

const imageCommandHandler =  new ImageCommandHandler();

async function handleCommand(command: string): Promise<RichEmbed|null> {
  return imageCommandHandler.get(command);
}

async function createPTTEmbed(url: string): Promise<RichEmbed|null> {
  try {
    const response = await axios.get(url, {
      headers: {
        Cookie: 'over18=1',
      }
    });
    const result = pttParser(response.data);
    if (!result) {
      return null;
    }
    const {title, author, description} = result;
    return new RichEmbed().
      setURL(url).
      setTitle(title).
      setAuthor(author).
      setDescription(
        description.length > 100 ? `${description.substr(0, 100)}...` : description
      );
  } catch (e) {
    return null;
  }
}

const bot = new Client();

bot.on('ready', () => {
  console.log('Aqua bot is ready');
  console.log(`https://discordapp.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&scope=bot&permissions=0`);
}).on('message', async (message) => {
  if (message.author.bot) {
    return;
  }
  const content = message.content;
  let msg: RichEmbed | null = null;
  try {
    let match: RegExpMatchArray | null;
    if (['!', '！'].includes(content.charAt(0))) {
      msg = await handleCommand(content.slice(1));
    } else if ((match = content.match(/https?:\/\/www.ptt.cc\/bbs\/Gossiping\/[\w.]+.html/))) {
      msg = await createPTTEmbed(match[0]);
    }
  } catch (e) {
    console.error(e);
  }

  if (msg) {
    message.channel.send(msg);
  }
}).on('error', () => {/* ignore */});

bot.login(process.env.DISCORD_TOKEN);
