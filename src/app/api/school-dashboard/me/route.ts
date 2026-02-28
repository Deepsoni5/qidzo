import { NextResponse } from 'next/server';
import { getSchoolDashboardData } from '@/actions/school';
import { currentUser } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const data = await getSchoolDashboardData();
    return NextResponse.json(data ?? {});
  } catch (err) {
    console.error('Error in /api/school-dashboard/me:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
