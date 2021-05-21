import axios from 'axios';
import type { EmbedConfig } from '../embed.js';

function matchMeta(content: string, property: string): string | null {
  const re = new RegExp(
    `<meta property="${property}" data-hid="${property}" content="([\\s\\S]*?)"`
  );
  const r = content.match(re);
  return r ? r[1] : null;
}

function lineTodayParser(
  html: string
): {
  title: string;
  description: string;
  author: string;
  thumbnail?: string;
} {
  return {
    title: matchMeta(html, 'og:title') || '',
    description: matchMeta(html, 'og:description') || '',
    author: matchMeta(html, 'author') || matchMeta(html, 'og:site_name') || '',
    thumbnail: matchMeta(html, 'og:image') || '',
  };
}

async function createLineTodayEmbed(path: string): Promise<EmbedConfig | null> {
  try {
    const url = `https://today.line.me/tw/${path}`;
    const response = await axios.get(url);
    const result = lineTodayParser(response.data);
    if (!result) {
      return null;
    }
    return { ...result, url };
  } catch (e) {
    return null;
  }
}

export const lineTodayParserConfig = {
  match: /https:\/\/liff\.line\.me\/[\w-]+\/(v2\/article\/[^\s]+)/,
  transform: (m: RegExpMatchArray): Promise<EmbedConfig | null> =>
    createLineTodayEmbed(m[1]),
};
