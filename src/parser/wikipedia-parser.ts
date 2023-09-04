import { load } from 'cheerio';
import type { EmbedConfig } from '../embed.js';

export default function wikipediaParser(html: string): {
  title: string;
  description: string;
} {
  const $ = load(html);
  const title = $('title').text().trim();
  const description = $('#mw-content-text p').text().trim();

  return {
    title,
    description,
  };
}

async function createWikipediaEmbed(url: string): Promise<EmbedConfig | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    const result = wikipediaParser(await response.text());
    if (!result) {
      return null;
    }
    return { ...result, url };
  } catch (e) {
    return null;
  }
}

export const wikipediaParserConfig = {
  match: /https:\/\/zh\.wikipedia\.org\/[^\s]{2,}/,
  transform: (m: RegExpMatchArray): Promise<EmbedConfig | null> =>
    createWikipediaEmbed(m[0]),
};
