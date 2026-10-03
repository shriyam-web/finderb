import { Ionicons } from '@expo/vector-icons';
import { getBusinessOpenStatus } from './businessHours';
import { getDistanceKm, type Coords } from './geo';
import type { Merchant } from './merchants';

export type HoursChoice = 'any' | 'open-now' | 'closed';
export type RatingChoice = 'any' | '5' | '4.5' | '4' | '3';
export type DistanceChoice = 'any' | '1' | '2' | '5' | '10';
export type OfferChoice = 'any' | 'deals';
export type FilterPane = 'hours' | 'rating' | 'distance' | 'offers';

export type FilterState = {
  hours: HoursChoice;
  rating: RatingChoice;
  distance: DistanceChoice;
  offers: OfferChoice;
};

export const DEFAULT_FILTERS: FilterState = {
  hours: 'any',
  rating: 'any',
  distance: 'any',
  offers: 'any',
};

export const FILTER_PANES: Array<{
  id: FilterPane;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  soft: string;
}> = [
  {
    id: 'hours',
    label: 'Available',
    icon: 'time-outline',
    color: '#0F766E',
    soft: '#F3F8F6',
  },
  {
    id: 'rating',
    label: 'Rating',
    icon: 'star-outline',
    color: '#B45309',
    soft: '#F8F5F0',
  },
  {
    id: 'distance',
    label: 'Distance',
    icon: 'navigate-outline',
    color: '#1D4ED8',
    soft: '#F3F6FA',
  },
  {
    id: 'offers',
    label: 'Offers',
    icon: 'pricetag-outline',
    color: '#C2410C',
    soft: '#F8F4F1',
  },
];

export const HOURS_CHOICES: Array<{ id: HoursChoice; label: string }> = [
  { id: 'any', label: 'Any' },
  { id: 'open-now', label: 'Open now' },
  { id: 'closed', label: 'Closed' },
];

export const RATING_CHOICES: Array<{ id: RatingChoice; label: string }> = [
  { id: 'any', label: 'Any' },
  { id: '5', label: '5★ only' },
  { id: '4.5', label: '4.5★ & up' },
  { id: '4', label: '4★ & up' },
  { id: '3', label: '3★ & up' },
];

export const DISTANCE_CHOICES: Array<{ id: DistanceChoice; label: string }> = [
  { id: 'any', label: 'Any' },
  { id: '1', label: '1 km' },
  { id: '2', label: '2 km' },
  { id: '5', label: '5 km' },
  { id: '10', label: '10 km' },
];

export const OFFER_CHOICES: Array<{ id: OfferChoice; label: string }> = [
  { id: 'any', label: 'Any' },
  { id: 'deals', label: 'With offers' },
];

export function isDefaultFilters(filters: FilterState) {
  return (
    filters.hours === 'any' &&
    filters.rating === 'any' &&
    filters.distance === 'any' &&
    filters.offers === 'any'
  );
}

export function activeFilterCount(filters: FilterState) {
  return (
    Number(filters.hours !== 'any') +
    Number(filters.rating !== 'any') +
    Number(filters.distance !== 'any') +
    Number(filters.offers !== 'any')
  );
}

export function firstActivePane(filters: FilterState): FilterPane {
  if (filters.hours !== 'any') return 'hours';
  if (filters.rating !== 'any') return 'rating';
  if (filters.distance !== 'any') return 'distance';
  if (filters.offers !== 'any') return 'offers';
  return 'hours';
}

export function ratingValue(merchant: Merchant) {
  return merchant.rating != null && merchant.rating > 0 ? merchant.rating : 5;
}

function actualRating(merchant: Merchant) {
  return merchant.rating != null && merchant.rating > 0 ? merchant.rating : null;
}

function hasOffer(merchant: Merchant) {
  return (
    Boolean(merchant.discountRange) &&
    merchant.discountRange !== 'No Discount' &&
    merchant.discountRange !== 'Seasonal Offer'
  );
}

export function applyFilters(
  merchants: Merchant[],
  filters: FilterState,
  userCoords?: Coords | null,
) {
  let rows = [...merchants];

  if (filters.hours !== 'any') {
    rows = rows.filter((biz) => {
      const status = getBusinessOpenStatus(biz.timings).status;
      if (filters.hours === 'open-now') return status === 'Open';
      return status === 'Closed';
    });
  }

  if (filters.rating !== 'any') {
    const min = Number(filters.rating);
    rows = rows.filter((biz) => {
      const rating = actualRating(biz);
      if (rating == null) return false;
      if (filters.rating === '5') return rating >= 4.95;
      return rating >= min;
    });
  }

  if (filters.distance !== 'any' && userCoords) {
    const maxKm = Number(filters.distance);
    rows = rows.filter((biz) => {
      if (biz.latitude == null || biz.longitude == null) return false;
      return (
        getDistanceKm(
          userCoords.lat,
          userCoords.lng,
          biz.latitude,
          biz.longitude,
        ) <= maxKm
      );
    });
  }

  if (filters.offers === 'deals') {
    rows = rows.filter(hasOffer);
  }

  // Listings arrive ranked nearest-first; keep that whenever the user is located.
  if (userCoords) return rows;

  rows.sort((a, b) => {
    if (a.isVerified !== b.isVerified) {
      return Number(b.isVerified) - Number(a.isVerified);
    }
    return ratingValue(b) - ratingValue(a);
  });
  return rows;
}
