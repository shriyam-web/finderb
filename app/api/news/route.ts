import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'technology';

    const parser = new Parser();
    const feed = await parser.parseURL(
      `https://news.google.com/rss/search?q=${encodeURIComponent(category + " India")}&hl=en-IN&gl=IN&ceid=IN:en`
    );

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

    const articles = feed.items.slice(0, 10).map((item, index) => ({
      id: item.guid || item.link || Math.random().toString(),
      title: item.title,
      link: item.link,
      excerpt: item.contentSnippet || item.content || "",
      date: item.pubDate ? new Date(item.pubDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : "Recently",
      category: category.charAt(0).toUpperCase() + category.slice(1),
      source: (item as any).source?.title || "News",
      image: `${techImages[index % techImages.length]}&sig=${index}`,
    }));

    return NextResponse.json({ success: true, articles });
  } catch (error) {
    console.error("RSS Fetch Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
