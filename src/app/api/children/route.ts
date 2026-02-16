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
      age,
      school_name,
      country,
      city
    } = body;

    // Basic validation
    if (
      !clerk_id ||
      !name ||
      !username ||
      !password ||
      !birth_date ||
      !age ||
      !school_name ||
      !country ||
      !city
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 1. Fetch the correct custom parent_id and available slots using the clerk_id
    const { data: parentData, error: parentError } = await supabase
        .from('parents')
        .select('parent_id, max_children_slots')
        .eq('clerk_id', clerk_id)
        .single();

    if (parentError || !parentData) {
        return NextResponse.json(
            { error: 'Parent profile not found' },
            { status: 404 }
        );
    }

    if (parentData.max_children_slots <= 0) {
      return NextResponse.json(
        { error: 'No children slots available. Please upgrade your plan.' },
        { status: 403 }
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
          school_name,
          country,
          city,
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

    // 2. Decrement max_children_slots
    const { error: updateError } = await supabase
      .from('parents')
      .update({ max_children_slots: parentData.max_children_slots - 1 })
      .eq('parent_id', parent_id);

    if (updateError) {
      console.error('Error decrementing parent slots:', updateError);
      // We don't throw here to avoid failing the whole request if the child was already created
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
