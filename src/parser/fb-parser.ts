import axios from 'axios';
import { load } from 'cheerio';
import process from 'process';
import type { EmbedConfig } from '../embed.js';

const requestInstance = axios.create({
  headers: {
    Cookie: process.env.FB_COOKIE || '',
    'Sec-Fetch-User': '?1',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': "macOS",
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'accept-language': 'zh-TW,zh;q=0.9',
    'sec-fetch-site': 'none',
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36',
    'sec-ch-ua':
      '".Not/A)Brand";v="99", "Google Chrome";v="103", "Chromium";v="103"',
  },
});

export default function fbParser(html: string): {
  title: string;
  description: string;
  author: string;
  thumbnail?: string;
} {
  const $ = load(html);
  const title = $('title').text().replace(/\n/g, ' ');
  const containerEl = $('.story_body_container').first();
  const author = $('strong', containerEl).first().text();
  const sections =  $('div[data-ft]', containerEl);
  const content = sections.first().text();
  const thumbnail = sections.length > 1 ? $('img', sections.last()).first().attr('src') : '';

  return {
    title: title.replace(`${author} - `, ''),
    description: content,
    author,
    thumbnail,
  };
}

async function createFbEmbed(url: URL): Promise<EmbedConfig | null> {
  try {
    const testURL = new URL(url.toString());
    testURL.hostname = 'm.facebook.com';
    const noScriptKey = '_fb_noscript';
    if (!testURL.searchParams.has(noScriptKey)) {
      testURL.searchParams.append(noScriptKey, '1');
    }
    const response = await requestInstance.get<string>(testURL.toString());
    const result = fbParser(response.data);
    if (!result) {
      return null;
    }
    return {
      ...result,
      url: url.toString(),
    };
  } catch (e) {
    return null;
  }
}

export const fbPermalinkParserConfig = {
  match: /https:\/\/(?:www|m).facebook.com\/permalink.php/,
  transform: (m: RegExpMatchArray): Promise<EmbedConfig | null> => {
    const url = new URL(m[0]);
    url.search = new URLSearchParams({
      story_fbid: url.searchParams.get('story_fbid') || '',
      id: url.searchParams.get('id') || '',
    }).toString();
    return createFbEmbed(url);
  },
};

export const fbParserConfig = {
  match: /https:\/\/(?:www|m).facebook.com\/[^\s]+/,
  transform: (m: RegExpMatchArray): Promise<EmbedConfig | null> => {
    let url = new URL(m[0]);
    const multiPermalinks = url.searchParams.get('multi_permalinks');
    if (multiPermalinks) {
      url = new URL(`posts/${multiPermalinks}`, url);
    } else {
      [...url.searchParams.keys()]
        .filter((k) => k !== 'v')
        .forEach((k) => {
          url.searchParams.delete(k);
        });
    }
    return createFbEmbed(url);
  },
};

export const fbVideoParserConfig = {
  match: /https:\/\/fb.watch\/\w+/,
  async transform(m: RegExpMatchArray): Promise<EmbedConfig | null> {
    try {
      const {
        request: { path },
      } = await requestInstance.head(m[0]);
      return createFbEmbed(new URL(path));
    } catch (e) {
      return null;
    }
  },
};
