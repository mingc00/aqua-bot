import axios from 'axios';
import type { EmbedConfig } from '../embed.js';

function matchMeta(content: string, property: string): string | null {
  const re = new RegExp(`<meta property="${property}" content="([\\s\\S]*?)"`);
  const r = content.match(re);
  return r ? r[1] : null;
}

function pttParser(html: string): {
  title: string;
  description: string;
  author: string;
} {
  return {
    title: matchMeta(html, 'og:title') || '',
    description: matchMeta(html, 'og:description') || '',
    author: matchMeta(html, 'og:site_name') || '',
  };
}

async function createPTTEmbed(url: string): Promise<EmbedConfig | null> {
  try {
    const response = await axios.get<string>(url, {
      headers: {
        Cookie: 'over18=1',
      },
    });
    const result = pttParser(response.data);
    if (!result) {
      return null;
    }
    return { ...result, url };
  } catch (e) {
    return null;
  }
}

export const pttParserConfig = {
  match: /https?:\/\/www.ptt.cc\/bbs\/gossiping\/[\w.]+.html/i,
  transform: (m: RegExpMatchArray): Promise<EmbedConfig | null> =>
    createPTTEmbed(m[0]),
};
