'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock, Play, X } from 'lucide-react';
import type { FinderBTutorialPlaylist, FinderBTutorialVideo } from '@/lib/finderbYoutube';
import {
  FINDERB_YOUTUBE_CHANNEL_URL,
  formatTutorialDate,
  youtubeEmbedUrl,
} from '@/lib/finderbYoutube';

type FinderBTutorialsSectionProps = {
  playlists: FinderBTutorialPlaylist[];
};

const STUDIO_TOPICS = [
  'Discover local businesses',
  'List your shop on FinderB',
  'Get verified & grow leads',
  'Search smarter every day',
];

const VIDEOS_PER_PLAYLIST = 4;

function YoutubeIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
    </svg>
  );
}

function MarqueeLights() {
  return (
    <div
      className="flex items-center gap-1 overflow-hidden border-b border-black/40 bg-[#0a0a0a] px-3 py-2 sm:px-4"
      aria-hidden
    >
      {Array.from({ length: 28 }).map((_, index) => (
        <span
          key={index}
          className={`animate-finderb-marquee-pulse h-2 w-2 shrink-0 rounded-full ${
            index % 3 === 0 ? 'bg-[#ff0033]' : index % 3 === 1 ? 'bg-[#f9b864]' : 'bg-[#215481]'
          }`}
          style={{ animationDelay: `${(index % 7) * 0.18}s`, opacity: 0.45 }}
        />
      ))}
    </div>
  );
}

function MonitorChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[1.15rem] bg-[#153551] p-1.5 shadow-[inset_0_2px_12px_rgba(0,0,0,0.35)] sm:p-2">
      <div className="flex items-center gap-1.5 px-1 pb-2 pt-0.5 sm:px-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 hidden text-[11px] font-medium text-white/50 sm:inline">
          FinderB Studio
        </span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[#ff0033]/90 px-2.5 py-0.5 text-[10px] font-semibold text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          New
        </span>
      </div>
      <div className="overflow-hidden rounded-lg bg-black ring-1 ring-white/10">{children}</div>
    </div>
  );
}

