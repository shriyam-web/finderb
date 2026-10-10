'use server';

import { createDataClient } from '@/utils/supabase/server';

export async function getMovies() {
  try {
    const supabase = await createDataClient();

    const { data: movies, error } = await supabase
      .from('movies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    const mappedMovies = movies.map((m: any) => ({
      id: m.id,
      title: m.name,
      genre: m.description || 'Entertainment', 
      image: m.poster_url || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=800',
      rating: m.finderb_rating ? Number(m.finderb_rating) : 0,
    }));

    return { success: true, movies: mappedMovies };
  } catch (error: any) {
    console.error('Get Movies Error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}
