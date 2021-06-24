import axios from 'axios';
import cheerio from 'cheerio';
import process from 'process';
import type { EmbedConfig } from '../embed.js';

const requestInstance = axios.create({
  headers: {
    Cookie: process.env.FB_COOKIE,
    'Sec-Fetch-User': '?1',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    'sec-ch-ua':
      '"Not;A Brand";v="99", "Google Chrome";v="91", "Chromium";v="91"',
  },
});

export default function fbParser(
  html: string
): {
  title: string;
  description: string;
  author: string;
  thumbnail?: string;
} {
  const $ = cheerio.load(html);
  const title = $('title').text().replace(/\n/g, ' ');
  const containerEl = $('.story_body_container');
  const author = $('strong', containerEl).text();
  const content = $('div[data-ft]', containerEl).eq(0).text();
  const urlMatch = $('div>i.img', containerEl)
    .last()
    .attr('style')
    ?.match(/url\('(.*)'\)/);
  const thumbnail = urlMatch
    ? decodeURIComponent(urlMatch[1].replace(/\\(\w+) /g, '%$1'))
    : undefined;

  return {
    title: title.replace(`${author} - `, ''),
    description: content,
    author,
    thumbnail,
  };
}

async function createFbEmbed(path: string): Promise<EmbedConfig | null> {
  try {
    const response = await requestInstance.get(
      `https://m.facebook.com/${path}?_fb_noscript=1`
    );
    const result = fbParser(response.data);
    if (!result) {
      return null;
    }
    return {
      ...result,
      url: `https://www.facebook.com/${path}`,
    };
  } catch (e) {
    return null;
  }
}

export const fbParserConfig = {
  match: /https:\/\/(?:www|m).facebook.com\/([\w./]+)/,
  transform: (m: RegExpMatchArray): Promise<EmbedConfig | null> =>
    createFbEmbed(m[1]),
};

export const fbVideoParserConfig = {
  match: /https:\/\/fb.watch\/\w+/,
  async transform(m: RegExpMatchArray): Promise<EmbedConfig | null> {
    try {
      const {
        request: { path },
      } = await requestInstance.head(m[0]);
      return createFbEmbed(path);
    } catch (e) {
      return null;
    }
  },
};
