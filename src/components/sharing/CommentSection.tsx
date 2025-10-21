"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc/client";
import {
  MessageSquare,
  Send,
  MoreVertical,
  Trash2,
  Edit as EditIcon,
  Reply,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

interface CommentSectionProps {
  promptId: string;
  currentUserId: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  replies?: Comment[];
}

function CommentItem({
  comment,
  currentUserId,
  onReply,
  onEdit,
  onDelete,
}: {
  comment: Comment;
  currentUserId: string;
  onReply: (parentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(true);

  const handleSaveEdit = () => {
    onEdit(comment.id, editContent);
    setIsEditing(false);
  };

  const isOwner = comment.user.id === currentUserId;

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          {comment.user.name?.[0]?.toUpperCase() ?? comment.user.email?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {comment.user.name ?? comment.user.email ?? "Unknown"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
                {comment.updatedAt > comment.createdAt && (
                  <Badge variant="outline" className="text-xs">
                    edited
                  </Badge>
                )}
              </div>
            </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <EditIcon className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(comment.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onReply(comment.id)}
                className="h-8 px-2"
              >
                <Reply className="mr-1 h-3 w-3" />
                Reply
              </Button>
            </>
          )}
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplies(!showReplies)}
            className="h-7 text-xs"
          >
            {showReplies ? (
              <>
                <ChevronUp className="mr-1 h-3 w-3" />
                Hide {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-3 w-3" />
                Show {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
              </>
            )}
          </Button>
          {showReplies && (
            <div className="space-y-3 border-l-2 border-muted pl-4">
              {comment.replies.map((reply: Comment) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CommentSection({ promptId, currentUserId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // Query
  const { data: commentsData, isLoading } = trpc.comment.getByPromptId.useQuery({
    promptId,
    limit: 50,
  });

  const comments = commentsData?.items ?? [];

  // Mutations
  // @ts-ignore - Type inference issue with tRPC mutations
  const createComment = trpc.comment.create.useMutation({
    onSuccess: () => {
      toast({
        title: "Comment posted",
      });
      setNewComment("");
      setReplyingTo(null);
      void utils.comment.getByPromptId.invalidate({ promptId });
    },
    onError: (error) => {
      toast({
        title: "Failed to post comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // @ts-ignore - Type inference issue with tRPC mutations
  const updateComment = trpc.comment.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Comment updated",
      });
      void utils.comment.getByPromptId.invalidate({ promptId });
    },
    onError: (error) => {
      toast({
        title: "Failed to update comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // @ts-ignore - Type inference issue with tRPC mutations
  const deleteComment = trpc.comment.delete.useMutation({
    onSuccess: () => {
      toast({
        title: "Comment deleted",
      });
      void utils.comment.getByPromptId.invalidate({ promptId });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePostComment = () => {
    if (!newComment.trim()) {
      return;
    }

    createComment.mutate({
      promptId,
      content: newComment,
      parentId: replyingTo ?? undefined,
    });
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
    // Focus would require a ref, keeping it simple for now
  };

  const handleEdit = (commentId: string, content: string) => {
    updateComment.mutate({
      commentId,
      content,
    });
  };

  const handleDelete = (commentId: string) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteComment.mutate({ commentId });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      <div className="space-y-2">
        {replyingTo && (
          <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
            <span className="text-sm text-muted-foreground">
              Replying to a comment
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
            >
              Cancel
            </Button>
          </div>
        )}
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[100px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              handlePostComment();
            }
          }}
        />
        <div className="flex justify-between">
          <p className="text-xs text-muted-foreground">
            Press Cmd/Ctrl + Enter to post
          </p>
          <Button
            onClick={handlePostComment}
            disabled={!newComment.trim() || createComment.isPending}
            size="sm"
          >
            <Send className="mr-2 h-4 w-4" />
            {replyingTo ? "Reply" : "Comment"}
          </Button>
        </div>
      </div>

      <Separator />

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading comments...</div>
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-sm text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment: Comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
