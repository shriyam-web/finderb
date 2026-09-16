import type { Href } from 'expo-router';
import type { NewsArticle } from './news';
import { stashNewsArticle } from './newsArticleStore';

/** Navigate to in-app story reader without losing long article URLs. */
export function openNewsArticle(
  router: { push: (href: Href) => void },
  article: NewsArticle,
) {
  if (!article.link?.trim()) return;
  const id = stashNewsArticle(article);
  router.push({
    pathname: '/news/article',
    params: {
      id,
      // Keep a short backup; full URL lives in the stash.
      url: article.link.slice(0, 1800),
      title: article.title.slice(0, 180),
      excerpt: (article.excerpt || '').slice(0, 280),
      image: (article.image || '').slice(0, 500),
      source: (article.source || '').slice(0, 80),
      date: (article.date || '').slice(0, 40),
      category: (article.category || '').slice(0, 40),
    },
  } as Href);
}
