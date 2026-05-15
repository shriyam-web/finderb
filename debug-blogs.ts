
import { createClient } from './utils/supabase/server';
import { cookies } from 'next/headers';

async function check() {
  try {
    const supabase = createClient(await cookies());
    const { data, error } = await supabase.from('blogs').select('id, slug, title');
    if (error) {
      console.error('Error:', error);
      return;
    }
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Catch error:', err);
  }
}

check();
