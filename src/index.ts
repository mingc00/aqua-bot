import process from 'process';
import {Client, RichEmbed} from 'discord.js';
import axios from 'axios';
import pttParser from './ptt-parser';

function randomPick<T>(array: T[]) {
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

async function handleCommand(command: string): Promise<RichEmbed|null> {
  switch (command) {
  case '佛心公司':
    return new RichEmbed().
      setImage('https://i.imgur.com/Y4RQpGs.gif').
      setFooter('╰(⊙Д⊙)╮佛心公司╭(⊙Д⊙)╯佛心公司╰(⊙Д⊙)╮佛心公司');
  case '可憐哪':
    return new RichEmbed().
      setImage(randomPick(['https://i.imgur.com/isTHE67.jpg', 'https://i.imgur.com/MMDG8Jp.jpg']));
  default:
  }
  return null;
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
    return new RichEmbed().
      setURL(url).
      setTitle(result.title).
      setAuthor(result.author).
      setDescription(result.description);
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
}).on('error', () => {});

bot.login(process.env.DISCORD_TOKEN);
