function matchMeta(content: string, property: string): string | null {
  const re = new RegExp(`<meta property="${property}" content="([\\s\\S]*?)"`);
  const r = content.match(re);
  return r ? r[1] : null;
}

function pttParser(
  html: string
): {
  title: string,
  description: string,
  author: string
} {
  return {
    title: matchMeta(html, 'og:title') || '',
    description: matchMeta(html, 'og:description') || '',
    author: matchMeta(html, 'og:site_name') || '',
  };
}

export default pttParser;
