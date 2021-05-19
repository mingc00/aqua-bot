import cheerio from 'cheerio';

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
