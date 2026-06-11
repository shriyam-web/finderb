'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Star } from 'lucide-react';
import { movies as mockMovies, Movie } from '@/lib/mockData';
import { getMovies } from '@/app/actions/movie';

export default function MoviesListingPage() {
  const [movies, setMovies] = useState<Movie[]>(mockMovies);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const result = await getMovies();
      if (result.success && result.movies && result.movies.length > 0) {
        setMovies(result.movies);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 lg:pb-12">
      <div className="border-b border-gray-100 bg-white pt-[4.25rem] sm:pt-24">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#64748b] transition-colors hover:text-[#2563eb]"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-[#1e293b] sm:text-3xl">
            Latest <span className="text-[#2563eb]">Movies</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b] sm:text-base">
            Browse the latest films and entertainment picks curated for you.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="aspect-[2/3] animate-pulse rounded-xl bg-slate-200"
              />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white px-6 py-16 text-center">
            <p className="text-base font-semibold text-[#1e293b]">No movies yet</p>
            <p className="mt-2 text-sm text-[#64748b]">Check back soon for new releases.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="group relative aspect-[2/3] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)] transition-shadow hover:shadow-md"
              >
                <Image
                  src={movie.image}
                  alt={movie.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 z-[2] p-3 text-white">
                  <p className="mb-1 line-clamp-2 text-sm font-bold leading-tight">{movie.title}</p>
                  <div className="flex items-center justify-between text-[11px] font-medium text-white/90">
                    <span className="line-clamp-1">{movie.genre}</span>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <Star size={11} className="fill-yellow-400 text-yellow-400" />
                      <span>{movie.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
