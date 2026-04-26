import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'technology';

    const parser = new Parser();
    
    // Map categories to more reliable RSS feeds that provide descriptions
    const categoryFeeds: Record<string, string> = {
      technology: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml",
      business: "https://economictimes.indiatimes.com/rssfeedsdefault.cms",
      startups: "https://yourstory.com/feed",
      local: "https://www.thehindu.com/news/national/feeder/default.rss"
    };

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

    const techImages = [
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=800",
    ];

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
        image: `${techImages[index % techImages.length]}&sig=${index}`,
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
