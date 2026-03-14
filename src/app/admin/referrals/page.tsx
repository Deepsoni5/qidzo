"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getAdminReferralData,
  type AdminReferralSummary,
  type AdminReferralRecord,
} from "@/actions/admin-referrals";
import {
  Users,
  ShoppingBag,
  Coins,
  Gift,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  RefreshCw,
  Mail,
  Calendar,
  TrendingUp,
  Filter,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PLAN_COLORS: Record<string, string> = {
  FREE: "bg-gray-100 text-gray-500",
  BASIC: "bg-sky-100 text-sky-600",
  PRO: "bg-brand-purple/10 text-brand-purple",
  ELITE: "bg-hot-pink/10 text-hot-pink",
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

// Expandable row for each referrer
function ReferrerRow({
  record,
  index,
}: {
  record: AdminReferralRecord;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Referrer Summary Row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 md:p-5 text-left hover:bg-gray-50/50 transition-colors cursor-pointer"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-xl bg-brand-purple/10 text-brand-purple font-black text-lg flex items-center justify-center shrink-0">
          {record.referrerName[0]?.toUpperCase() || "?"}
        </div>

        {/* Name + Email */}
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-900 text-sm truncate">
            {record.referrerName}
          </p>
          <p className="text-xs font-bold text-gray-400 truncate flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {record.referrerEmail}
          </p>
        </div>

        {/* Code */}
        <div className="hidden sm:block shrink-0">
          <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-mono">
            {record.referralCode.slice(0, 8)}...
          </span>
        </div>

        {/* Signups */}
        <div className="text-center shrink-0 hidden md:block">
          <p className="font-black text-gray-900">{record.totalSignups}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase">
            Signups
          </p>
        </div>

        {/* Purchases */}
        <div className="text-center shrink-0 hidden md:block">
          <p className="font-black text-hot-pink">{record.purchasedPlans}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase">
            Bought
          </p>
        </div>

        {/* Commission */}
        <div className="text-right shrink-0">
          <p className="font-black text-grass-green text-sm">
            {formatINR(record.totalCommission)}
          </p>
          <p className="text-[10px] font-bold text-gray-400 uppercase">
            Commission
          </p>
        </div>

        {/* Expand icon */}
        <div className="shrink-0 ml-2 text-gray-400">
          {expanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </button>

      {/* Expanded Referrals */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-2">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                Referred Users ({record.referrals.length})
              </p>
              {record.referrals.length === 0 ? (
                <p className="text-sm font-bold text-gray-400 text-center py-4">
                  No referrals yet
                </p>
              ) : (
                record.referrals.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100"
                  >
                    <div className="w-8 h-8 rounded-lg bg-sky-blue/10 text-sky-blue font-black text-sm flex items-center justify-center shrink-0">
                      {entry.refereeName[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-800 text-sm truncate">
                        {entry.refereeName}
                      </p>
                      <p className="text-xs font-bold text-gray-400 truncate">
                        {entry.refereeEmail}
                      </p>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 text-xs font-bold text-gray-400 shrink-0">
                      <Calendar className="w-3 h-3" />
                      {formatDate(entry.signedUpAt)}
                    </div>
                    <div className="shrink-0">
                      <span
                        className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase ${PLAN_COLORS[entry.currentPlan] || PLAN_COLORS.FREE}`}
                      >
                        {entry.currentPlan}
                      </span>
                    </div>
                    <div className="text-right shrink-0 min-w-[80px]">
                      {entry.firstPaidPlan ? (
                        <>
                          <p className="font-black text-grass-green text-sm">
                            {entry.firstPaidCurrency === "USD"
                              ? `$${entry.commission.toFixed(2)}`
                              : formatINR(entry.commission)}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400">
                            {entry.firstPaidPlan} · {entry.firstPaidInterval}
                          </p>
                        </>
                      ) : (
                        <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">
                          No purchase
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AdminReferralsPage() {
  const [data, setData] = useState<AdminReferralSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"commission" | "signups" | "purchases">(
    "commission",
  );
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const result = await getAdminReferralData();
    setData(result);
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    let records = [...data.records];

    // Search by name, email, or code
    if (search.trim()) {
      const q = search.toLowerCase();
      records = records.filter(
        (r) =>
          r.referrerName.toLowerCase().includes(q) ||
          r.referrerEmail.toLowerCase().includes(q) ||
          r.referralCode.toLowerCase().includes(q),
      );
    }

    // Filter by plan purchased
    if (filterPlan !== "ALL") {
      records = records.filter((r) =>
        r.referrals.some((e) => e.firstPaidPlan === filterPlan),
      );
    }

    // Sort
    records.sort((a, b) => {
      const val =
        sortBy === "commission"
          ? [a.totalCommission, b.totalCommission]
          : sortBy === "signups"
            ? [a.totalSignups, b.totalSignups]
            : [a.purchasedPlans, b.purchasedPlans];
      return sortDir === "desc" ? val[1] - val[0] : val[0] - val[1];
    });

    return records;
  }, [data, search, filterPlan, sortBy, sortDir]);

  const SortBtn = ({ col, label }: { col: typeof sortBy; label: string }) => (
    <button
      onClick={() => toggleSort(col)}
      className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${sortBy === col ? "text-brand-purple" : "text-gray-400 hover:text-gray-600"}`}
    >
      {label}
      <ArrowUpDown className="w-3 h-3" />
    </button>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-purple/10 rounded-2xl flex items-center justify-center">
              <Gift className="w-5 h-5 text-brand-purple" />
            </div>
            Referral Management
          </h1>
          <p className="text-gray-500 font-bold mt-1 text-sm">
            Track all referrals, commissions, and payouts
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-100 rounded-2xl font-black text-sm text-gray-600 shadow-sm hover:border-brand-purple/30 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 text-brand-purple ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-28 bg-white rounded-[28px] border border-gray-100 animate-pulse"
              />
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Active Referrers",
              value: data?.totalReferrers || 0,
              icon: Users,
              color: "text-brand-purple",
              bg: "bg-brand-purple/10",
              suffix: "",
            },
            {
              label: "Total Signups",
              value: data?.totalSignups || 0,
              icon: TrendingUp,
              color: "text-sky-blue",
              bg: "bg-sky-blue/10",
              suffix: "",
            },
            {
              label: "Plans Purchased",
              value: data?.totalPurchases || 0,
              icon: ShoppingBag,
              color: "text-hot-pink",
              bg: "bg-hot-pink/10",
              suffix: "",
            },
            {
              label: "Commission Owed",
              value: data?.totalCommissionOwed || 0,
              icon: Coins,
              color: "text-grass-green",
              bg: "bg-grass-green/10",
              suffix: "₹",
              isAmount: true,
            },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 hover:shadow-lg transition-all"
            >
              <div
                className={`w-10 h-10 ${card.bg} ${card.color} rounded-xl flex items-center justify-center mb-3`}
              >
                <card.icon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                {card.label}
              </p>
              <p className="text-2xl font-black text-gray-900">
                {(card as any).isAmount
                  ? formatINR(card.value as number)
                  : card.value}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Commission Breakdown Banner */}
      <div className="bg-gradient-to-r from-brand-purple to-hot-pink p-px rounded-[24px]">
        <div className="bg-white rounded-[23px] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-sunshine-yellow/20 rounded-xl flex items-center justify-center text-xl">
              💰
            </div>
            <div>
              <p className="font-black text-gray-900 text-sm">
                Commission Rate: 50% one-time on first purchase
              </p>
              <p className="text-xs font-bold text-gray-500">
                Varies by plan, billing interval, and currency
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-3">
                🇮🇳 INR Commissions
              </p>
              <div className="space-y-2">
                {[
                  {
                    plan: "BASIC",
                    mc: "bg-sky-100 text-sky-600",
                    monthly: "₹49.50",
                    yearly: "₹499.50",
                  },
                  {
                    plan: "PRO",
                    mc: "bg-brand-purple/10 text-brand-purple",
                    monthly: "₹149.50",
                    yearly: "₹1,499.50",
                  },
                  {
                    plan: "ELITE",
                    mc: "bg-hot-pink/10 text-hot-pink",
                    monthly: "₹199.50",
                    yearly: "₹1,999.50",
                  },
                ].map((p) => (
                  <div
                    key={p.plan}
                    className="flex items-center justify-between"
                  >
                    <span
                      className={`text-[10px] font-black px-2 py-1 rounded-lg ${p.mc}`}
                    >
                      {p.plan}
                    </span>
                    <span className="text-xs font-bold text-gray-600">
                      {p.monthly}/mo · {p.yearly}/yr
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">
                🌍 USD Commissions
              </p>
              <div className="space-y-2">
                {[
                  {
                    plan: "BASIC",
                    mc: "bg-sky-100 text-sky-600",
                    monthly: "$1.50",
                    yearly: "$7.00",
                  },
                  {
                    plan: "PRO",
                    mc: "bg-brand-purple/10 text-brand-purple",
                    monthly: "$2.50",
                    yearly: "$20.00",
                  },
                  {
                    plan: "ELITE",
                    mc: "bg-hot-pink/10 text-hot-pink",
                    monthly: "$3.50",
                    yearly: "$27.50",
                  },
                ].map((p) => (
                  <div
                    key={p.plan}
                    className="flex items-center justify-between"
                  >
                    <span
                      className={`text-[10px] font-black px-2 py-1 rounded-lg ${p.mc}`}
                    >
                      {p.plan}
                    </span>
                    <span className="text-xs font-bold text-gray-600">
                      {p.monthly}/mo · {p.yearly}/yr
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or referral code..."
            className="w-full pl-11 pr-10 py-3 border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:border-brand-purple/40 transition-all bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-white border-2 border-gray-100 rounded-2xl px-3 py-2">
            <Filter className="w-4 h-4 text-gray-400" />
            {["ALL", "BASIC", "PRO", "ELITE"].map((plan) => (
              <button
                key={plan}
                onClick={() => setFilterPlan(plan)}
                className={`text-[10px] font-black px-2.5 py-1 rounded-xl transition-all cursor-pointer ${filterPlan === plan ? "bg-brand-purple text-white" : "text-gray-500 hover:bg-gray-100"}`}
              >
                {plan}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sort Bar */}
      <div className="flex items-center gap-4 px-1">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Sort by:
        </span>
        <SortBtn col="commission" label="Commission" />
        <SortBtn col="signups" label="Signups" />
        <SortBtn col="purchases" label="Purchases" />
        {filtered.length > 0 && (
          <span className="ml-auto text-xs font-bold text-gray-400">
            {filtered.length} referrer{filtered.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Records List */}
      {loading ? (
        <div className="space-y-3">
          {Array(5)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse"
              />
            ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[28px] border border-gray-100 p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
            🎁
          </div>
          <h3 className="font-black text-gray-900 text-lg mb-2">
            No referrals found
          </h3>
          <p className="text-gray-500 font-bold text-sm">
            {search || filterPlan !== "ALL"
              ? "Try adjusting your search or filters."
              : "No one has used a referral link yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((record, i) => (
            <ReferrerRow key={record.referrerId} record={record} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
