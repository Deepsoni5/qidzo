"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Send, Trash2, Loader2, Sparkles } from "lucide-react";
import { getComments, addComment, deleteComment } from "@/actions/comments";
import { useUser } from "@clerk/nextjs";
import { getCurrentUserRole } from "@/actions/auth";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Comment {
  id: string;
  comment_id: string;
  content: string;
  created_at: string;
  child_id: string | null;
  parent_id: string | null;
  user_type: "CHILD" | "PARENT";
  child?: {
    name: string;
    username: string;
    avatar: string | null;
  };
  parent?: {
    parent_id: string;
    // Parent details might need to be fetched differently if not in the join
  };
}

interface CommentsModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  categoryColor?: string;
  onCommentAdded?: (count: number) => void;
  onCommentDeleted?: (count: number) => void;
}

export default function CommentsModal({ 
    postId, 
    isOpen, 
    onClose, 
    categoryColor = "#8B5CF6",
    onCommentAdded,
    onCommentDeleted 
}: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [pendingComment, setPendingComment] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser(); // For optimistic UI and checks
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isParent, setIsParent] = useState(false);

  useEffect(() => {
    const initRole = async () => {
      const role = await getCurrentUserRole();
      setIsParent(!!role?.isParent && !role?.isChild);
    };
    initRole();
  }, []);

  // Fetch comments when modal opens
  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, postId]);

  // Auto-scroll to top when comments change or submitting
  useEffect(() => {
    // If we just posted (isSubmitting) or comments loaded, scroll to top (because latest is first)
    // Actually, if latest is first, we start at top. ScrollArea handles overflow.
    // We just need to make sure we are at top.
    if ((comments.length > 0 || isSubmitting) && isOpen) {
       // Optional: Force scroll to top if needed, but usually default is top
       // bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [comments.length, isSubmitting, isOpen]);

  const loadComments = async () => {
    setIsLoading(true);
    const data = await getComments(postId);
    setComments(data as unknown as Comment[]);
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (isParent) {
      toast("Parents Mode! 🛡️", {
        description: "Parents cannot comment. Let kids be the creators! 🎨",
        duration: 4000,
        style: {
          background: '#FDF2F8',
          border: '2px solid #EC4899',
          color: '#831843',
          fontSize: '16px',
          fontFamily: 'Nunito, sans-serif',
          fontWeight: 'bold'
        },
        className: "rounded-2xl shadow-xl"
      });
      return;
    }
    if (!newComment.trim()) return;

    const content = newComment;
    setNewComment(""); // Clear immediately for better UX
    setPendingComment(content);
    setIsSubmitting(true);

    const result = await addComment(postId, content);

    if (result.success) {
      // Refresh comments to get the real data with IDs
      await loadComments();
      toast.success("Comment posted! 🌟");
      if (result.commentsCount !== undefined) {
        onCommentAdded?.(result.commentsCount);
      }
    } else {
      toast.error(result.error || "Failed to post comment");
      setNewComment(content); // Restore content on error
    }
    setIsSubmitting(false);
    setPendingComment(null);
  };

  const handleDelete = async (commentId: string) => {
    // Optimistic delete
    const prevComments = [...comments];
    setComments(comments.filter(c => c.comment_id !== commentId));

    const result = await deleteComment(commentId);
    
    if (!result.success) {
      setComments(prevComments); // Revert
      toast.error(result.error || "Failed to delete comment");
    } else {
      toast.success("Comment deleted");
      if (result.commentsCount !== undefined) {
        onCommentDeleted?.(result.commentsCount);
      }
    }
  };

  // Determine current user ID for delete permissions
  // Note: This is a rough client-side check. Server handles security.
  // For exact matching, we'd need the child ID from session context if user is a child.
  // Assuming `user.id` maps to parent clerk_id, or we rely on server for validation.
  // For UI "Delete" button visibility:
  // We can show it if we "think" it's ours, or just let everyone try and fail?
  // Better: The server response or session context should tell us our Child ID.
  // For now, we'll just show delete for everyone and let server enforce? 
  // No, that's bad UX. 
  // Let's assume we can't easily know strictly client-side without a prop or context.
  // But wait, if I am a parent, `user.id` is my clerk ID. 
  // If I am a child, I might not have `user` from Clerk if using custom auth?
  // The prompt implies mixed auth. 
  // Let's leave the delete button visible for now or improve later.

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl rounded-[32px] border-4 p-0 overflow-hidden bg-white shadow-2xl" style={{ borderColor: categoryColor }}>
        
        {/* Header */}
        <DialogHeader className="p-6 pb-2 border-b border-gray-100 bg-gray-50/50">
          <DialogTitle className="flex items-center gap-2 text-2xl font-black text-gray-800 font-nunito">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-hot-pink">
              Comments
            </span>
            <span className="text-2xl">💬</span>
          </DialogTitle>
        </DialogHeader>

        {/* Comments List */}
        <ScrollArea className="h-[50vh] p-4">
          {isLoading ? (
             <div className="space-y-4">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="flex gap-3 animate-pulse items-center">
                   <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
                   <div className="flex-1 space-y-2">
                     <div className="h-4 w-32 bg-gray-200 rounded-full" />
                   </div>
                 </div>
               ))}
             </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl">
                🦗
              </div>
              <div className="space-y-1">
                <p className="text-lg font-black text-gray-700 font-nunito">It's quiet here...</p>
                <p className="text-sm text-gray-500 font-medium">Be the first to say something nice!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
               {/* Pending Skeleton Comment (Latest First) */}
               {isSubmitting && pendingComment && (
                <div className="flex gap-3 animate-pulse opacity-70 items-start">
                   <Avatar className="w-8 h-8 border border-gray-100 shadow-sm shrink-0">
                        <AvatarImage src={user?.imageUrl} />
                        <AvatarFallback className="bg-gray-200 text-gray-400 text-[10px]">...</AvatarFallback>
                   </Avatar>
                   <div className="flex-1 min-w-0 text-sm">
                        <div className="flex flex-col">
                             <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-900 font-nunito text-sm">
                                    {user?.firstName || "Me"}
                                </span>
                                <span className="text-[10px] text-brand-purple font-bold flex items-center gap-1 bg-brand-purple/10 px-1.5 py-0.5 rounded-full">
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    Posting...
                                </span>
                             </div>
                             <p className="text-gray-800 leading-snug mt-0.5">
                                {pendingComment}
                             </p>
                        </div>
                   </div>
                </div>
              )}

              {comments.map((comment) => (
                <div key={comment.id} className="group flex gap-3 animate-in fade-in slide-in-from-top-2 duration-300 items-start">
                  {/* Avatar */}
                  <Avatar className="w-8 h-8 border border-gray-100 shadow-sm shrink-0 transition-transform hover:scale-105 cursor-pointer">
                    <AvatarImage 
                        src={comment.user_type === 'CHILD' 
                            ? (comment.child?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.child?.username}`) 
                            : `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.parent_id || "parent"}`
                        } 
                    />
                    <AvatarFallback className="bg-brand-purple text-white font-bold text-[10px]">
                        {comment.user_type === 'CHILD' ? comment.child?.name?.[0] : 'P'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-sm group/item">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 font-nunito text-sm cursor-pointer hover:text-gray-600 transition-colors">
                            {comment.user_type === 'CHILD' ? comment.child?.name : 'Parent'}
                        </span>
                        {comment.user_type === 'PARENT' && (
                            <span className="px-1 py-0.5 rounded bg-brand-purple/10 text-brand-purple text-[8px] font-black uppercase tracking-wider">
                                Parent
                            </span>
                        )}
                        <span className="text-[10px] text-gray-400 font-medium">
                          {formatDistanceToNow(new Date(comment.created_at))}
                        </span>
                      </div>
                      
                      <div className="flex items-start justify-between gap-2">
                          <p className="text-gray-800 leading-snug mt-0.5 break-words font-medium">
                            {comment.content}
                          </p>
                          
                           {/* Delete Button */}
                           <button 
                             onClick={() => handleDelete(comment.comment_id)}
                             className="opacity-0 group-hover/item:opacity-100 text-gray-300 hover:text-red-500 transition-all cursor-pointer shrink-0"
                             title="Delete"
                           >
                             <Trash2 className="w-3.5 h-3.5" />
                           </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="relative flex gap-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a super cool comment..."
              className="min-h-[50px] max-h-[120px] pr-12 resize-none rounded-2xl border-gray-200 focus:border-brand-purple focus:ring-brand-purple/20 bg-gray-50 focus:bg-white transition-all font-medium placeholder:text-gray-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (isParent) {
                    toast("Parents Mode! 🛡️", {
                      description: "Parents cannot comment. Let kids be the creators! 🎨",
                      duration: 4000,
                      style: {
                        background: '#FDF2F8',
                        border: '2px solid #EC4899',
                        color: '#831843',
                        fontSize: '16px',
                        fontFamily: 'Nunito, sans-serif',
                        fontWeight: 'bold'
                      },
                      className: "rounded-2xl shadow-xl"
                    });
                    return;
                  }
                  handleSubmit();
                }
              }}
              readOnly={isParent}
              title={isParent ? "Parents cannot comment. Let kids be the creators! 🎨" : undefined}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  onClick={handleSubmit} 
                  disabled={!newComment.trim() || isSubmitting || isParent}
                  className="absolute right-2 bottom-2 h-8 w-8 rounded-xl bg-gradient-to-br from-brand-purple to-hot-pink hover:opacity-90 transition-opacity shadow-md disabled:opacity-50 disabled:shadow-none cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Send className="w-4 h-4 text-white ml-0.5" />
                  )}
                </Button>
              </TooltipTrigger>
              {isParent && (
                <TooltipContent side="top" className="text-center font-bold">
                  Parents cannot comment.<br/>Let kids be the creators! 🎨
                </TooltipContent>
              )}
            </Tooltip>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center font-medium flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-yellow-400" />
            Keep it kind and friendly!
            <Sparkles className="w-3 h-3 text-yellow-400" />
          </p>
        </div>

      </DialogContent>
    </Dialog>
  );
}
