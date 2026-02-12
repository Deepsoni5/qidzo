"use client";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CHART_DATA_CATEGORIES } from "@/lib/mockParentData";
import DailyActivityChart from "./DailyActivityChart";
import { useEffect, useState } from "react";
import { getMyChildren } from "@/actions/parent";
import { Loader2 } from "lucide-react";

interface Child {
  id: string;
  child_id: string;
  name: string;
  username?: string;
  avatar?: string;
  age?: number;
}

export default function AnalyticsCharts() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChildren() {
      const result = await getMyChildren();
      // result is Child[] because getMyChildren returns data || []
      setChildren(result || []);
      setLoading(false);
    }
    fetchChildren();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 mb-8">
      {/* Daily Activity Charts for each child */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {children.map((child) => (
          <DailyActivityChart key={child.child_id} childId={child.child_id} childName={child.name} />
        ))}
      </div>
    </div>
  );
}
