import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import bcrypt from 'bcrypt';
import { invalidateParentCache } from "@/actions/parent";

function generateChildId() {
  const year = new Date().getFullYear().toString().slice(-2);
  const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `QC${year}${randomChars}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      clerk_id, // Received from frontend instead of parent_id
      name,
      username,
      bio,
      password,
      birth_date,
      gender,
      avatar,
      preferred_categories,
      age
    } = body;

    // Basic validation
    if (!clerk_id || !name || !username || !password || !birth_date || !age) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Fetch the correct custom parent_id using the clerk_id
    const { data: parentData, error: parentError } = await supabase
        .from('parents')
        .select('parent_id')
        .eq('clerk_id', clerk_id)
        .single();

    if (parentError || !parentData) {
        return NextResponse.json(
            { error: 'Parent profile not found' },
            { status: 404 }
        );
    }

    const parent_id = parentData.parent_id;

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Generate Child ID
    let child_id = generateChildId();
    
    // Ensure uniqueness of child_id (simple check)
    let isUnique = false;
    while (!isUnique) {
      const { data } = await supabase
        .from('children')
        .select('child_id')
        .eq('child_id', child_id)
        .single();
      
      if (!data) {
        isUnique = true;
      } else {
        child_id = generateChildId();
      }
    }

    // Insert into database
    const { data, error } = await supabase
      .from('children')
      .insert([
        {
          parent_id,
          child_id,
          name,
          username,
          bio,
          password_hash,
          birth_date,
          age,
          gender,
          avatar: avatar || "https://cdn-icons-png.flaticon.com/512/847/847969.png",
          preferred_categories,
          // Default values are handled by DB or can be explicit here
          xp_points: 0,
          level: 1,
          is_active: true,
          role: 'children'
        }
      ])
      .select()
      .single();

    if (error) {
        console.error('Database Error Details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
            parent_id_length: parent_id?.length,
            child_id_length: child_id?.length
        });
        throw error;
    }

    // Invalidate Cache for this parent
    await invalidateParentCache(clerk_id);

    return NextResponse.json(
      { success: true, child: data },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating child:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create child profile' },
      { status: 500 }
    );
  }
}
