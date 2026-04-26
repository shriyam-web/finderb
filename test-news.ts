
import Parser from "rss-parser";

async function testFeeds() {
  const parser = new Parser();
  const categoryFeeds: Record<string, string> = {
    technology_old: "https://gadgets360.com/rss/feeds",
    technology_hindu: "https://www.thehindu.com/sci-tech/technology/feeder/default.rss",
    technology_digit: "https://www.digit.in/feed/",
    business: "https://economictimes.indiatimes.com/rssfeedsdefault.cms",
    startups: "https://yourstory.com/feed",
    local: "https://www.thehindu.com/news/national/feeder/default.rss"
  };

  for (const [category, url] of Object.entries(categoryFeeds)) {
    console.log(`Testing category: ${category} - URL: ${url}`);
    try {
      const feed = await parser.parseURL(url);
      console.log(`  Success! Title: ${feed.title}, Items: ${feed.items.length}`);
    } catch (error: any) {
      console.log(`  Failed! Error: ${error.message}`);
    }
  }
}

testFeeds();
