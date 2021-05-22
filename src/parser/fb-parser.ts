import axios from 'axios';
import cheerio from 'cheerio';
import type { EmbedConfig } from '../embed.js';

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
  const containerEl = $('#m_story_permalink_view');
  const author = $('h3', containerEl).first().text();
  const contentEl = $('div[data-ft]', containerEl).eq(1);
  const content = contentEl.text();
  const thumbnail = $('img', contentEl.parent()).attr('src');

  return {
    title: title.replace(`${author} - `, ''),
    description: content,
    author,
    thumbnail,
  };
}

async function createFbEmbed(path: string): Promise<EmbedConfig | null> {
  try {
    const response = await axios.get(`https://mbasic.facebook.com/${path}`);
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
      } = await axios.head(m[0]);
      return createFbEmbed(path);
    } catch (e) {
      return null;
    }
  },
};
