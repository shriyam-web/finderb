import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media:content'],
      ['media:thumbnail', 'media:thumbnail'],
      ['content:encoded', 'content:encoded'],
    ],
  },
});

async function test(url, label) {
  try {
    const feed = await parser.parseURL(url);
    console.log('\n===', label, '===');
    console.log('items:', feed.items?.length);
    const item = feed.items?.[0];
    if (!item) return;
    console.log('title:', item.title?.slice(0, 60));
    console.log('link:', item.link?.slice(0, 120));
    console.log('enclosure:', JSON.stringify(item.enclosure));
    console.log('media:content:', JSON.stringify(item['media:content'])?.slice(0, 200));
    console.log('media:thumbnail:', JSON.stringify(item['media:thumbnail'])?.slice(0, 200));
    const html = item.content || item['content:encoded'] || '';
    console.log('has img tag:', /<img/i.test(html));
    const img = html.match(/src=["']([^"']+)/i);
    if (img) console.log('first img:', img[1].slice(0, 150));
  } catch (e) {
    console.log(label, 'ERR', e.message);
  }
}

await test('https://www.livehindustan.com/rss/national', 'LH national');
await test(
  'https://news.google.com/rss/search?q=India+politics+news&hl=en-IN&gl=IN&ceid=IN:en',
  'Google News EN politics'
);
await test('https://feeds.bbci.co.uk/hindi/rss.xml', 'BBC Hindi');
