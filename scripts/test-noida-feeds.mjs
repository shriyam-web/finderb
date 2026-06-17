import Parser from 'rss-parser';

const parser = new Parser();
const feeds = [
  'https://www.amarujala.com/rss/noida.xml',
  'https://www.livehindustan.com/rss/cities/noida-news',
  'https://www.thehindu.com/news/cities/Noida/feeder/default.rss',
];

for (const url of feeds) {
  try {
    const f = await parser.parseURL(url);
    console.log('OK', f.items?.length, url);
    console.log('  sample:', f.items?.[0]?.title?.slice(0, 60));
  } catch (e) {
    console.log('ERR', e.message.slice(0, 40), url);
  }
}
