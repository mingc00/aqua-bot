import axios from 'axios';
import cheerio from 'cheerio';
import type { EmbedConfig } from '../embed.js';

export default function wikipediaParser(
  html: string
): {
  title: string;
  description: string;
} {
  const $ = cheerio.load(html);
  const title = $('title').text().trim();
  const description = $('#mw-content-text p').text().trim();

  return {
    title,
    description,
  };
}

async function createWikipediaEmbed(url: string): Promise<EmbedConfig | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    const result = wikipediaParser(response.data);
    if (!result) {
      return null;
    }
    return { ...result, url };
  } catch (e) {
    return null;
  }
}

export const wikipediaParserConfig = {
  match: /https:\/\/[a-zA-Z0-9]+\.wikipedia\.org\/[^\s]{2,}/,
  transform: (m: RegExpMatchArray): Promise<EmbedConfig | null> =>
    createWikipediaEmbed(m[0]),
};
