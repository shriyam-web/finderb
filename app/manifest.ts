import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: "FinderB | India's #1 Local Services Discovery Platform",
    short_name: 'FinderB',
    description:
      'Connect with verified professionals and explore top-rated services in 300+ cities across India. FinderB is your premier local discovery engine.',
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'browser'],
    orientation: 'portrait-primary',
    lang: 'en-IN',
    dir: 'ltr',
    background_color: '#ffffff',
    theme_color: '#215481',
    categories: ['business', 'lifestyle'],
    prefer_related_applications: false,
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
