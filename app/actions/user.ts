'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Safe error handler wrapper
function handleError(error: any, context: string): string {
  console.error(`${context} Error:`, error);

  const msg = error?.message || String(error) || 'An unexpected error occurred';

  if (error?.code === 'PGRST116') {
    return 'Record not found.';
  }

  if (error?.code === '23505') {
    if (msg.includes('email')) {
      return 'This email already exists.';
    }
    return 'Duplicate entry found.';
  }

  if (msg.includes('connect') || msg.includes('ECONNREFUSED') || msg.includes('timeout')) {
    return 'Database connection failed. Please check your configuration.';
  }

  return msg;
}

export async function registerUser(formData: any) {
  const startTime = Date.now();

  try {
    // Validate required fields
    if (!formData.fullName || !formData.email || !formData.password) {
      return { success: false, error: 'All fields are required' };
    }

    console.log('✓ [USER REGISTER] Validation passed');
    
    const normalizedEmail = formData.email.toLowerCase().trim();
    const supabase = createClient(await cookies());

    console.log('[USER REGISTER] Creating user record...');

    const now = new Date().toISOString();
    const { data: user, error } = await supabase
      .from('User')
      .insert({
        id: crypto.randomUUID(),
        fullName: formData.fullName,
        email: normalizedEmail,
        password: formData.password, // In a real app, hash this!
        favorites: [],
        searchHistory: [],
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log('[USER REGISTER] ✓ Success:', user.id);
    
    // Set a cookie for the user ID to maintain session
    (await cookies()).set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return { success: true, user };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[USER REGISTER] ✗ Failed after ${duration}ms:`, error);
    const errorMessage = handleError(error, 'User Registration');
    return { success: false, error: errorMessage };
  }
}

export async function loginUser(email: string, password: string) {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    console.log('User login attempt:', email);

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = createClient(await cookies());

    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'User account not found.' };
      }
      throw error;
    }

    if (user.password !== password.trim()) {
      return { success: false, error: 'Incorrect password.' };
    }

    console.log('User login successful:', user.id);
    
    // Set a cookie for the user ID to maintain session
    (await cookies()).set('user_id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return { success: true, userId: user.id };
  } catch (error: any) {
    const errorMessage = handleError(error, 'User Login');
    return { success: false, error: errorMessage };
  }
}

export async function getUser(id: string) {
  try {
    if (!id) {
      return { success: false, error: 'User ID is required' };
    }

    const supabase = createClient(await cookies());

    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'User not found' };
      }
      throw error;
    }

    return { success: true, user };
  } catch (error: any) {
    const errorMessage = handleError(error, 'Get User');
    return { success: false, error: errorMessage };
  }
}

export async function logoutUser() {
  try {
    (await cookies()).delete('user_id');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: 'Failed to logout' };
  }
}

export async function getSession() {
  const userId = (await cookies()).get('user_id')?.value;
  if (!userId) return null;
  return await getUser(userId);
}
