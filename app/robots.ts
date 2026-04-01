import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/private/', '/dashboard/', '/login/', '/signup/'],
    },
    sitemap: 'https://boomb.in/sitemap.xml', // Replace with your production URL
  }
}
