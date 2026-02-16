 "use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Mail,
  Search,
  Filter,
  Loader2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type ContactStatus = "NEW" | "IN_PROGRESS" | "RESOLVED";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  handled_by: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ContactStatus>("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setMessages((data as ContactMessage[]) || []);
    } catch (error: any) {
      toast.error("Failed to load messages: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: ContactStatus) => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({
          status,
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status } : m))
      );
      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, status });
      }
      toast.success("Message status updated");
    } catch (error: any) {
      toast.error("Failed to update status: " + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
        m.name.toLowerCase().includes(search) ||
        m.email.toLowerCase().includes(search) ||
        m.subject.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" ? true : m.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [messages, searchTerm, statusFilter]);

  const getStatusBadge = (status: ContactStatus) => {
    if (status === "NEW") {
      return "bg-brand-purple/10 text-brand-purple border-brand-purple/20";
    }
    if (status === "IN_PROGRESS") {
      return "bg-amber-100 text-amber-700 border-amber-200";
    }
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Contact Messages
          </h1>
          <p className="text-gray-500 font-bold mt-1">
            Review and respond to messages from parents and visitors.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-9 h-9 rounded-xl bg-brand-purple/10 flex items-center justify-center">
            <Mail className="w-5 h-5 text-brand-purple" />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
              Total Messages
            </p>
            <p className="text-lg font-black text-gray-900">
              {messages.length}
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-brand-purple transition-colors" />
          <input
            type="text"
            placeholder="Search by name, email or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-4 py-5 bg-white border-2 border-gray-50 rounded-[28px] font-bold text-gray-700 focus:border-brand-purple/20 outline-none transition-all shadow-sm focus:shadow-xl focus:shadow-brand-purple/5"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-50 rounded-[24px] shadow-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="bg-transparent font-bold text-gray-700 outline-none cursor-pointer text-sm"
            >
              <option value="all">All Status</option>
              <option value="NEW">New</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] gap-6 items-start">
        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-50 px-6 py-4 flex items-center justify-between">
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em]">
              Inbox
            </p>
            {!loading && (
              <span className="text-[11px] font-bold text-gray-500">
                {filteredMessages.length} result
                {filteredMessages.length === 1 ? "" : "s"}
              </span>
            )}
          </div>

          <div className="max-h-[540px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-6 h-6 text-brand-purple animate-spin" />
                  <p className="text-sm font-bold text-gray-500">
                    Loading messages...
                  </p>
                </div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center text-gray-400">
                <AlertTriangle className="w-10 h-10 mb-3" />
                <p className="font-black text-gray-600 mb-1">
                  No messages found
                </p>
                <p className="text-sm font-bold text-gray-400">
                  Try adjusting your filters or check back later.
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredMessages.map((m) => (
                  <motion.button
                    key={m.id}
                    type="button"
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    onClick={() => setSelectedMessage(m)}
                    className={`w-full text-left px-6 py-4 border-b border-gray-50 hover:bg-gray-50/60 transition-colors flex gap-4 ${
                      selectedMessage?.id === m.id ? "bg-gray-50/80" : ""
                    }`}
                  >
                    <div className="mt-1">
                      <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-brand-purple/10 to-sky-blue/10 flex items-center justify-center border border-white shadow-sm">
                        <span className="text-sm font-black text-brand-purple">
                          {m.name?.[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <p className="font-black text-gray-900 truncate">
                            {m.name}
                          </p>
                          <p className="text-xs font-bold text-gray-400 truncate">
                            {m.email}
                          </p>
                        </div>
                        <span
                          className={`ml-2 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black border ${getStatusBadge(
                            m.status
                          )}`}
                        >
                          {m.status === "NEW"
                            ? "New"
                            : m.status === "IN_PROGRESS"
                            ? "In Progress"
                            : "Resolved"}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-gray-700 truncate mb-1">
                        {m.subject}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-gray-400 font-bold truncate">
                          {m.message}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {new Date(m.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-6 md:p-8 min-h-[260px]">
          {!selectedMessage ? (
            <div className="flex flex-col items-center justify-center h-full textcenter gap-4">
              <div className="w-16 h-16 rounded-3xl bg-brand-purple/5 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-brand-purple" />
              </div>
              <div>
                <p className="font-black text-gray-900 text-lg">
                  Select a message to preview
                </p>
                <p className="text-sm font-bold text-gray-400 mt-1">
                  Click any message in the inbox to read and update its status.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-1">
                    From
                  </p>
                  <p className="text-lg font-black text-gray-900">
                    {selectedMessage.name}
                  </p>
                  <p className="text-sm font-bold text-gray-500">
                    {selectedMessage.email}
                  </p>
                  <p className="text-[11px] font-bold text-gray-400 mt-1">
                    {formatDate(selectedMessage.created_at)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border ${getStatusBadge(
                      selectedMessage.status
                    )}`}
                  >
                    {selectedMessage.status === "NEW"
                      ? "New"
                      : selectedMessage.status === "IN_PROGRESS"
                      ? "In Progress"
                      : "Resolved"}
                  </span>
                  {selectedMessage.source && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black bg-gray-100 text-gray-500">
                      {selectedMessage.source}
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-1">
                  Subject
                </p>
                <p className="text-base font-black text-gray-900">
                  {selectedMessage.subject}
                </p>
              </div>

              <div className="flex-1 mb-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                  Message
                </p>
                <div className="bg-gray-50/70 rounded-3xl border border-gray-100 p-4 text-sm font-bold text-gray-700 max-h-60 overflow-y-auto custom-scrollbar">
                  {selectedMessage.message}
                </div>
              </div>

              <div className="mt-auto space-y-3">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
                  Update Status
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(selectedMessage.id, "NEW")}
                    disabled={updatingId === selectedMessage.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black border-2 ${
                      selectedMessage.status === "NEW"
                        ? "bg-brand-purple text-white border-brand-purple shadow-md shadow-brand-purple/20"
                        : "border-gray-200 text-gray-600 hover:border-brand-purple/40 hover:bg-brand-purple/5"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Mark as New
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(selectedMessage.id, "IN_PROGRESS")
                    }
                    disabled={updatingId === selectedMessage.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black border-2 ${
                      selectedMessage.status === "IN_PROGRESS"
                        ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200/60"
                        : "border-gray-200 text-gray-600 hover:border-amber-400/60 hover:bg-amber-50"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    In Progress
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(selectedMessage.id, "RESOLVED")
                    }
                    disabled={updatingId === selectedMessage.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black border-2 ${
                      selectedMessage.status === "RESOLVED"
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-200/60"
                        : "border-gray-200 text-gray-600 hover:border-emerald-400/60 hover:bg-emerald-50"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Mark as Resolved
                  </button>
                </div>
                <p className="text-[11px] font-bold text-gray-400 flex items-center gap-1 mt-1">
                  <ArrowRight className="w-3 h-3" />
                  Status changes are saved instantly.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

