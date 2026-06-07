'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { mapTouristPlaceRow } from '@/lib/touristPlaceImage';

export async function getTouristPlaces() {
  try {
    const supabase = createClient(await cookies());

    const { data: places, error } = await supabase
      .from('tourist_places')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    const mappedPlaces = (places ?? []).map(mapTouristPlaceRow);

    return { success: true, touristPlaces: mappedPlaces };
  } catch (error: any) {
    console.error('Get Tourist Places Error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function getTouristPlace(id: string) {
  try {
    const supabase = createClient(await cookies());

    const { data: place, error } = await supabase
      .from('tourist_places')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return { success: true, touristPlace: mapTouristPlaceRow(place) };
  } catch (error: any) {
    console.error('Get Tourist Place Error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function getNearbyTouristPlaces(currentId: string, limit = 3) {
  try {
    const supabase = createClient(await cookies());

    const { data: places, error } = await supabase
      .from('tourist_places')
      .select('*')
      .neq('id', currentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return {
      success: true,
      touristPlaces: (places ?? []).map(mapTouristPlaceRow),
    };
  } catch (error: any) {
    console.error('Get Nearby Tourist Places Error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}
