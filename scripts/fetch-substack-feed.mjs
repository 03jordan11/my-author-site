import fs from 'node:fs/promises';
import path from 'node:path';

const feedUrl = 'https://jlburnes.substack.com/feed';
const substackUrl = 'https://jlburnes.substack.com/';
const outputPath = path.resolve('src/data/substack-feed.json');

function decodeHtml(value) {
  return value
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripHtml(value) {
  return decodeHtml(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getTagValue(block, tag) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? match[1].trim() : '';
}

function parseRss(xml) {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];

  return items.slice(0, 6).map((match) => {
    const item = match[1];
    const descriptionSource =
      getTagValue(item, 'description') || getTagValue(item, 'content:encoded');

    return {
      title: decodeHtml(getTagValue(item, 'title')) || 'Untitled post',
      link: decodeHtml(getTagValue(item, 'link')) || substackUrl,
      pubDate: getTagValue(item, 'pubDate'),
      description: stripHtml(descriptionSource),
    };
  });
}

try {
  const response = await fetch(feedUrl);

  if (!response.ok) {
    throw new Error(`Feed request failed with ${response.status}`);
  }

  const xml = await response.text();
  const posts = parseRss(xml);

  if (posts.length === 0) {
    throw new Error('Feed request succeeded but no posts were parsed.');
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(posts, null, 2)}\n`, 'utf8');
  console.log(`Cached ${posts.length} Substack posts.`);
} catch (error) {
  console.warn('Substack fetch failed; keeping existing cached feed.');
  console.warn(error instanceof Error ? error.message : error);
}
