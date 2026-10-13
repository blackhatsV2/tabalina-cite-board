"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { TaskComments, TaskComment } from "@/components/TaskComments";
import { AuthBar, UserRole } from "@/components/AuthBar";
import type { User } from "@supabase/supabase-js";

export type Adviser = {
  id: string;
  name: string;
  year_level: string;
  email?: string | null;
  role?: string | null;
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
  const [userRole, setUserRole] = useState<UserRole>("adviser");

  const [advisers, setAdvisers] = useState<Adviser[]>(initialAdvisers);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [comments, setComments] = useState<TaskComment[]>(initialComments);

  const [confirmingTaskId, setConfirmingTaskId] = useState<string | null>(null);
  const [approvingTaskId, setApprovingTaskId] = useState<string | null>(null);
  const [expandedCommentsTaskId, setExpandedCommentsTaskId] = useState<string | null>(null);

  // New task assignment modal/state for OIC
  const [isAssigningTask, setIsAssigningTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAdviserId, setNewTaskAdviserId] = useState<string>(
    initialAdvisers[0]?.id || "",
  );
  const [newTaskDate, setNewTaskDate] = useState("Dec 16, 9:00 AM");
  const [newTaskVenue, setNewTaskVenue] = useState("Room 205");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [assigningLoading, setAssigningLoading] = useState(false);

  // Default to Year 2 / Maam Jo if present, otherwise first adviser
  const [selectedAdviserId, setSelectedAdviserId] = useState<string>(
    initialAdvisers[1]?.id || initialAdvisers[0]?.id || "all",
  );

  const selectedAdviser = advisers.find((a) => a.id === selectedAdviserId);

  const displayedTasks =
    selectedAdviserId === "all"
      ? tasks
      : tasks.filter((task) => task.adviser_id === selectedAdviserId);

  const handleUserChange = (user: User | null, role: UserRole) => {
    setCurrentUser(user);
    setUserRole(role);

    // If an adviser logs in, match their profile automatically
    if (user && role === "adviser") {
      const matched = advisers.find(
        (a) => a.email?.toLowerCase() === user.email?.toLowerCase(),
      );
      if (matched) {
        setSelectedAdviserId(matched.id);
      }
    } else if (role === "dean" || role === "oic") {
      // Admins see all tasks by default
      setSelectedAdviserId("all");
    }
  };

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

  const handleApprove = async (taskId: string, approvalType: "oic" | "dean") => {
    setApprovingTaskId(`${taskId}-${approvalType}`);
    const supabase = createClient();
    const updatePayload =
      approvalType === "oic"
        ? { oic_approval: "approved" }
        : { dean_approval: "approved" };

    try {
      const { error } = await supabase
        .from("tasks")
        .update(updatePayload)
        .eq("id", taskId);

      if (error) {
        alert(`Error approving task: ${error.message}`);
        return;
      }

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updatePayload } : t)),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      alert(`Error: ${message}`);
    } finally {
      setApprovingTaskId(null);
    }
  };

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskAdviserId) return;

    setAssigningLoading(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: newTaskTitle.trim(),
          adviser_id: newTaskAdviserId,
          event_date: newTaskDate.trim(),
          venue: newTaskVenue.trim(),
          description: newTaskDesc.trim(),
          oic_approval: "approved", // Pre-approved by the OIC who assigned it
          dean_approval: "pending",
        })
        .select()
        .single();

      if (error) {
        alert("Failed to assign task: " + error.message);
        return;
      }

      if (data) {
        setTasks((prev) => [data, ...prev]);
        setIsAssigningTask(false);
        setNewTaskTitle("");
        setNewTaskDesc("");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      alert("Error: " + message);
    } finally {
      setAssigningLoading(false);
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
    currentUser?.email === "dean@gmail.com"
      ? "College Dean"
      : currentUser?.email === "oic@gmail.com"
      ? "OIC Coordinator"
      : currentUser?.email?.split("@")[0] ||
        selectedAdviser?.name ||
        "Faculty Adviser";

  return (
    <div className="flex flex-col gap-5">
      {/* Supabase Auth Bar */}
      <AuthBar onUserChange={handleUserChange} />

      {/* Admin Quick Action (OIC / Dean) */}
      {(userRole === "oic" || userRole === "dean") && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-xs">
          <div>
            <h3 className="text-sm font-semibold text-primary">
              Admin Controls ({userRole.toUpperCase()})
            </h3>
            <p className="text-xs text-muted-foreground">
              {userRole === "oic"
                ? "As OIC, you can create and assign tasks to faculty advisers or grant OIC approval."
                : "As College Dean, you can review and grant Dean approvals on pending tasks."}
            </p>
          </div>

          {userRole === "oic" && (
            <Button
              size="sm"
              onClick={() => setIsAssigningTask(!isAssigningTask)}
              className="text-xs"
            >
              {isAssigningTask ? "Close Form" : "➕ Assign New Task"}
            </Button>
          )}
        </div>
      )}

      {/* OIC Task Assignment Form */}
      {isAssigningTask && userRole === "oic" && (
        <Card className="border-primary/40 shadow-md">
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-base font-semibold">
              Assign New CITE Week Task
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <form onSubmit={handleAssignTask} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="task-title" className="text-xs">
                  Task Title
                </Label>
                <Input
                  id="task-title"
                  placeholder="e.g. Lead Registration Desk & ID Badges"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                  className="text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="assign-adviser" className="text-xs">
                    Assign To Adviser
                  </Label>
                  <select
                    id="assign-adviser"
                    value={newTaskAdviserId}
                    onChange={(e) => setNewTaskAdviserId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {advisers.map((adv) => (
                      <option key={adv.id} value={adv.id}>
                        {adv.name} ({adv.year_level})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="task-date" className="text-xs">
                    Date & Time
                  </Label>
                  <Input
                    id="task-date"
                    placeholder="Dec 16, 9:00 AM"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="task-venue" className="text-xs">
                    Venue
                  </Label>
                  <Input
                    id="task-venue"
                    placeholder="Room 205"
                    value={newTaskVenue}
                    onChange={(e) => setNewTaskVenue(e.target.value)}
                    required
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="task-desc" className="text-xs">
                  Instructions / Description
                </Label>
                <Input
                  id="task-desc"
                  placeholder="Specific setup details or coordination instructions..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssigningTask(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={assigningLoading}
                  className="text-xs"
                >
                  {assigningLoading ? "Assigning..." : "Assign Task"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Adviser Filter Switcher */}
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
          {advisers.map((adviser) => {
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
                Log in as OIC or run seed queries to assign tasks.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {displayedTasks.map((task) => {
              const taskComments = comments.filter((c) => c.task_id === task.id);
              const isExpanded = expandedCommentsTaskId === task.id;
              const assignedTo = advisers.find((a) => a.id === task.adviser_id);

              return (
                <Card key={task.id} className="overflow-hidden border-border transition-all shadow-sm">
                  <CardHeader className="bg-muted/30 pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-semibold text-foreground">
                            {task.title}
                          </CardTitle>
                          {assignedTo && (
                            <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                              👤 {assignedTo.name}
                            </span>
                          )}
                        </div>

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

                        {/* Direct Approval Actions for Admins */}
                        {userRole === "oic" && task.oic_approval !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(task.id, "oic")}
                            disabled={approvingTaskId === `${task.id}-oic`}
                            className="h-6 text-[10px] border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-2"
                          >
                            {approvingTaskId === `${task.id}-oic` ? "Approving..." : "Approve as OIC ✓"}
                          </Button>
                        )}

                        {userRole === "dean" && task.dean_approval !== "approved" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(task.id, "dean")}
                            disabled={approvingTaskId === `${task.id}-dean`}
                            className="h-6 text-[10px] border-purple-300 text-purple-700 hover:bg-purple-50 px-2"
                          >
                            {approvingTaskId === `${task.id}-dean` ? "Approving..." : "Approve as Dean ✓"}
                          </Button>
                        )}
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
