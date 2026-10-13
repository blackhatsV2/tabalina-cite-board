"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export type TaskComment = {
  id: string;
  task_id: string;
  author_name: string;
  content: string;
  created_at: string;
};

interface TaskCommentsProps {
  taskId: string;
  comments: TaskComment[];
  authorName: string;
  onCommentAdded: (newComment: TaskComment) => void;
}

export function TaskComments({
  taskId,
  comments,
  authorName,
  onCommentAdded,
}: TaskCommentsProps) {
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text) return;

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("comments")
        .insert({
          task_id: taskId,
          author_name: authorName,
          content: text,
        })
        .select()
        .single();

      if (error) {
        alert("Error posting comment: " + error.message);
        return;
      }

      if (data) {
        onCommentAdded(data);
        setCommentText("");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      alert("Error: " + message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg border border-border/80 bg-muted/20 p-3.5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Clarifications & Comments ({comments.length})
        </h4>
        <span className="text-[11px] text-muted-foreground">
          Posting as <strong className="text-foreground">{authorName}</strong>
        </span>
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No notes yet. Add questions, chair requests, or setup notes below.
        </p>
      ) : (
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-md border border-border bg-card p-2.5 text-xs shadow-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground">
                  {comment.author_name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatTime(comment.created_at)}
                </span>
              </div>
              <p className="text-foreground/90 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Add Comment Input */}
      <div className="flex items-center gap-2 pt-1 border-t border-border/50">
        <Input
          placeholder="e.g. Need 4 extra chairs and an extension cord..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleAddComment();
            }
          }}
          className="text-xs h-9"
        />
        <Button
          size="sm"
          onClick={handleAddComment}
          disabled={submitting || !commentText.trim()}
        >
          {submitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              <span>Sending…</span>
            </>
          ) : (
            "Send"
          )}
        </Button>
      </div>
    </div>
  );
}
