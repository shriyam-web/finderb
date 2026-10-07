'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import {
  User as UserIcon,
  Settings,
  MessageSquare,
  Heart,
  LogOut,
  Star,
  History,
  Menu,
  X,
  ChevronRight,
  Search,
  MapPin,
  Home,
  Sparkles,
  LayoutGrid,
  Building2,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { getSession, logoutUser } from '@/app/actions/user';
import { getUserNotifications } from '@/app/actions/notifications';
import { getCategories } from '@/app/actions/category';
import { getFeaturedBusinesses, getBusinessSummariesByIds } from '@/app/actions/business';
import { getLastSearchQuery } from '@/lib/lastSearchQuery';
import CategoryIcon from '@/components/CategoryIcon';
import { categoryHref } from '@/lib/categoryDisplay';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { formatDateTimeInr } from '@/lib/formatDateTime';
import {
  broadcastShowsDatetime,
  resolveBroadcastCta,
} from '@/lib/broadcastFields';
import WebAccountProfile from '@/components/account/WebAccountProfile';
import { isSyntheticLoginEmail } from '@/lib/syntheticLoginEmail';
import { formatIndianMobileDisplay } from '@/lib/indianPhone';

type UserUpdate = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  cta_url?: string | null;
  cta_label?: string | null;
  show_datetime?: boolean;
};

type TabId = 'profile' | 'favorites' | 'messages' | 'history' | 'settings';

