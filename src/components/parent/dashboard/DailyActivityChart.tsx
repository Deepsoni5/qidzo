"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { getChildDailyActivity } from "@/actions/screen-time";
import { Loader2, Clock } from "lucide-react";

interface DailyActivityChartProps {
  // Optional childId to filter, otherwise shows aggregated
  childId?: string;
  childName?: string;
}

export default function DailyActivityChart({ childId, childName }: DailyActivityChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMinutes, setTotalMinutes] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const result = await getChildDailyActivity(childId);
      if (result.success && result.data) {
        setData(result.data);
        const total = result.data.reduce((acc: number, curr: any) => acc + curr.minutes, 0);
        setTotalMinutes(total);
      }
      setLoading(false);
    }
    fetchData();
  }, [childId]);

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-purple animate-spin" />
      </div>
    );
  }

  const formatTotalTime = (mins: number) => {
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    if (hrs === 0) return `${m}m`;
    return `${hrs}h ${m}m`;
  };

  // Filter data to show only hours with activity or a reasonable range
  // For a "beautiful" chart, we'll show the full day but maybe focus on 6AM-10PM if empty
  const chartData = data;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-black font-nunito text-gray-900">
          {childName ? `${childName}'s Activity` : "Today's Activity"}
        </h2>
        <div className="flex items-center gap-2 bg-brand-purple/10 text-brand-purple px-3 py-1.5 rounded-xl">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-black">
            {formatTotalTime(totalMinutes)}
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
              dataKey="hour" 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 12, fill: '#9ca3af', fontWeight: 'bold'}}
              dy={10}
              interval={3} // Show every 4th hour label
              tickFormatter={(value) => `${value}:00`}
            />
            <Tooltip
              cursor={{ fill: '#f9fafb' }}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 rounded-2xl shadow-xl border border-gray-100 font-bold">
                      <p className="text-gray-400 text-xs mb-1">{payload[0].payload.displayHour}</p>
                      <p className="text-brand-purple text-lg">{payload[0].value} <span className="text-sm">mins</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="minutes" 
              radius={[6, 6, 0, 0]}
              barSize={30}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.minutes > 0 ? '#8B5CF6' : '#F3F4F6'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
