import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(req: Request) {
  try {
    const { username } = await req.json();

    if (!username || username.length < 3) {
      return NextResponse.json(
        { available: false, message: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('children')
      .select('username')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found (which is good here)
      throw error;
    }

    if (data) {
      return NextResponse.json(
        { available: false, message: 'Username is already taken' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { available: true, message: 'Username is available' },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error checking username' },
      { status: 500 }
    );
  }
}
