import cheerio from 'cheerio';

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
