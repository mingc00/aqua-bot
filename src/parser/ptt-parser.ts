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
    const response = await fetch(url, {
      headers: {
        Cookie: 'over18=1',
      },
    });
    const result = pttParser(await response.text());
    if (!result) {
      return null;
    }
    return { ...result, url };
  } catch (e) {
    return null;
  }
}

async function isRedirection(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
    });
    return response.status === 304;
  } catch {
    return false;
  }
}

export const pttParserConfig = {
  match: /https?:\/\/www.ptt.cc\/bbs\/[\w-]+\/[\w.]+.html/i,
  transform: async (m: RegExpMatchArray): Promise<EmbedConfig | null> => {
    const url = m[0];
    if (!(await isRedirection(url))) {
      return null;
    }
    return await createPTTEmbed(url);
  },
};
