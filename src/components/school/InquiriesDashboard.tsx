"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Mail,
  MailOpen,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  User,
  Phone,
  Calendar,
  ChevronDown,
  Loader2,
  Eye,
  Edit3,
  X,
  Inbox,
  TrendingUp,
} from "lucide-react";
import {
  getSchoolInquiries,
  markInquiryAsRead,
  updateInquiryStatus,
  getInquiryStats,
  type SchoolInquiry,
  type InquiriesFilters,
} from "@/actions/school-inquiry-dashboard";
import { toast } from "sonner";

const STATUS_COLORS = {
  PENDING: {
    bg: "bg-sunshine-yellow/10",
    text: "text-sunshine-yellow",
    border: "border-sunshine-yellow/20",
    icon: Clock,
  },
  READ: {
    bg: "bg-sky-blue/10",
    text: "text-sky-blue",
    border: "border-sky-blue/20",
    icon: MailOpen,
  },
  REPLIED: {
    bg: "bg-grass-green/10",
    text: "text-grass-green",
    border: "border-grass-green/20",
    icon: CheckCircle2,
  },
  CLOSED: {
    bg: "bg-gray-100",
    text: "text-gray-500",
    border: "border-gray-200",
    icon: XCircle,
  },
};

function InquiryDetailModal({
  inquiry,
  isOpen,
  onClose,
  onStatusUpdate,
}: {
  inquiry: SchoolInquiry | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: () => void;
}) {
  const [status, setStatus] = useState(inquiry?.status || "PENDING");
  const [adminNotes, setAdminNotes] = useState(inquiry?.admin_notes || "");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (inquiry) {
      setStatus(inquiry.status);
      setAdminNotes(inquiry.admin_notes || "");
    }
  }, [inquiry]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !inquiry) return null;

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      const result = await updateInquiryStatus(
        inquiry.id,
        status as any,
        adminNotes,
      );
      if (result.success) {
        toast.success("Inquiry updated successfully!");
        onStatusUpdate();
        onClose();
      } else {
        toast.error(result.error || "Failed to update inquiry");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const StatusIcon = STATUS_COLORS[inquiry.status].icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-[32px] shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 sm:px-8 py-6 border-b border-gray-100 bg-white rounded-t-[32px]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black ${STATUS_COLORS[inquiry.status].bg} ${STATUS_COLORS[inquiry.status].text} border ${STATUS_COLORS[inquiry.status].border} flex items-center gap-1.5`}
                >
                  <StatusIcon className="w-3.5 h-3.5" />
                  {inquiry.status}
                </span>
                <span className="text-xs font-bold text-gray-400">
                  {inquiry.inquiry_id}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-nunito text-gray-900 mb-1">
                {inquiry.subject}
              </h2>
              <p className="text-sm font-bold text-gray-500">
                Received{" "}
                {new Date(inquiry.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 sm:px-8 py-6 space-y-6">
          {/* Sender Info */}
          <div className="bg-linear-to-br from-sky-blue/5 to-brand-purple/5 rounded-[24px] p-6 border border-gray-100">
            <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest mb-4">
              Sender Information
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <User className="w-4 h-4 text-sky-blue" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Name
                  </p>
                  <p className="text-sm font-black text-gray-900">
                    {inquiry.name}
                  </p>
                  <p className="text-xs font-bold text-gray-500 mt-0.5">
                    {inquiry.user_type === "CHILD" ? "Child" : "Parent"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Mail className="w-4 h-4 text-brand-purple" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Email
                  </p>
                  <a
                    href={`mailto:${inquiry.email}`}
                    className="text-sm font-black text-brand-purple hover:underline"
                  >
                    {inquiry.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Phone className="w-4 h-4 text-grass-green" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Phone
                  </p>
                  <a
                    href={`tel:${inquiry.phone}`}
                    className="text-sm font-black text-grass-green hover:underline"
                  >
                    {inquiry.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-xl shadow-sm">
                  <Calendar className="w-4 h-4 text-hot-pink" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Submitted
                  </p>
                  <p className="text-sm font-black text-gray-900">
                    {new Date(inquiry.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest mb-3">
              Message
            </h3>
            <div className="bg-white rounded-[20px] p-5 border-2 border-gray-100">
              <p className="text-sm font-bold text-gray-700 leading-relaxed whitespace-pre-wrap">
                {inquiry.message}
              </p>
            </div>
          </div>

          {/* Status Update */}
          <div>
            <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest mb-3">
              Update Status
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-600 uppercase tracking-wide mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(
                      e.target.value as
                        | "PENDING"
                        | "READ"
                        | "REPLIED"
                        | "CLOSED",
                    )
                  }
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900"
                >
                  <option value="PENDING">Pending</option>
                  <option value="READ">Read</option>
                  <option value="REPLIED">Replied</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-600 uppercase tracking-wide mb-2">
                  Admin Notes (Internal)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this inquiry..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-2xl border-2 border-gray-200 bg-white text-gray-700 font-black text-sm hover:bg-gray-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="flex-1 px-6 py-3 rounded-2xl bg-sky-blue text-white font-black text-sm shadow-lg shadow-sky-blue/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Update Inquiry
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InquiriesDashboard() {
  const [inquiries, setInquiries] = useState<SchoolInquiry[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<SchoolInquiry[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<SchoolInquiry | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    pending: 0,
    replied: 0,
  });

  const [filters, setFilters] = useState<InquiriesFilters>({
    status: "all",
    userType: "all",
    search: "",
    sortBy: "newest",
  });

  useEffect(() => {
    loadInquiries();
    loadStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [inquiries, filters]);

  const loadInquiries = async () => {
    setIsLoading(true);
    const result = await getSchoolInquiries();
    if (result.success) {
      setInquiries(result.data);
    } else {
      toast.error(result.error || "Failed to load inquiries");
    }
    setIsLoading(false);
  };

  const loadStats = async () => {
    const result = await getInquiryStats();
    if (result.success && result.stats) {
      setStats(result.stats);
    }
  };

  const applyFilters = () => {
    let filtered = [...inquiries];

    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter(
        (inq) => inq.status === filters.status?.toUpperCase(),
      );
    }

    if (filters.userType && filters.userType !== "all") {
      filtered = filtered.filter(
        (inq) => inq.user_type === filters.userType?.toUpperCase(),
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (inq) =>
          inq.name.toLowerCase().includes(searchLower) ||
          inq.email.toLowerCase().includes(searchLower) ||
          inq.subject.toLowerCase().includes(searchLower) ||
          inq.message.toLowerCase().includes(searchLower),
      );
    }

    switch (filters.sortBy) {
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        break;
      case "unread":
        filtered.sort((a, b) => {
          if (a.is_read === b.is_read) {
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          }
          return a.is_read ? 1 : -1;
        });
        break;
      case "newest":
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
    }

    setFilteredInquiries(filtered);
  };

  const handleViewInquiry = async (inquiry: SchoolInquiry) => {
    setSelectedInquiry(inquiry);
    setIsModalOpen(true);

    if (!inquiry.is_read) {
      await markInquiryAsRead(inquiry.id);
      loadInquiries();
      loadStats();
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedInquiry(null), 200);
  };

  const handleStatusUpdate = () => {
    loadInquiries();
    loadStats();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black font-nunito text-gray-900 mb-2">
            Inquiries Dashboard 📬
          </h1>
          <p className="text-sm font-bold text-gray-500">
            Manage and respond to inquiries from parents and students
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Total Inquiries",
              value: stats.total,
              icon: Inbox,
              color: "sky-blue",
            },
            {
              label: "Unread",
              value: stats.unread,
              icon: Mail,
              color: "hot-pink",
            },
            {
              label: "Pending",
              value: stats.pending,
              icon: Clock,
              color: "sunshine-yellow",
            },
            {
              label: "Replied",
              value: stats.replied,
              icon: CheckCircle2,
              color: "grass-green",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-[24px] p-5 border border-gray-100 shadow-sm"
            >
              {" "}
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`p-2 rounded-xl bg-${stat.color}/10`}
                  style={{
                    backgroundColor:
                      stat.color === "sky-blue"
                        ? "#0EA5E910"
                        : stat.color === "hot-pink"
                          ? "#EC489910"
                          : stat.color === "sunshine-yellow"
                            ? "#FBBF2410"
                            : "#10B98110",
                  }}
                >
                  <stat.icon
                    className="w-5 h-5"
                    style={{
                      color:
                        stat.color === "sky-blue"
                          ? "#0EA5E9"
                          : stat.color === "hot-pink"
                            ? "#EC4899"
                            : stat.color === "sunshine-yellow"
                              ? "#FBBF24"
                              : "#10B981",
                    }}
                  />
                </div>
                <TrendingUp className="w-4 h-4 text-gray-300" />
              </div>
              <p className="text-2xl font-black font-nunito text-gray-900 mb-1">
                {stat.value}
              </p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm mb-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search inquiries..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="read">Read</option>
                <option value="replied">Replied</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    sortBy: e.target.value as any,
                  })
                }
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 focus:border-sky-blue focus:ring-4 focus:ring-sky-blue/10 outline-none transition-all text-sm font-bold text-gray-900"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="unread">Unread First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inquiries List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-sky-blue" />
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="bg-white rounded-[28px] p-12 border border-gray-100 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Inbox className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-black font-nunito text-gray-900 mb-2">
              No Inquiries Found
            </h3>
            <p className="text-sm font-bold text-gray-500">
              {filters.search || filters.status !== "all"
                ? "Try adjusting your filters"
                : "You haven't received any inquiries yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInquiries.map((inquiry) => {
              const StatusIcon = STATUS_COLORS[inquiry.status].icon;
              return (
                <div
                  key={inquiry.id}
                  onClick={() => handleViewInquiry(inquiry)}
                  className={`bg-white rounded-[24px] p-5 border-2 transition-all cursor-pointer hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] ${
                    inquiry.is_read
                      ? "border-gray-100"
                      : "border-sky-blue/30 bg-sky-blue/5"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${STATUS_COLORS[inquiry.status].bg}`}
                    >
                      <StatusIcon
                        className={`w-6 h-6 ${STATUS_COLORS[inquiry.status].text}`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`text-base font-black font-nunito text-gray-900 truncate ${!inquiry.is_read ? "font-black" : ""}`}
                            >
                              {inquiry.subject}
                            </h3>
                            {!inquiry.is_read && (
                              <span className="shrink-0 w-2 h-2 rounded-full bg-hot-pink" />
                            )}
                          </div>
                          <p className="text-sm font-bold text-gray-600 truncate">
                            From: {inquiry.name} ({inquiry.user_type})
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${STATUS_COLORS[inquiry.status].bg} ${STATUS_COLORS[inquiry.status].text} border ${STATUS_COLORS[inquiry.status].border}`}
                          >
                            {inquiry.status}
                          </span>
                          <p className="text-xs font-bold text-gray-400 mt-1">
                            {new Date(inquiry.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                              },
                            )}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm font-bold text-gray-500 line-clamp-2 mb-3">
                        {inquiry.message}
                      </p>

                      <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          {inquiry.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          {inquiry.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <InquiryDetailModal
        inquiry={selectedInquiry}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}
