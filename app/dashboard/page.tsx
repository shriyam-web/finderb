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
import { getCategories } from '@/app/actions/category';
import { getFeaturedBusinesses } from '@/app/actions/business';
import { getLastSearchQuery } from '@/lib/lastSearchQuery';
import CategoryIcon from '@/components/CategoryIcon';

type TabId = 'profile' | 'favorites' | 'messages' | 'history' | 'settings';

const TABS: TabId[] = ['profile', 'favorites', 'messages', 'history', 'settings'];

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
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
      const [session, catRes, bizRes] = await Promise.all([
        getSession(),
        getCategories(),
        getFeaturedBusinesses(),
      ]);

      if (session?.success) {
        setUser(session.user);
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

      const recent = getLastSearchQuery();
      setLastSearch(recent);
      setSearchInput(recent);
      setLoading(false);
    }
    load();
  }, [router]);

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
    { id: 'messages' as const, label: 'Messages', icon: MessageSquare },
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
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#215481] border-t-transparent" />
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

  return (
    <div className="min-h-screen bg-[#f4f7fb]">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-[60] flex h-14 items-center justify-between border-b border-slate-200/80 bg-white px-4 lg:hidden">
        <Link href="/" className="shrink-0">
          <Image src="/logo1.png" alt="FinderB" width={96} height={32} className="h-6 w-auto" />
        </Link>
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {isSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[55] bg-slate-900/30 lg:hidden"
          aria-label="Close menu"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-[58] flex w-[272px] flex-col border-r border-slate-200/80 bg-white transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-100 px-5 lg:h-auto lg:border-0 lg:px-6 lg:pt-6 lg:pb-2">
          <Link href="/" onClick={() => setIsSidebarOpen(false)}>
            <Image src="/logo1.png" alt="FinderB" width={110} height={36} className="h-7 w-auto" />
          </Link>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#215481] text-sm font-semibold text-white">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{user?.fullName}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          {memberSince && (
            <p className="mt-2 text-xs text-slate-400">Member since {memberSince}</p>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
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
                        ? 'bg-[#215481]/10 font-medium text-[#215481]'
                        : 'font-normal text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon size={18} strokeWidth={active ? 2 : 1.5} />
                    {item.label}
                    {item.id === 'favorites' && favorites.length > 0 && (
                      <span className="ml-auto rounded-full bg-[#215481]/10 px-2 py-0.5 text-xs text-[#215481]">
                        {favorites.length}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-1 border-t border-slate-100 p-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
            onClick={() => setIsSidebarOpen(false)}
          >
            <ExternalLink size={17} />
            Back to FinderB
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-[272px]">
        <main className="min-h-screen px-4 pb-8 pt-[4.5rem] lg:px-8 lg:pt-8">
          {/* Overview */}
          {activeTab === 'profile' && (
            <div className="mx-auto max-w-5xl space-y-6">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8">
                <p className="text-sm text-slate-500">Welcome back</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                  Hello, {firstName}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
                  Find trusted local businesses, save your favourites, and pick up recent searches from here.
                </p>

                <form onSubmit={handleSearch} className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <div className="relative flex-1">
                    <Search
                      size={18}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search for services, places, categories…"
                      className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-[#215481]/40 focus:ring-4 focus:ring-[#215481]/10"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#215481] px-5 py-3 text-sm font-semibold text-white hover:bg-[#1a4367]"
                  >
                    Search
                    <ChevronRight size={16} />
                  </button>
                </form>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/?tab=ai"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[#215481]/30 hover:text-[#215481]"
                  >
                    <Sparkles size={14} />
                    Try FinderB AI
                  </Link>
                  <Link
                    href="/categories"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-[#215481]/30 hover:text-[#215481]"
                  >
                    <LayoutGrid size={14} />
                    All categories
                  </Link>
                </div>
              </div>

              {searchHistory.length > 0 && (
                <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900">Continue searching</h2>
                    <button
                      type="button"
                      onClick={() => setTab('history')}
                      className="text-xs font-medium text-[#215481] hover:underline"
                    >
                      View all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.slice(0, 6).map((term) => (
                      <Link
                        key={term}
                        href={`/categories?search=${encodeURIComponent(term)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-[#215481]/30 hover:text-[#215481]"
                      >
                        <History size={14} className="text-slate-400" />
                        {term}
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {categories.length > 0 && (
                <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900">Popular categories</h2>
                    <Link href="/categories" className="text-xs font-medium text-[#215481] hover:underline">
                      See all
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/categories?id=${cat.id}`}
                        className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 p-4 text-center transition-colors hover:border-[#215481]/25 hover:bg-white"
                      >
                        <CategoryIcon
                          icon={cat.icon}
                          name={cat.name}
                          size={40}
                          className="h-10 w-10"
                          imageClassName="object-contain"
                        />
                        <span className="line-clamp-2 text-xs font-medium text-slate-800">{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {businesses.length > 0 && (
                <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900">Featured businesses</h2>
                    <Link href="/categories" className="text-xs font-medium text-[#215481] hover:underline">
                      Explore more
                    </Link>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {businesses.map((biz) => (
                      <Link
                        key={biz.id}
                        href={`/business/${biz.id}`}
                        className="flex gap-3 rounded-xl border border-slate-200/80 p-3 transition-colors hover:border-[#215481]/25 hover:bg-slate-50/50"
                      >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
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
                          <p className="truncate text-sm font-semibold text-slate-900">{biz.name}</p>
                          <p className="text-xs text-[#215481]">{biz.category}</p>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                            <MapPin size={12} />
                            {biz.location}
                          </p>
                          {biz.rating != null && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
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
                  { label: 'Messages', value: 0, icon: MessageSquare, tab: 'messages' as TabId },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setTab(item.tab)}
                    className="rounded-xl border border-slate-200/80 bg-white p-4 text-left transition-colors hover:border-[#215481]/25"
                  >
                    <item.icon size={18} className="text-[#215481]" />
                    <p className="mt-3 text-2xl font-semibold text-slate-900">{item.value}</p>
                    <p className="text-sm text-slate-500">{item.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          {activeTab === 'history' && (
            <div className="mx-auto max-w-3xl">
              <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Search history</h1>
              <p className="mt-1 text-sm text-slate-500">Tap a search to run it again.</p>
              <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100">
                {searchHistory.length > 0 ? (
                  searchHistory.map((term) => (
                    <Link
                      key={term}
                      href={`/categories?search=${encodeURIComponent(term)}`}
                      className="flex items-center justify-between px-4 py-3.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-3">
                        <History size={16} className="text-slate-400" />
                        {term}
                      </span>
                      <ChevronRight size={16} className="text-slate-300" />
                    </Link>
                  ))
                ) : (
                  <div className="px-4 py-12 text-center">
                    <p className="text-sm text-slate-500">No searches yet.</p>
                    <Link
                      href="/categories"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#215481] hover:underline"
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
              <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Saved places</h1>
              <p className="mt-1 text-sm text-slate-500">Businesses and places you save appear here.</p>
              {favorites.length > 0 ? (
                <ul className="mt-6 space-y-2">
                  {favorites.map((id) => (
                    <li key={id}>
                      <Link
                        href={`/business/${id}`}
                        className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm hover:border-[#215481]/25"
                      >
                        View saved item
                        <ChevronRight size={16} className="text-slate-300" />
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-6">
                  <p className="text-sm text-slate-600">
                    You haven&apos;t saved anything yet. Browse featured listings below or search for services near you.
                  </p>
                  {businesses.length > 0 && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {businesses.slice(0, 4).map((biz) => (
                        <Link
                          key={biz.id}
                          href={`/business/${biz.id}`}
                          className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 hover:border-[#215481]/25"
                        >
                          <Building2 size={18} className="shrink-0 text-[#215481]" />
                          <span className="truncate text-sm font-medium text-slate-800">{biz.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                  <Link
                    href="/categories"
                    className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[#215481] hover:underline"
                  >
                    Browse categories
                    <ChevronRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {activeTab === 'messages' && (
            <div className="mx-auto max-w-3xl">
              <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Messages</h1>
              <p className="mt-1 text-sm text-slate-500">Conversations with businesses you contact.</p>
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                <MessageSquare size={28} className="mx-auto text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-700">No messages yet</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                  When you enquire with a business on FinderB, your chats will show up here.
                </p>
                <Link
                  href="/categories"
                  className="mt-5 inline-flex items-center gap-1 rounded-lg bg-[#215481] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a4367]"
                >
                  Find a business
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          )}

          {/* Settings / Account */}
          {activeTab === 'settings' && (
            <div className="mx-auto max-w-3xl space-y-6">
              <div>
                <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Account</h1>
                <p className="mt-1 text-sm text-slate-500">Your profile and sign-in details.</p>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white divide-y divide-slate-100">
                <div className="flex items-center gap-4 p-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#215481] text-lg font-semibold text-white">
                    {userInitials}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{user?.fullName}</p>
                    <p className="text-sm text-slate-500">{user?.email}</p>
                    {memberSince && (
                      <p className="mt-0.5 text-xs text-slate-400">Joined {memberSince}</p>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <label className="text-xs font-medium text-slate-500">Full name</label>
                  <p className="mt-1 text-sm text-slate-900">{user?.fullName}</p>
                </div>
                <div className="p-5">
                  <label className="text-xs font-medium text-slate-500">Email</label>
                  <p className="mt-1 text-sm text-slate-900">{user?.email}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
                <h2 className="text-sm font-semibold text-slate-900">Quick links</h2>
                <div className="mt-3 space-y-1">
                  <Link href="/" className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                    FinderB home
                    <ChevronRight size={16} className="text-slate-300" />
                  </Link>
                  <Link href="/business/register" className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
                    List your business
                    <ChevronRight size={16} className="text-slate-300" />
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
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7fb]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#215481] border-t-transparent" />
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
