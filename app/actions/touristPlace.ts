'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

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

    const mappedPlaces = places.map((p: any) => ({
      id: p.id,
      name: p.name,
      location: p.location,
      image: p.image_url || 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&q=80&w=800',
      distance: 'Nearby', // Default since not in DB
      rating: 4.8, // Default since not in DB
    }));

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

    const mappedPlace = {
      id: place.id,
      name: place.name,
      location: place.location,
      image: place.image_url || 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&q=80&w=800',
      description: place.description || 'No description available.',
      rating: 4.8,
      distance: 'Nearby'
    };

    return { success: true, touristPlace: mappedPlace };
  } catch (error: any) {
    console.error('Get Tourist Place Error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}
