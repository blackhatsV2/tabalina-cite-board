"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export type Adviser = {
  id: string;
  name: string;
  year_level: string;
  created_at: string;
};

export type Task = {
  id: string;
  adviser_id: string | null;
  title: string;
  description: string;
  event_date: string;
  venue: string;
  is_confirmed: boolean;
  confirmed_at: string | null;
  oic_approval: string;
  dean_approval: string;
  created_at: string;
};

export type TaskComment = {
  id: string;
  task_id: string;
  author_name: string;
  content: string;
  created_at: string;
};

interface TaskBoardProps {
  initialAdvisers: Adviser[];
  initialTasks: Task[];
  initialComments: TaskComment[];
}

export function TaskBoard({
  initialAdvisers,
  initialTasks,
  initialComments,
}: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [comments, setComments] = useState<TaskComment[]>(initialComments);
  const [confirmingTaskId, setConfirmingTaskId] = useState<string | null>(null);
  const [expandedCommentsTaskId, setExpandedCommentsTaskId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState<{ [taskId: string]: string }>({});
  const [submittingCommentTaskId, setSubmittingCommentTaskId] = useState<string | null>(null);

  // Default to Year 2 / Maam Jo if present, otherwise first adviser
  const [selectedAdviserId, setSelectedAdviserId] = useState<string>(
    initialAdvisers[1]?.id || initialAdvisers[0]?.id || "all",
  );

  const selectedAdviser = initialAdvisers.find((a) => a.id === selectedAdviserId);

  const displayedTasks =
    selectedAdviserId === "all"
      ? tasks
      : tasks.filter((task) => task.adviser_id === selectedAdviserId);

  const handleConfirm = async (taskId: string) => {
    setConfirmingTaskId(taskId);
    const confirmedTime = new Date().toISOString();

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("tasks")
        .update({
          is_confirmed: true,
          confirmed_at: confirmedTime,
        })
        .eq("id", taskId);

      if (error) {
        alert("Error confirming task: " + error.message);
        return;
      }

      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId
            ? { ...t, is_confirmed: true, confirmed_at: confirmedTime }
            : t,
        ),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      alert("Error: " + message);
    } finally {
      setConfirmingTaskId(null);
    }
  };

  const handleAddComment = async (taskId: string) => {
    const text = newCommentText[taskId]?.trim();
    if (!text) return;

    setSubmittingCommentTaskId(taskId);
    const authorName = selectedAdviser?.name || "Faculty Adviser";

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
        setComments((prev) => [...prev, data]);
        setNewCommentText((prev) => ({ ...prev, [taskId]: "" }));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      alert("Error: " + message);
    } finally {
      setSubmittingCommentTaskId(null);
    }
  };

  const getStatusBadge = (status: string, label: string) => {
    const isApproved = status.toLowerCase() === "approved";
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium border ${
          isApproved
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-amber-200 bg-amber-50 text-amber-700"
        }`}
      >
        <span className="font-semibold">{label}:</span>{" "}
        {isApproved ? "Approved ✓" : "Pending ⏳"}
      </span>
    );
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Adviser Profile Switcher */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-2.5 flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            View Tasks As Faculty Adviser
          </label>
          <span className="text-xs text-muted-foreground">
            {selectedAdviser ? `${selectedAdviser.name} (${selectedAdviser.year_level})` : "All Advisers"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {initialAdvisers.map((adviser) => {
            const isSelected = selectedAdviserId === adviser.id;
            return (
              <button
                key={adviser.id}
                onClick={() => setSelectedAdviserId(adviser.id)}
                type="button"
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                <span>{adviser.name}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected ? "bg-primary-foreground/20 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {adviser.year_level}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => setSelectedAdviserId("all")}
            type="button"
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedAdviserId === "all"
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            Show All
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {selectedAdviser ? `${selectedAdviser.name}'s Tasks` : "All Assigned Tasks"}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({displayedTasks.length})
            </span>
          </h2>
        </div>

        {displayedTasks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-sm font-medium text-foreground">No tasks assigned yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Run the seed queries in Supabase to add tasks.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {displayedTasks.map((task) => {
              const taskComments = comments.filter((c) => c.task_id === task.id);
              const isExpanded = expandedCommentsTaskId === task.id;

              return (
                <Card key={task.id} className="overflow-hidden border-border transition-all shadow-sm">
                  <CardHeader className="bg-muted/30 pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base font-semibold text-foreground">
                          {task.title}
                        </CardTitle>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            📅 {task.event_date}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1 font-medium text-foreground">
                            📍 {task.venue}
                          </span>
                        </div>
                      </div>

                      {/* Confirmation Status Badge */}
                      <div className="flex items-center gap-2">
                        {task.is_confirmed ? (
                          <div className="flex flex-col items-end">
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                              Confirmed ✓
                            </span>
                            {task.confirmed_at && (
                              <span className="text-[10px] text-muted-foreground mt-0.5">
                                at {formatTime(task.confirmed_at)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                            Awaiting Confirmation
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-4 flex flex-col gap-4">
                    {task.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Approval Badges & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(task.oic_approval, "OIC")}
                        {getStatusBadge(task.dean_approval, "Dean")}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setExpandedCommentsTaskId(isExpanded ? null : task.id)
                          }
                          className="text-xs"
                        >
                          💬 Notes ({taskComments.length}) {isExpanded ? "▲" : "▼"}
                        </Button>

                        <Button
                          size="sm"
                          variant={task.is_confirmed ? "outline" : "default"}
                          disabled={task.is_confirmed || confirmingTaskId === task.id}
                          onClick={() => handleConfirm(task.id)}
                        >
                          {confirmingTaskId === task.id
                            ? "Confirming..."
                            : task.is_confirmed
                            ? "Confirmed ✓"
                            : "Confirm Understanding"}
                        </Button>
                      </div>
                    </div>

                    {/* Expandable Comments / Notes Section */}
                    {isExpanded && (
                      <div className="rounded-lg border border-border/80 bg-muted/20 p-3.5 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Clarifications & Comments ({taskComments.length})
                          </h4>
                          <span className="text-[11px] text-muted-foreground">
                            Posting as <strong className="text-foreground">{selectedAdviser?.name || "Adviser"}</strong>
                          </span>
                        </div>

                        {/* Comments List */}
                        {taskComments.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">
                            No notes yet. Add questions, chair requests, or setup notes below.
                          </p>
                        ) : (
                          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                            {taskComments.map((comment) => (
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
                            value={newCommentText[task.id] || ""}
                            onChange={(e) =>
                              setNewCommentText((prev) => ({
                                ...prev,
                                [task.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment(task.id);
                              }
                            }}
                            className="text-xs h-9"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddComment(task.id)}
                            disabled={
                              submittingCommentTaskId === task.id ||
                              !newCommentText[task.id]?.trim()
                            }
                          >
                            {submittingCommentTaskId === task.id ? "Posting..." : "Send"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
