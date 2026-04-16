'use client';

import { useParams } from 'next/navigation';
import { articles } from '@/lib/mockData';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, Share2, Bookmark } from 'lucide-react';

export default function BlogDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const article = articles.find((a) => a.id === id);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-primary">Article Not Found</h1>
          <Link href="/" className="text-secondary hover:underline inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Hero Section */}
      <div className="relative h-[40vh] sm:h-[60vh] w-full">
        <Image
          src={article.image}
          alt={article.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium uppercase tracking-widest">Back to Insights</span>
            </Link>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
              {article.title}
            </h1>
            <div className="flex items-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-secondary" />
                <span className="text-sm font-bold uppercase tracking-widest">{article.date}</span>
              </div>
              <div className="h-4 w-px bg-white/20" />
              <span className="text-sm font-bold uppercase tracking-widest">5 min read</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content */}
          <div className="flex-1 space-y-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-gray-600 leading-relaxed font-medium mb-8">
                {article.excerpt}
              </p>
              <div className="text-gray-800 leading-relaxed space-y-6 text-lg">
                {article.content}
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                </p>
                <p>
                  Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam. Maecenas fermentum consequat mi. Donec fermentum. Pellentesque malesuada nulla a mi. Duis sapien sem, aliquet nec, commodo eget, consequat quis, neque. Aliquam faucibus, elit ut dictum aliquet, felis nisl adipiscing sapien, sed malesuada diam lacus eget erat. Cras mollis scelerisque nunc. Nullam arcu. Aliquam consequat. Curabitur augue lorem, dapibus quis, laoreet et, pretium ac, nisi. Aenean magna nisl, mollis quis, molestie eu, feugiat in, orci. In hac habitasse platea dictumst.
                </p>
              </div>
            </div>

            {/* Tags/Footer */}
            <div className="pt-12 border-t border-gray-100 flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-wrap gap-2">
                {['Local', 'Insights', 'Guide', 'India'].map((tag) => (
                  <span key={tag} className="px-4 py-2 bg-gray-50 text-gray-500 rounded-full text-xs font-bold uppercase tracking-widest">
                    #{tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4">
                <button className="p-3 rounded-full bg-gray-50 text-gray-400 hover:text-secondary transition-colors">
                  <Share2 size={20} />
                </button>
                <button className="p-3 rounded-full bg-gray-50 text-gray-400 hover:text-secondary transition-colors">
                  <Bookmark size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