const TABS: TabId[] = ['profile', 'favorites', 'messages', 'history', 'settings'];

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<UserUpdate[]>([]);
  const [lastSearch, setLastSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam && TABS.includes(tabParam as TabId)) {
      setActiveTab(tabParam as TabId);
    }
  }, [tabParam]);

  useEffect(() => {
    async function load() {
      const [session, catRes, bizRes, notifRes] = await Promise.all([
        getSession(),
        getCategories(),
        getFeaturedBusinesses(),
        getUserNotifications(),
      ]);

      if (session?.success) {
        setUser(session.user);
        const favIds: string[] = Array.isArray(session.user?.favorites)
          ? session.user.favorites
          : [];
        if (favIds.length > 0) {
          const favRes = await getBusinessSummariesByIds(favIds);
          if (favRes.success && favRes.businesses) {
            setFavoriteBusinesses(favRes.businesses);
          }
        }
      } else {
        router.push('/login');
        return;
      }

      if (catRes.success && catRes.categories) {
        setCategories(catRes.categories.slice(0, 8));
      }
      if (bizRes.success && bizRes.businesses) {
        setBusinesses(bizRes.businesses.slice(0, 6));
      }
      if (notifRes.success) {
        setNotifications(notifRes.notifications);
      }

      const recent = getLastSearchQuery();
      setLastSearch(recent);
      setSearchInput(recent);
      setLoading(false);
    }
    load();
  }, [router]);

  useEffect(() => {
    if (activeTab !== 'messages' || notifications.length === 0) return;
    const ids = notifications.map((item) => item.id).filter(Boolean);
    if (!ids.length) return;
    void fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ids }),
    });
  }, [activeTab, notifications]);

  const setTab = (id: TabId) => {
    setActiveTab(id);
    setIsSidebarOpen(false);
    router.replace(id === 'profile' ? '/dashboard' : `/dashboard?tab=${id}`, { scroll: false });
  };

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) {
      router.push('/categories');
      return;
    }
    router.push(`/categories?search=${encodeURIComponent(q)}`);
  };

  const menuItems = [
    { id: 'profile' as const, label: 'Overview', icon: Home },
    { id: 'favorites' as const, label: 'Saved', icon: Heart },
    { id: 'history' as const, label: 'Search history', icon: History },
    { id: 'messages' as const, label: 'Updates', icon: MessageSquare },
    { id: 'settings' as const, label: 'Account', icon: Settings },
  ];

  const searchHistory = useMemo(() => {
    const fromDb: string[] = Array.isArray(user?.searchHistory) ? user.searchHistory : [];
    const merged = [...fromDb];
    if (lastSearch && !merged.includes(lastSearch)) {
      merged.unshift(lastSearch);
    }
    return merged.slice(0, 12);
  }, [user?.searchHistory, lastSearch]);

  const favorites: string[] = Array.isArray(user?.favorites) ? user.favorites : [];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
      </div>
    );
  }

  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const userInitials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    : 'U';

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;
  const sidebarContact = !isSyntheticLoginEmail(user?.email)
    ? user?.email
    : user?.phone
      ? `+91 ${formatIndianMobileDisplay(user.phone)}`
      : '';

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-[60] flex h-14 items-center justify-between border-b border-zinc-200/80 bg-white px-4 lg:hidden">
        <Link href="/" className="shrink-0">
          <Image src="/logo1.png" alt="FinderB" width={96} height={32} className="h-6 w-auto" priority />
        </Link>
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[55] bg-zinc-900/30 lg:hidden"
          aria-label="Close menu"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-[58] flex h-screen w-[272px] flex-col border-r border-zinc-200/80 bg-white transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-100 px-5 lg:h-16 lg:px-6">
          <Link href="/" onClick={() => setIsSidebarOpen(false)}>
            <Image src="/logo1.png" alt="FinderB" width={110} height={36} className="h-7 w-auto" priority />
          </Link>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="shrink-0 border-b border-zinc-100 px-5 py-4 lg:px-6">
          <div className="flex items-center gap-3">
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user?.fullName || 'Profile photo'}
                width={44}
                height={44}
                unoptimized
                className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-zinc-200"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200">
                {userInitials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-900">{user?.fullName}</p>
              <p className="truncate text-xs text-zinc-500">{sidebarContact}</p>
            </div>
          </div>
          {memberSince && (
            <p className="mt-2 text-xs text-zinc-400">Member since {memberSince}</p>
          )}
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4 lg:px-4">
          <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Menu
          </p>
          <ul className="space-y-0.5">
            {menuItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? 'bg-zinc-100 font-medium text-zinc-900'
                        : 'font-normal text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <item.icon size={18} strokeWidth={active ? 2 : 1.5} />
                    {item.label}
                    {item.id === 'favorites' && favorites.length > 0 && (
                      <span className="ml-auto rounded-full bg-zinc-200/70 px-2 py-0.5 text-xs text-zinc-700">
                        {favorites.length}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="shrink-0 space-y-1 border-t border-zinc-100 p-3 lg:p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
            onClick={() => setIsSidebarOpen(false)}
          >
            <ExternalLink size={17} />
            Back to FinderB
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-[272px]">
        <main className="min-h-screen px-4 pb-10 pt-[4.25rem] sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          {/* Overview */}
          {activeTab === 'profile' && (
            <div className="mx-auto max-w-5xl space-y-6">
              <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 sm:p-8">
                <p className="text-sm text-zinc-500">Welcome back</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
                  Hello, {firstName}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600">
                  Find trusted local businesses, save your favourites, and pick up recent searches from here.
                </p>

                <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                    />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search for services, places, categories…"
                      className="w-full rounded-xl border border-zinc-200 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                  >
                    Search
                    <ChevronRight size={16} />
                  </button>
                </form>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/?tab=ai"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
                  >
                    <Sparkles size={14} />
                    Try FinderB AI
                  </Link>
                  <Link
                    href="/categories"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
                  >
                    <LayoutGrid size={14} />
                    All categories
                  </Link>
                </div>
              </div>

              {searchHistory.length > 0 && (
                <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-zinc-900">Continue searching</h2>
                    <button
                      type="button"
                      onClick={() => setTab('history')}
                      className="text-xs font-medium text-zinc-900 hover:underline"
                    >
                      View all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.slice(0, 6).map((term) => (
                      <Link
                        key={term}
                        href={`/categories?search=${encodeURIComponent(term)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-900"
                      >
                        <History size={14} className="text-zinc-400" />
                        {term}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {categories.length > 0 && (
                <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-zinc-900">Popular categories</h2>
                    <Link href="/categories" className="text-xs font-medium text-zinc-900 hover:underline">
                      See all
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={categoryHref(cat.slug, cat.name)}
                        className="flex flex-col items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/80 p-4 text-center transition-colors hover:border-zinc-300 hover:bg-white"
                      >
                        <CategoryIcon
                          icon={cat.icon}
                          name={cat.name}
                          size={40}
                          className="h-10 w-10"
                          imageClassName="object-contain"
                        />
                        <span className="line-clamp-2 text-xs font-medium text-zinc-800">{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {businesses.length > 0 && (
                <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-zinc-900">Featured businesses</h2>
                    <Link href="/categories" className="text-xs font-medium text-zinc-900 hover:underline">
                      Explore more
                    </Link>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {businesses.map((biz) => (
                      <Link
                        key={biz.id}
                        href={getBusinessProfilePath(biz)}
                        className="flex min-w-0 gap-3 rounded-xl border border-zinc-200/80 p-3 transition-colors hover:border-zinc-300 hover:bg-zinc-50/50"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                          <Image
                            src={
                              biz.image ||
                              biz.profilePictureUrl ||
                              'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=200'
                            }
                            alt={biz.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-zinc-900">{biz.name}</p>
                          <p className="text-xs text-zinc-500">{biz.category}</p>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-zinc-500">
                            <MapPin size={12} />
                            {biz.location}
                          </p>
                          {biz.rating != null && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-zinc-600">
                              <Star size={12} className="fill-amber-400 text-amber-400" />
                              {Number(biz.rating).toFixed(1)}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Saved', value: favorites.length, icon: Heart, tab: 'favorites' as TabId },
                  { label: 'Recent searches', value: searchHistory.length, icon: History, tab: 'history' as TabId },
                  { label: 'Updates', value: notifications.length, icon: MessageSquare, tab: 'messages' as TabId },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setTab(item.tab)}
                    className="rounded-xl border border-zinc-200/80 bg-white p-4 text-left transition-colors hover:border-zinc-300"
                  >
                    <item.icon size={18} className="text-zinc-900" />
                    <p className="mt-3 text-2xl font-semibold text-zinc-900">{item.value}</p>
                    <p className="text-sm text-zinc-500">{item.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          {activeTab === 'history' && (
            <div className="mx-auto max-w-3xl">
              <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Search history</h1>
              <p className="mt-1 text-sm text-zinc-500">Tap a search to run it again.</p>
              <div className="mt-6 rounded-2xl border border-zinc-200/80 bg-white divide-y divide-zinc-100">
                {searchHistory.length > 0 ? (
                  searchHistory.map((term) => (
                    <Link
                      key={term}
                      href={`/categories?search=${encodeURIComponent(term)}`}
                      className="flex items-center justify-between px-4 py-3.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      <span className="flex items-center gap-3">
                        <History size={16} className="text-zinc-400" />
                        {term}
                      </span>
                      <ChevronRight size={16} className="text-zinc-300" />
                    </Link>
                  ))
                ) : (
                  <div className="px-4 py-12 text-center">
                    <p className="text-sm text-zinc-500">No searches yet.</p>
                    <Link
                      href="/categories"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 hover:underline"
                    >
                      Start browsing
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Favorites */}
          {activeTab === 'favorites' && (
            <div className="mx-auto max-w-3xl">
              <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Saved places</h1>
              <p className="mt-1 text-sm text-zinc-500">Businesses and places you save appear here.</p>
              {favorites.length > 0 ? (
                <ul className="mt-6 space-y-2">
                  {favorites.map((id) => {
                    const biz = favoriteBusinesses.find((item) => item.id === id);
                    return (
                    <li key={id}>
                      <Link
                        href={biz ? getBusinessProfilePath(biz) : '#'}
                        className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-white px-4 py-3 text-sm hover:border-zinc-300"
                      >
                        {biz?.name || biz?.businessName || 'View saved business'}
                        <ChevronRight size={16} className="text-zinc-300" />
                      </Link>
                    </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="mt-6 rounded-2xl border border-zinc-200/80 bg-white p-6">
                  <p className="text-sm text-zinc-600">
                    You haven&apos;t saved anything yet. Browse featured listings below or search for services near you.
                  </p>
                  {businesses.length > 0 && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {businesses.slice(0, 4).map((biz) => (
                        <Link
                          key={biz.id}
                          href={getBusinessProfilePath(biz)}
                          className="flex min-w-0 items-center gap-3 rounded-xl border border-zinc-100 p-3 hover:border-zinc-300"
                        >
                          <Building2 size={18} className="shrink-0 text-zinc-900" />
                          <span className="truncate text-sm font-medium text-zinc-800">{biz.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  <Link
                    href="/categories"
                    className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 hover:underline"
                  >
                    Browse categories
                    <ChevronRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Messages / FinderB updates */}
          {activeTab === 'messages' && (
            <div className="mx-auto max-w-3xl">
              <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Updates</h1>
              <p className="mt-1 text-sm text-zinc-500">
                Announcements from FinderB. The same updates appear in the mobile app.
              </p>
              {notifications.length > 0 ? (
                <ul className="mt-6 space-y-3">
                  {notifications.map((item) => {
                    const cta = resolveBroadcastCta(item);
                    return (
                    <li
                      key={item.id}
                      className="rounded-2xl border border-zinc-200/80 bg-white px-4 py-4"
                    >
                      <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
                        {item.message}
                      </p>
                      {cta ? (
                        <a
                          href={cta.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800"
                        >
                          {cta.label}
                          <ExternalLink size={12} />
                        </a>
                      ) : null}
                      {broadcastShowsDatetime(item.show_datetime) ? (
                        <p className="mt-2 text-xs text-zinc-400">
                          {formatDateTimeInr(item.created_at)}
                        </p>
                      ) : null}
                    </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-white p-8 text-center">
                  <MessageSquare size={28} className="mx-auto text-zinc-300" />
                  <p className="mt-3 text-sm font-medium text-zinc-700">No updates yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">
                    When FinderB sends an announcement, it will show up here and in the app.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Settings / Account */}
          {activeTab === 'settings' && (
            <div className="mx-auto max-w-3xl space-y-6">
              <div>
                <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">Account</h1>
                <p className="mt-1 text-sm text-zinc-500">
                  Your photo, name and contact details. New email and mobile numbers are verified with a code.
                </p>
              </div>

              <WebAccountProfile
                user={user}
                onUserChange={(patch) => setUser((prev: typeof user) => ({ ...prev, ...patch }))}
              />

              <div className="rounded-2xl border border-zinc-200/80 bg-white p-5">
                <h2 className="text-sm font-semibold text-zinc-900">Quick links</h2>
                <div className="mt-3 space-y-1">
                  <Link href="/" className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50">
                    FinderB home
                    <ChevronRight size={16} className="text-zinc-300" />
                  </Link>
                  <Link href="/business/register" className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50">
                    List your business
                    <ChevronRight size={16} className="text-zinc-300" />
                  </Link>
                  <Link href="/account-deletion" className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    Delete account
                    <ChevronRight size={16} className="text-red-300" />
                  </Link>
                  <Link href="/privacy" className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm text-zinc-600 hover:bg-zinc-50">
                    Privacy policy
                    <ChevronRight size={16} className="text-zinc-300" />
                  </Link>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 sm:w-auto sm:px-6"
              >
                Sign out
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function DashboardFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
    </div>
  );
}

export default function UserDashboard() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}
