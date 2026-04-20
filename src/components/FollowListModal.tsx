"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FollowerInfo, getFollowers, getFollowing } from "@/actions/follow";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Users, UserCheck, School } from "lucide-react";

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: "FOLLOWERS" | "FOLLOWING";
  targetId: string;
  targetType: "CHILD" | "PARENT" | "SCHOOL";
}

export default function FollowListModal({
  isOpen,
  onClose,
  title,
  type,
  targetId,
  targetType,
}: FollowListModalProps) {
  const [list, setList] = useState<FollowerInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const data =
            type === "FOLLOWERS"
              ? await getFollowers(targetId, targetType)
              : await getFollowing(targetId, targetType);
          setList(data);
        } catch (error) {
          console.error("Failed to fetch follow list:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isOpen, type, targetId, targetType]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md rounded-[32px] border-none p-0 overflow-hidden bg-white shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
          <DialogTitle className="text-2xl font-black font-nunito text-gray-900 flex items-center gap-2">
            {type === "FOLLOWERS" ? (
              <div className="p-2 rounded-xl bg-brand-purple/10">
                <Users className="w-6 h-6 text-brand-purple" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-hot-pink/10">
                <UserCheck className="w-6 h-6 text-hot-pink" />
              </div>
            )}
            {title}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] min-h-[300px]">
          <div className="p-4 space-y-1">
            {loading ? (
              <div className="space-y-4 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-[60%]" />
                      <Skeleton className="h-3 w-[40%]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : list.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-gray-200">
                  <Users className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-1">No {title} Yet</h3>
                <p className="text-gray-500 font-bold text-sm">
                  When people {type === "FOLLOWERS" ? "follow" : "are followed by"} this profile, they'll appear here!
                </p>
              </div>
            ) : (
              list.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={
                    item.type === "CHILD"
                      ? `/child/${item.username}`
                      : item.type === "SCHOOL"
                      ? `/schools/${item.slug}`
                      : "#"
                  }
                  onClick={onClose}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all group border-2 border-transparent hover:border-gray-100 active:scale-[0.98]"
                >
                  <Avatar className="w-12 h-12 border-2 border-white shadow-md group-hover:scale-110 transition-transform">
                    <AvatarImage src={item.avatar || ""} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-brand-purple/20 to-hot-pink/20 text-brand-purple font-black">
                      {item.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-black text-gray-900 truncate group-hover:text-brand-purple transition-colors">
                        {item.name}
                      </p>
                      {item.type === "SCHOOL" && (
                        <div className="p-0.5 rounded-md bg-sky-100">
                          <School className="w-3 h-3 text-sky-600" />
                        </div>
                      )}
                      {item.type === "PARENT" && (
                        <div className="p-0.5 rounded-md bg-grass-green/10">
                          <User className="w-3 h-3 text-grass-green" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-bold text-gray-400">
                      {item.type === "SCHOOL" ? "Official School" : item.type === "PARENT" ? "Verified Parent" : `@${item.username}`}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black text-gray-500 uppercase tracking-wider">
                    View
                  </div>
                </Link>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
