import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'technology';

    const parser = new Parser();
    
    // Map categories to more reliable RSS feeds
    const categoryFeeds: Record<string, string> = {
      technology: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
      business: "https://economictimes.indiatimes.com/rssfeedsdefault.cms",
      startups: "https://yourstory.com/feed",
      politics: "https://www.thehindu.com/news/national/feeder/default.rss",
      sports: "https://www.thehindu.com/sport/feeder/default.rss",
      cricket: "https://www.hindustantimes.com/feeds/rss/sports/cricket/rssfeed.xml",
      bollywood: "https://www.hindustantimes.com/feeds/rss/entertainment/bollywood/rssfeed.xml",
      'real estate': "https://economictimes.indiatimes.com/wealth/real-estate/rssfeeds/20000001.cms",
      local: "https://www.thehindu.com/news/national/feeder/default.rss"
    };

    const categoryImages: Record<string, string[]> = {
      technology: [
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800"
      ],
      business: [
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800"
      ],
      sports: [
        "https://images.unsplash.com/photo-1461896756970-f49c121d7221?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=800"
      ],
      cricket: [
        "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1593341646782-e0b495cff86d?auto=format&fit=crop&q=80&w=800"
      ],
      bollywood: [
        "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&q=80&w=800"
      ],
      politics: [
        "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1541872703-74c5e443d1fe?auto=format&fit=crop&q=80&w=800"
      ],
      'real estate': [
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1582408921715-18e7806365c1?auto=format&fit=crop&q=80&w=800"
      ],
      startups: [
        "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1519389443154-83917a254243?auto=format&fit=crop&q=80&w=800"
      ]
    };

    const defaultImages = [
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&q=80&w=800"
    ];

    const feedUrl = categoryFeeds[category.toLowerCase()] || `https://news.google.com/rss/search?q=${encodeURIComponent(category + " India")}&hl=en-IN&gl=IN&ceid=IN:en`;
    
    let feed;
    try {
      feed = await parser.parseURL(feedUrl);
    } catch (error) {
      console.error(`Error parsing primary feed ${feedUrl}:`, error);
      // Fallback to Google News if primary feed fails
      const fallbackUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(category + " India")}&hl=en-IN&gl=IN&ceid=IN:en`;
      feed = await parser.parseURL(fallbackUrl);
    }

    const images = categoryImages[category.toLowerCase()] || defaultImages;

    const items = Array.isArray(feed.items) ? feed.items.slice(0, 10) : [];
    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No news items were found for this category' },
        { status: 502 }
      );
    }

    const articles = items.map((item, index) => {
      // Google News description often contains HTML lists of related articles. 
      // We try to extract a meaningful snippet or clean the HTML.
      let snippet = item.contentSnippet || item.content || "";
      
      // If it looks like HTML, try to strip it roughly if contentSnippet didn't
      if (snippet.includes('<')) {
        snippet = snippet.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
      }

      // If snippet is too short or just contains "This RSS feed...", clear it
      if (snippet.length < 20 || snippet.includes('RSS feed')) {
        snippet = item.title || ""; // Fallback to title if no description
      }

      return {
        id: item.guid || item.link || Math.random().toString(),
        title: item.title,
        link: item.link,
        excerpt: snippet,
        date: item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "Recently",
        category: category.charAt(0).toUpperCase() + category.slice(1),
        source: (item as any).source?.title || feed.title?.split(' - ')[0] || "News",
        image: `${images[index % images.length]}&sig=${index}`,
      };
    });

    return NextResponse.json({ success: true, articles });
  } catch (error) {
    console.error("RSS Fetch Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
