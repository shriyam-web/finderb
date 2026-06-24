export type AdminResourceKey =
  | 'users'
  | 'merchants'
  | 'movies'
  | 'tourist_places'
  | 'categories'
  | 'news'
  | 'blogs'
  | 'jobs'
  | 'broadcasts'
  | 'leads';

export type AdminResourceConfig = {
  key: AdminResourceKey;
  label: string;
  table: string;
  resourceType: string;
  orderColumn: string;
  listColumns: { key: string; label: string }[];
  titleField: string;
  subtitleField?: string;
};

export const ADMIN_RESOURCES: Record<AdminResourceKey, AdminResourceConfig> = {
  users: {
    key: 'users',
    label: 'Users',
    table: 'User',
    resourceType: 'user',
    orderColumn: 'createdAt',
    titleField: 'fullName',
    subtitleField: 'email',
    listColumns: [
      { key: 'fullName', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'createdAt', label: 'Joined' },
    ],
  },
  merchants: {
    key: 'merchants',
    label: 'Merchants',
    table: 'Business',
    resourceType: 'merchant',
    orderColumn: 'createdAt',
    titleField: 'businessName',
    subtitleField: 'email',
    listColumns: [
      { key: 'businessName', label: 'Business' },
      { key: 'email', label: 'Email' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Joined' },
    ],
  },
  movies: {
    key: 'movies',
    label: 'Movies',
    table: 'movies',
    resourceType: 'movie',
    orderColumn: 'created_at',
    titleField: 'name',
    listColumns: [
      { key: 'name', label: 'Title' },
      { key: 'finderb_rating', label: 'Rating' },
      { key: 'created_at', label: 'Added' },
    ],
  },
  tourist_places: {
    key: 'tourist_places',
    label: 'Tourist places',
    table: 'tourist_places',
    resourceType: 'tourist_place',
    orderColumn: 'created_at',
    titleField: 'name',
    subtitleField: 'location',
    listColumns: [
      { key: 'name', label: 'Place' },
      { key: 'location', label: 'Location' },
      { key: 'created_at', label: 'Added' },
    ],
  },
  categories: {
    key: 'categories',
    label: 'Categories',
    table: 'categories',
    resourceType: 'category',
    orderColumn: 'created_at',
    titleField: 'name',
    listColumns: [
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Added' },
    ],
  },
  news: {
    key: 'news',
    label: 'News',
    table: 'news',
    resourceType: 'news',
    orderColumn: 'created_at',
    titleField: 'title',
    listColumns: [
      { key: 'title', label: 'Title' },
      { key: 'author', label: 'Author' },
      { key: 'created_at', label: 'Added' },
    ],
  },
  blogs: {
    key: 'blogs',
    label: 'Blogs',
    table: 'blogs',
    resourceType: 'blog',
    orderColumn: 'created_at',
    titleField: 'title',
    listColumns: [
      { key: 'title', label: 'Title' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Added' },
    ],
  },
  jobs: {
    key: 'jobs',
    label: 'Jobs',
    table: 'jobs',
    resourceType: 'job',
    orderColumn: 'created_at',
    titleField: 'title',
    listColumns: [
      { key: 'title', label: 'Title' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Posted' },
    ],
  },
  broadcasts: {
    key: 'broadcasts',
    label: 'Broadcasts',
    table: 'broadcasts',
    resourceType: 'broadcast',
    orderColumn: 'created_at',
    titleField: 'title',
    listColumns: [
      { key: 'title', label: 'Title' },
      { key: 'created_at', label: 'Sent' },
    ],
  },
  leads: {
    key: 'leads',
    label: 'Leads',
    table: 'leads',
    resourceType: 'lead',
    orderColumn: 'created_at',
    titleField: 'name',
    subtitleField: 'category',
    listColumns: [
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Received' },
    ],
  },
};

export const ADMIN_RESOURCE_LIST = Object.values(ADMIN_RESOURCES);

export function isAdminResourceKey(value: string): value is AdminResourceKey {
  return value in ADMIN_RESOURCES;
}

export function getAdminResourceConfig(key: string): AdminResourceConfig | null {
  return isAdminResourceKey(key) ? ADMIN_RESOURCES[key] : null;
}
