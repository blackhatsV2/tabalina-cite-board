"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { TaskComments, TaskComment } from "@/components/TaskComments";
import { AuthBar } from "@/components/AuthBar";
import type { User } from "@supabase/supabase-js";

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

export type { TaskComment };

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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [comments, setComments] = useState<TaskComment[]>(initialComments);
  const [confirmingTaskId, setConfirmingTaskId] = useState<string | null>(null);
  const [expandedCommentsTaskId, setExpandedCommentsTaskId] = useState<string | null>(null);

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

  const effectiveAuthorName =
    currentUser?.email?.split("@")[0] ||
    selectedAdviser?.name ||
    "Faculty Adviser";

  return (
    <div className="flex flex-col gap-5">
      {/* Supabase Auth Bar */}
      <AuthBar onUserChange={(user) => setCurrentUser(user)} />

      {/* Adviser Profile Switcher */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-2.5 flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Filter Tasks By Faculty Adviser
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

                    {/* Modular Comments Component */}
                    {isExpanded && (
                      <TaskComments
                        taskId={task.id}
                        comments={taskComments}
                        authorName={effectiveAuthorName}
                        onCommentAdded={(newComment) =>
                          setComments((prev) => [...prev, newComment])
                        }
                      />
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
