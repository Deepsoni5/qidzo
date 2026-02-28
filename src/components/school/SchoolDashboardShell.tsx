"use client";
import React, { useEffect, useState } from "react";
import SchoolDashboardContent from "@/components/school/SchoolDashboardContent";

export default function SchoolDashboardShell() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        const res = await fetch("/api/school-dashboard/me", {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to load dashboard data");
        const json = await res.json();
        if (mounted) setData(json);
      } catch (err: any) {
        if (mounted) setError(err?.message || "Failed to load dashboard");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-600">Error loading dashboard</div>;
  }

  return data ? <SchoolDashboardContent data={data} /> : null;
}
