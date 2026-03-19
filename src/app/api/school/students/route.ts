import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { getSchoolStudents } from "@/actions/school";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const students = await getSchoolStudents();
    return NextResponse.json({ students: students || [] });
  } catch (err) {
    console.error("Error in /api/school/students:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
