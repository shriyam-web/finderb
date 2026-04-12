import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FinderB | India's #1 Local Services Discovery Platform",
    short_name: 'FinderB',
    description: "Connect with verified professionals and explore top-rated services in 300+ cities across India. FinderB is your premier local discovery engine.",
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
