import { SITE_URL } from './supabase';
import { getStoredToken } from './session';

type FavFailure = {
  success: false;
  error: string;
  unauthorized?: boolean;
};

type AuthHeaders = {
  'Content-Type': string;
  Accept: string;
  Authorization: string;
};

function isFavFailure(value: FavFailure | AuthHeaders): value is FavFailure {
  return 'success' in value && value.success === false;
}

async function headersOrFail(): Promise<AuthHeaders | FavFailure> {
  const token = await getStoredToken();
  if (!token) {
    return { success: false, error: 'Please log in.', unauthorized: true };
  }
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchFavoriteIds(): Promise<{ favoriteIds: string[] } | FavFailure> {
  const headers = await headersOrFail();
  if (isFavFailure(headers)) return headers;

  try {
    const res = await fetch(`${SITE_URL}/api/favorites`, { headers });
    const data = (await res.json()) as {
      success?: boolean;
      favoriteIds?: string[];
      error?: string;
    };
    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Could not load favourites.',
        unauthorized: res.status === 401,
      };
    }
    return { favoriteIds: Array.isArray(data.favoriteIds) ? data.favoriteIds : [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error.',
    };
  }
}

export async function toggleFavorite(
  businessId: string,
): Promise<{ saved: boolean; favoriteIds: string[] } | FavFailure> {
  const headers = await headersOrFail();
  if (isFavFailure(headers)) return headers;

  try {
    const res = await fetch(`${SITE_URL}/api/favorites`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ businessId }),
    });
    const data = (await res.json()) as {
      success?: boolean;
      saved?: boolean;
      favoriteIds?: string[];
      error?: string;
    };
    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Could not update favourites.',
        unauthorized: res.status === 401,
      };
    }
    return {
      saved: Boolean(data.saved),
      favoriteIds: Array.isArray(data.favoriteIds) ? data.favoriteIds : [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error.',
    };
  }
}