function FeaturedPlayer({
  video,
  onPlay,
}: {
  video: FinderBTutorialVideo;
  onPlay: (video: FinderBTutorialVideo) => void;
}) {
  const dateLabel = formatTutorialDate(video.publishedAt);

  return (
    <button
      type="button"
      onClick={() => onPlay(video)}
      className="group relative block w-full text-left"
    >
      <div className="relative aspect-video w-full overflow-hidden">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          sizes="(max-width: 1024px) 100vw, 52vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/10 transition-opacity group-hover:via-black/25" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ff0033] text-white shadow-[0_0_0_8px_rgba(255,0,51,0.25)] transition-transform duration-300 group-hover:scale-110 sm:h-16 sm:w-16">
            <Play size={26} className="ml-1 fill-white" />
          </span>
        </div>
        {video.isShort ? (
          <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            Short
          </span>
        ) : null}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
          <span className="inline-flex rounded-md bg-[#f9b864] px-2 py-0.5 text-[11px] font-semibold text-[#153551]">
            {video.topic}
          </span>
          <h3 className="mt-2 text-lg font-bold leading-snug !text-white sm:text-xl">{video.title}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/80 sm:text-sm">
            {video.description}
          </p>
          {dateLabel ? (
            <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-white/60">
              <Clock size={11} />
              {dateLabel}
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function QueueItem({
  video,
  index,
  onPlay,
}: {
  video: FinderBTutorialVideo;
  index: number;
  onPlay: (video: FinderBTutorialVideo) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPlay(video)}
      className="group flex w-full items-stretch gap-3 rounded-xl border border-[#153551]/10 bg-white p-2.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#ff0033]/25 hover:shadow-md"
    >
      <span className="flex w-7 shrink-0 items-center justify-center text-sm font-semibold text-[#ff0033]">
        {index + 1}
      </span>
      <div className="relative h-16 w-[7.25rem] shrink-0 overflow-hidden rounded-lg">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="116px"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <Play size={14} className="fill-white text-white opacity-90" />
        </div>
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#153551] group-hover:text-[#215481]">
          {video.title}
        </p>
        <p className="mt-1 text-xs text-[#64748b]">{video.topic}</p>
      </div>
    </button>
  );
}

function RailCard({
  video,
  onPlay,
}: {
  video: FinderBTutorialVideo;
  onPlay: (video: FinderBTutorialVideo) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onPlay(video)}
      className="group w-[min(82vw,260px)] shrink-0 overflow-hidden rounded-2xl border-2 border-[#153551]/15 bg-white text-left shadow-md sm:w-[280px]"
    >
      <div className="relative aspect-video">
        <Image
          src={video.thumbnailUrl}
          alt={video.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="280px"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ff0033] text-white">
            <Play size={16} className="ml-0.5 fill-white" />
          </span>
        </div>
      </div>
      <div className="space-y-1.5 p-3.5">
        <p className="text-xs font-medium text-[#ff0033]">{video.topic}</p>
        <p className="line-clamp-2 text-sm font-semibold text-[#153551]">{video.title}</p>
      </div>
    </button>
  );
}

export default function FinderBTutorialsSection({ playlists }: FinderBTutorialsSectionProps) {
  const visiblePlaylists = useMemo(
    () => playlists.filter((playlist) => playlist.videos.length > 0),
    [playlists]
  );

  const [activePlaylistId, setActivePlaylistId] = useState(visiblePlaylists[0]?.id ?? '');
  const [activeVideo, setActiveVideo] = useState<FinderBTutorialVideo | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!visiblePlaylists.length) return;
    if (!visiblePlaylists.some((playlist) => playlist.id === activePlaylistId)) {
      setActivePlaylistId(visiblePlaylists[0].id);
    }
  }, [visiblePlaylists, activePlaylistId]);

  const activePlaylist =
    visiblePlaylists.find((playlist) => playlist.id === activePlaylistId) ?? visiblePlaylists[0];

  const videos = useMemo(
    () => (activePlaylist?.videos ?? []).slice(0, VIDEOS_PER_PLAYLIST),
    [activePlaylist]
  );

  const featured = videos[0];
  const queue = useMemo(() => videos.slice(1, 4), [videos]);
  const rail = useMemo(() => videos.slice(0, 4), [videos]);

  const closeModal = useCallback(() => setActiveVideo(null), []);

  useEffect(() => {
    if (!activeVideo) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal();
    };

    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeVideo, closeModal]);

  if (!activePlaylist || !featured) return null;

  const showPlaylistTabs = visiblePlaylists.length > 1;

  return (
    <>
      <section id="tutorials" className="relative py-10 sm:py-14 lg:py-16">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[70%] -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,0,51,0.07),transparent_65%)]" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[1.75rem] bg-[#141414]">
            <MarqueeLights />

            <div className="grid lg:grid-cols-[minmax(0,13rem)_1fr]">
              <aside className="relative hidden flex-col justify-between bg-[#ff0033] p-6 text-white lg:flex">
                <div className="space-y-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                    <YoutubeIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/80">Official YouTube channel</p>
                    <p className="mt-1 text-xl font-bold leading-snug">FinderB</p>
                  </div>
                  <ul className="space-y-2.5 border-t border-white/20 pt-4">
                    {STUDIO_TOPICS.map((topic) => (
                      <li key={topic} className="flex items-start gap-2 text-xs font-medium leading-snug text-white/90">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#f9b864]" />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={FINDERB_YOUTUBE_CHANNEL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#ff0033] transition-colors hover:bg-white/95"
                >
                  <YoutubeIcon className="h-4 w-4" />
                  Subscribe
                </Link>
              </aside>

              <div className="relative overflow-hidden bg-[linear-gradient(135deg,#fffdf9_0%,#fff6ea_48%,#f7efe3_100%)] p-5 sm:p-7 lg:p-8">
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-xl space-y-2">
                    <p className="text-sm font-medium text-[#64748b]">Video guides from the FinderB team</p>
                    <h2 className="text-2xl font-extrabold tracking-tight text-[#153551] sm:text-3xl lg:text-4xl">
                      FinderB <span className="text-[#215481]">Tutorials</span>
                    </h2>
                    <p className="max-w-md text-sm leading-relaxed text-[#64748b]">
                      Short walkthroughs on discovering local businesses, listing on FinderB, and
                      getting more from the platform.
                    </p>
                  </div>
                  <Link
                    href={FINDERB_YOUTUBE_CHANNEL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full bg-[#ff0033] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#e6002f] lg:hidden"
                  >
                    <YoutubeIcon className="h-4 w-4" />
                    Subscribe
                  </Link>
                </div>

                {showPlaylistTabs ? (
                  <div
                    className="scrollbar-hide mt-5 flex gap-2 overflow-x-auto pb-1"
                    role="tablist"
                    aria-label="Tutorial playlists"
                  >
                    {visiblePlaylists.map((playlist) => {
                      const isActive = playlist.id === activePlaylist.id;
                      return (
                        <button
                          key={playlist.id}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          onClick={() => setActivePlaylistId(playlist.id)}
                          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                            isActive
                              ? 'bg-[#153551] text-white shadow-sm'
                              : 'bg-white/80 text-[#153551] ring-1 ring-[#153551]/15 hover:bg-white'
                          }`}
                        >
                          {playlist.title}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {activePlaylist.description ? (
                  <p className="mt-3 max-w-2xl text-sm text-[#64748b]">{activePlaylist.description}</p>
                ) : null}

                <div className="relative mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
                  <MonitorChrome>
                    <FeaturedPlayer video={featured} onPlay={setActiveVideo} />
                  </MonitorChrome>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#153551]">
                        {queue.length > 0
                          ? `More in ${activePlaylist.title}`
                          : `From ${activePlaylist.title}`}
                      </p>
                      <Link
                        href={FINDERB_YOUTUBE_CHANNEL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden items-center gap-1 text-sm font-semibold text-[#215481] hover:underline lg:inline-flex"
                      >
                        All videos
                        <ArrowRight size={13} />
                      </Link>
                    </div>

                    {queue.length > 0 ? (
                      <div className="space-y-2.5">
                        {queue.map((video, index) => (
                          <QueueItem
                            key={`${activePlaylist.id}-${video.id}`}
                            video={video}
                            index={index}
                            onPlay={setActiveVideo}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-[#153551]/15 bg-white/70 p-5">
                        <p className="text-sm font-semibold text-[#153551]">More videos on the way</p>
                        <p className="mt-1.5 text-xs leading-relaxed text-[#64748b]">
                          More guides for this playlist will appear here as they are published.
                        </p>
                        <Link
                          href={FINDERB_YOUTUBE_CHANNEL_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ff0033] hover:underline"
                        >
                          Open @FinderB
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    )}

                    <Link
                      href={FINDERB_YOUTUBE_CHANNEL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden items-center justify-center gap-2 rounded-xl bg-[#153551] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1a4367] lg:inline-flex"
                    >
                      <YoutubeIcon className="h-4 w-4" />
                      Watch on YouTube
                    </Link>
                  </div>
                </div>

                {rail.length > 0 ? (
                  <div className="scrollbar-hide -mx-1 mt-6 flex gap-4 overflow-x-auto px-1 pb-1 lg:hidden">
                    {rail.map((video) => (
                      <RailCard
                        key={`${activePlaylist.id}-rail-${video.id}`}
                        video={video}
                        onPlay={setActiveVideo}
                      />
                    ))}
                  </div>
                ) : null}

                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-1 bg-[linear-gradient(90deg,#ff0033,#f9b864,#215481,#ff0033)] opacity-80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {activeVideo ? (
        <div
          className="fixed inset-0 z-[10060] flex items-center justify-center bg-[#0a0a0a]/92 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`Playing ${activeVideo.title}`}
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-2xl border-2 border-[#141414] bg-black shadow-2xl ring-2 ring-[#f9b864]/30"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-white/10 bg-[#141414] px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <p className="ml-2 min-w-0 flex-1 truncate text-sm font-medium text-white/80">
                {activeVideo.title}
              </p>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeModal}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                aria-label="Close video"
              >
                <X size={16} />
              </button>
            </div>
            <div className="relative aspect-video w-full bg-black">
              <iframe
                title={activeVideo.title}
                src={youtubeEmbedUrl(activeVideo.id)}
                className="absolute inset-0 h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
