"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  is_demo?: boolean | null;
  created_at: string;
};

export type Task = {
  id: string;
  adviser_id: string | null;
  title: string;
  description: string;
  event_date: string;
  venue: string;
  year_level?: string | null;
  status?: string | null; // 'assigned' | 'accepted' | 'declined' | 'completed'
  decline_reason?: string | null;
  remarks?: string | null;
  is_confirmed: boolean;
  confirmed_at: string | null;
  oic_approval: string;
  dean_approval: string;
  is_demo?: boolean | null;
  created_at: string;
};

export type { TaskComment };

export const YEAR_LEVEL_OPTIONS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "General",
] as const;

export const formatYearLevel = (val?: string | null): string => {
  if (!val) return "General";
  const clean = val.trim();
  if (clean === "Year 1" || clean === "1st Year" || clean === "1st year") return "1st Year";
  if (clean === "Year 2" || clean === "2nd Year" || clean === "2nd year") return "2nd Year";
  if (clean === "Year 3" || clean === "3rd Year" || clean === "3rd year") return "3rd Year";
  if (clean === "Year 4" || clean === "4th Year" || clean === "4th year") return "4th Year";
  if (clean.toLowerCase() === "general") return "General";
  return clean;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("adviser");

  const [advisers, setAdvisers] = useState<Adviser[]>(initialAdvisers);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [comments, setComments] = useState<TaskComment[]>(initialComments);

  // Expanded card tracking
  const [expandedPendingTaskId, setExpandedPendingTaskId] = useState<string | null>(null);
  const [expandedFacultyId, setExpandedFacultyId] = useState<string | null>(null);
  const [expandedFacultyTaskId, setExpandedFacultyTaskId] = useState<string | null>(null);
  const [expandedNewTaskId, setExpandedNewTaskId] = useState<string | null>(null);
  const [expandedAcceptedTaskId, setExpandedAcceptedTaskId] = useState<string | null>(null);
  const [expandedFinishedTaskId, setExpandedFinishedTaskId] = useState<string | null>(null);
  const [expandedOtherTaskId, setExpandedOtherTaskId] = useState<string | null>(null);
  const [expandedCommentsTaskId, setExpandedCommentsTaskId] = useState<string | null>(null);

  // Top "Assign a Task" shortcut form state
  const [showAssignShortcut, setShowAssignShortcut] = useState(false);
  const [shortcutFacultyId, setShortcutFacultyId] = useState(
    initialAdvisers.find((a) => a.role !== "dean" && a.role !== "oic")?.id ||
      initialAdvisers[0]?.id ||
      ""
  );
  const [shortcutYearLevel, setShortcutYearLevel] = useState("1st Year");
  const [shortcutTitle, setShortcutTitle] = useState("");
  const [shortcutDesc, setShortcutDesc] = useState("");
  const [shortcutLocation, setShortcutLocation] = useState("");
  const [shortcutTime, setShortcutTime] = useState("9:00 AM");
  const [shortcutDate, setShortcutDate] = useState("Dec 16, 2026");
  const [shortcutLoading, setShortcutLoading] = useState(false);

  // Editing state for Admin pending task
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editFacultyId, setEditFacultyId] = useState("");
  const [editYearLevel, setEditYearLevel] = useState("1st Year");
  const [editLocation, setEditLocation] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Reassign year level state for Admin Faculty list
  const [reassignYearLevels, setReassignYearLevels] = useState<{ [adviserId: string]: string }>({});

  // Faculty inline "Add another task" form state under a specific faculty
  const [addingTaskFacultyId, setAddingTaskFacultyId] = useState<string | null>(null);
  const [addUnderTitle, setAddUnderTitle] = useState("");
  const [addUnderDesc, setAddUnderDesc] = useState("");
  const [addUnderYearLevel, setAddUnderYearLevel] = useState("1st Year");
  const [addUnderLocation, setAddUnderLocation] = useState("");
  const [addUnderTime, setAddUnderTime] = useState("9:00 AM");
  const [addUnderDate, setAddUnderDate] = useState("Dec 16, 2026");
  const [addUnderLoading, setAddUnderLoading] = useState(false);

  // Faculty response state (Decline & Accept forms)
  const [declineReasonText, setDeclineReasonText] = useState<{ [taskId: string]: string }>({});
  const [showDeclineFormForTask, setShowDeclineFormForTask] = useState<string | null>(null);
  const [acceptCommentText, setAcceptCommentText] = useState<{ [taskId: string]: string }>({});
  const [showAcceptFormForTask, setShowAcceptFormForTask] = useState<string | null>(null);
  const [actionLoadingTaskId, setActionLoadingTaskId] = useState<string | null>(null);

  // Faculty bottom section active tab ("finished" vs "other-faculties")
  const [bottomTab, setBottomTab] = useState<"finished" | "other-faculties">("finished");

  const isAdmin =
    userRole === "dean" ||
    userRole === "oic" ||
    userRole === "admin" ||
    currentUser?.email?.toLowerCase() === "dean@gmail.com" ||
    currentUser?.email?.toLowerCase() === "oic@gmail.com" ||
    currentUser?.email?.toLowerCase() === "dean.admin@cite.edu" ||
    currentUser?.email?.toLowerCase() === "oic.admin@cite.edu";

  // All three demo emails are sandboxed — they see ONLY demo tasks.
  // Real accounts (any other email) see ONLY non-demo tasks.
  const DEMO_EMAILS = new Set(["dean@gmail.com", "oic@gmail.com", "faculty@gmail.com"]);
  const isCurrentUserDemo = DEMO_EMAILS.has(currentUser?.email?.toLowerCase() ?? "");

  const isTaskDemo = (t: Task): boolean => {
    if (t.is_demo === true) return true;
    if (t.is_demo === false) return false;
    const assigned = advisers.find((a) => a.id === t.adviser_id);
    if (assigned) {
      if (assigned.is_demo === true) return true;
      if (DEMO_EMAILS.has(assigned.email?.toLowerCase() ?? "")) return true;
    }
    // Any legacy task with no explicit flag belongs to the demo sandbox
    return true;
  };

  const isAdviserDemo = (a: Adviser): boolean => {
    if (a.is_demo === true) return true;
    if (DEMO_EMAILS.has(a.email?.toLowerCase() ?? "")) return true;
    return false;
  };

  // Identify active faculty member for adviser view
  const activeAdviser =
    (currentUser &&
      advisers.find((a) => a.email?.toLowerCase() === currentUser.email?.toLowerCase())) ||
    (isCurrentUserDemo
      ? advisers.find((a) => a.email?.toLowerCase() === "faculty@gmail.com")
      : advisers.find((a) => a.role !== "dean" && a.role !== "oic" && !isAdviserDemo(a))) ||
    advisers.find((a) => a.role !== "dean" && a.role !== "oic") ||
    advisers[0];

  const assignableAdvisers = advisers.filter((a) => {
    if (a.role === "dean" || a.role === "oic") return false;
    if (a.email?.toLowerCase() === "dean.admin@cite.edu" || a.email?.toLowerCase() === "oic.admin@cite.edu") return false;
    const isDemoAdv = isAdviserDemo(a);
    return isCurrentUserDemo ? isDemoAdv : !isDemoAdv;
  });

  const effectiveAuthorName =
    currentUser?.email === "dean@gmail.com"
      ? "College Dean"
      : currentUser?.email === "oic@gmail.com"
      ? "OIC Coordinator"
      : currentUser?.user_metadata?.full_name ||
        activeAdviser?.name ||
        currentUser?.email?.split("@")[0] ||
        "Faculty Member";

  // Helper: compute clean status
  const getTaskStatus = (task: Task): "assigned" | "accepted" | "declined" | "completed" => {
    if (task.status === "completed" || task.status === "resolved") return "completed";
    if (task.status === "declined") return "declined";
    if (task.status === "accepted" || task.is_confirmed) return "accepted";
    return "assigned";
  };

  const handleUserChange = useCallback((user: User | null, role: UserRole) => {
    setCurrentUser(user);
    setUserRole(role);
  }, []);

  // ==============================================================
  // ADMIN ACTIONS: Top "Assign a Task"
  // ==============================================================
  const handleShortcutAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortcutTitle.trim() || !shortcutFacultyId) return;

    setShortcutLoading(true);
    const eventDateCombined = `${shortcutDate.trim()}${shortcutTime.trim() ? `, ${shortcutTime.trim()}` : ""}`;
    const assignedYearLevel = shortcutYearLevel || "General";

    const supabase = createClient();
    try {
      const isDean = userRole === "dean";
      const insertPayload = {
        title: shortcutTitle.trim(),
        adviser_id: shortcutFacultyId,
        year_level: assignedYearLevel,
        event_date: eventDateCombined,
        venue: shortcutLocation.trim() || "Campus Grounds",
        description: shortcutDesc.trim(),
        status: "assigned",
        oic_approval: isDean ? "approved" : "approved",
        dean_approval: isDean ? "approved" : "pending",
        is_demo: isCurrentUserDemo,
      };

      const { data, error } = await supabase
        .from("tasks")
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        // Fallback without year_level/status if schema columns missing
        const fallbackPayload = {
          title: shortcutTitle.trim(),
          adviser_id: shortcutFacultyId,
          event_date: eventDateCombined,
          venue: shortcutLocation.trim() || "Campus Grounds",
          description: shortcutDesc.trim(),
          oic_approval: isDean ? "approved" : "approved",
          dean_approval: isDean ? "approved" : "pending",
          is_demo: isCurrentUserDemo,
        };
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("tasks")
          .insert(fallbackPayload)
          .select()
          .single();

        if (fallbackError) {
          alert("Failed to assign task: " + fallbackError.message);
          return;
        }
        if (fallbackData) {
          setTasks((prev) => [{ ...fallbackData, year_level: assignedYearLevel, status: "assigned" }, ...prev]);
        }
      } else if (data) {
        setTasks((prev) => [data, ...prev]);
      }

      // Reset form
      setShortcutTitle("");
      setShortcutDesc("");
      setShortcutLocation("");
      setShowAssignShortcut(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected error";
      alert("Error: " + msg);
    } finally {
      setShortcutLoading(false);
    }
  };

  // ==============================================================
  // ADMIN ACTIONS: Edit & Reassign Task
  // ==============================================================
  const startEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
    setEditDesc(task.description || "");
    setEditFacultyId(task.adviser_id || assignableAdvisers[0]?.id || "");
    setEditYearLevel(formatYearLevel(task.year_level));
    setEditLocation(task.venue);
    // Parse event date
    const parts = task.event_date.split(",");
    setEditDate(parts[0]?.trim() || "Dec 16, 2026");
    setEditTime(parts[1]?.trim() || "9:00 AM");
  };

  const handleSaveEditTask = async (taskId: string) => {
    if (!editTitle.trim()) return;
    setEditLoading(true);

    const eventDateCombined = `${editDate.trim()}${editTime.trim() ? `, ${editTime.trim()}` : ""}`;
    const updatePayload = {
      title: editTitle.trim(),
      description: editDesc.trim(),
      adviser_id: editFacultyId,
      year_level: editYearLevel,
      venue: editLocation.trim() || "Campus Grounds",
      event_date: eventDateCombined,
      status: "assigned", // Reset to assigned so faculty receives it freshly
      decline_reason: null,
      is_confirmed: false,
      confirmed_at: null,
    };

    const supabase = createClient();
    try {
      const { error } = await supabase.from("tasks").update(updatePayload).eq("id", taskId);
      if (error) {
        // Fallback for missing columns
        await supabase
          .from("tasks")
          .update({
            title: editTitle.trim(),
            description: editDesc.trim(),
            adviser_id: editFacultyId,
            venue: editLocation.trim() || "Campus Grounds",
            event_date: eventDateCombined,
            is_confirmed: false,
          })
          .eq("id", taskId);
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                ...updatePayload,
              }
            : t
        )
      );
      setEditingTaskId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error saving task";
      alert("Error: " + msg);
    } finally {
      setEditLoading(false);
    }
  };

  // ==============================================================
  // ADMIN ACTIONS: Delete Task
  // ==============================================================
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    const supabase = createClient();
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) {
        alert("Failed to delete task: " + error.message);
        return;
      }
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (expandedPendingTaskId === taskId) setExpandedPendingTaskId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting task";
      alert("Error: " + msg);
    }
  };

  // ==============================================================
  // ADMIN ACTIONS: Delete Adviser Account
  // ==============================================================
  const handleDeleteAdviser = async (adviserId: string, adviserName: string) => {
    if (
      !window.confirm(
        `Remove "${adviserName}" from the system?\n\nThis will unassign all their tasks (tasks will remain but unassigned). This cannot be undone.`
      )
    )
      return;

    const supabase = createClient();
    try {
      // Unassign tasks first so foreign key constraint doesn't block deletion
      await supabase.from("tasks").update({ adviser_id: null }).eq("adviser_id", adviserId);
      const { error } = await supabase.from("advisers").delete().eq("id", adviserId);
      if (error) {
        alert("Failed to remove account: " + error.message);
        return;
      }
      setAdvisers((prev) => prev.filter((a) => a.id !== adviserId));
      setExpandedFacultyId(null);
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : "Unexpected error"));
    }
  };

  // ==============================================================
  // ADMIN ACTIONS: Approve Task
  // ==============================================================
  const handleApprovePendingTask = async (taskId: string) => {
    const isDean = userRole === "dean";
    const isOic = userRole === "oic";
    const updatePayload = isDean
      ? { dean_approval: "approved" }
      : isOic
      ? { oic_approval: "approved" }
      : { oic_approval: "approved", dean_approval: "approved" };

    const supabase = createClient();
    try {
      const { error } = await supabase.from("tasks").update(updatePayload).eq("id", taskId);
      if (error) {
        alert("Failed to approve task: " + error.message);
        return;
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, ...updatePayload } : t))
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error approving task";
      alert("Error: " + msg);
    }
  };

  // ==============================================================
  // ==============================================================
  // ADMIN ACTIONS: Toggle Admin Privileges for Faculty Member
  // ==============================================================
  const handleToggleAdminPrivilege = async (
    facultyId: string,
    currentRole?: string | null
  ) => {
    const newRole = currentRole === "admin" ? "adviser" : "admin";
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("advisers")
        .update({ role: newRole })
        .eq("id", facultyId);

      if (error) {
        alert("Failed to update role privileges: " + error.message);
        return;
      }

      setAdvisers((prev) =>
        prev.map((a) => (a.id === facultyId ? { ...a, role: newRole } : a))
      );

      const target = advisers.find((a) => a.id === facultyId);
      if (
        currentUser &&
        target &&
        currentUser.email?.toLowerCase() === target.email?.toLowerCase()
      ) {
        setUserRole(newRole as UserRole);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating role";
      alert("Error: " + msg);
    }
  };

  // ADMIN ACTIONS: Reassign Year Level for Faculty
  // ==============================================================
  const handleSaveReassignedYearLevel = async (adviserId: string) => {
    const newYear = reassignYearLevels[adviserId];
    if (!newYear) return;

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("advisers")
        .update({ year_level: newYear })
        .eq("id", adviserId);

      if (error) {
        alert("Failed to reassign year level: " + error.message);
        return;
      }

      setAdvisers((prev) =>
        prev.map((a) => (a.id === adviserId ? { ...a, year_level: newYear } : a))
      );
      // Also update year_level for uncompleted tasks of that adviser if needed
      setTasks((prev) =>
        prev.map((t) =>
          t.adviser_id === adviserId && !t.year_level
            ? { ...t, year_level: newYear }
            : t
        )
      );
      alert(`Year level updated to ${newYear} successfully!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating year level";
      alert("Error: " + msg);
    }
  };

  // ==============================================================
  // ADMIN ACTIONS: Add Task under specific faculty member
  // ==============================================================
  const handleAddUnderFaculty = async (facultyId: string) => {
    if (!addUnderTitle.trim()) return;
    setAddUnderLoading(true);

    const eventDateCombined = `${addUnderDate.trim()}${addUnderTime.trim() ? `, ${addUnderTime.trim()}` : ""}`;
    const assignedYearLevel = addUnderYearLevel || "General";

    const supabase = createClient();
    try {
      const isDean = userRole === "dean";
      const insertPayload = {
        title: addUnderTitle.trim(),
        adviser_id: facultyId,
        year_level: assignedYearLevel,
        event_date: eventDateCombined,
        venue: addUnderLocation.trim() || "Campus Grounds",
        description: addUnderDesc.trim(),
        status: "assigned",
        oic_approval: isDean ? "approved" : "approved",
        dean_approval: isDean ? "approved" : "pending",
        is_demo: isCurrentUserDemo,
      };

      const { data, error } = await supabase
        .from("tasks")
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        const fallbackPayload = {
          title: addUnderTitle.trim(),
          adviser_id: facultyId,
          event_date: eventDateCombined,
          venue: addUnderLocation.trim() || "Campus Grounds",
          description: addUnderDesc.trim(),
          oic_approval: isDean ? "approved" : "approved",
          dean_approval: isDean ? "approved" : "pending",
          is_demo: isCurrentUserDemo,
        };
        const { data: fallbackData } = await supabase
          .from("tasks")
          .insert(fallbackPayload)
          .select()
          .single();

        if (fallbackData) {
          setTasks((prev) => [{ ...fallbackData, year_level: assignedYearLevel, status: "assigned" }, ...prev]);
        }
      } else if (data) {
        setTasks((prev) => [data, ...prev]);
      }

      setAddUnderTitle("");
      setAddUnderDesc("");
      setAddUnderLocation("");
      setAddingTaskFacultyId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating task";
      alert("Error: " + msg);
    } finally {
      setAddUnderLoading(false);
    }
  };

  // ==============================================================
  // FACULTY ACTIONS: Decline Task (Reason Required)
  // ==============================================================
  const handleDeclineTask = async (taskId: string) => {
    const reason = (declineReasonText[taskId] || "").trim();
    if (!reason) {
      alert("Please provide a reason for declining this task. It is required.");
      return;
    }

    setActionLoadingTaskId(taskId);
    const supabase = createClient();

    try {
      const updatePayload = {
        status: "declined",
        decline_reason: reason,
        is_confirmed: false,
      };

      const { error } = await supabase
        .from("tasks")
        .update(updatePayload)
        .eq("id", taskId);

      if (error) {
        // Fallback if column missing: store reason in description
        const target = tasks.find((t) => t.id === taskId);
        await supabase
          .from("tasks")
          .update({
            description: `${target?.description || ""} [DECLINED: ${reason}]`,
            is_confirmed: false,
          })
          .eq("id", taskId);
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: "declined", decline_reason: reason, is_confirmed: false }
            : t
        )
      );

      setShowDeclineFormForTask(null);
      setExpandedNewTaskId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error declining task";
      alert("Error: " + msg);
    } finally {
      setActionLoadingTaskId(null);
    }
  };

  // ==============================================================
  // FACULTY ACTIONS: Accept Task (Optional Comments/Notes)
  // ==============================================================
  const handleAcceptTask = async (taskId: string) => {
    setActionLoadingTaskId(taskId);
    const comment = (acceptCommentText[taskId] || "").trim();
    const confirmedTime = new Date().toISOString();

    const supabase = createClient();
    try {
      const updatePayload = {
        status: "accepted",
        is_confirmed: true,
        confirmed_at: confirmedTime,
        decline_reason: null,
      };

      const { error } = await supabase
        .from("tasks")
        .update(updatePayload)
        .eq("id", taskId);

      if (error) {
        await supabase
          .from("tasks")
          .update({
            is_confirmed: true,
            confirmed_at: confirmedTime,
          })
          .eq("id", taskId);
      }

      // If an optional comment was provided, post it to the comments table
      if (comment) {
        const { data: newComment } = await supabase
          .from("comments")
          .insert({
            task_id: taskId,
            author_name: effectiveAuthorName,
            content: comment,
          })
          .select()
          .single();

        if (newComment) {
          setComments((prev) => [...prev, newComment]);
        }
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: "accepted",
                is_confirmed: true,
                confirmed_at: confirmedTime,
                decline_reason: null,
              }
            : t
        )
      );

      setShowAcceptFormForTask(null);
      setExpandedNewTaskId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error accepting task";
      alert("Error: " + msg);
    } finally {
      setActionLoadingTaskId(null);
    }
  };

  // ==============================================================
  // FACULTY ACTIONS: Resolve Task (Move to Finished)
  // ==============================================================
  const handleResolveTask = async (taskId: string) => {
    setActionLoadingTaskId(taskId);
    const supabase = createClient();

    try {
      const updatePayload = {
        status: "completed",
      };

      const { error } = await supabase
        .from("tasks")
        .update(updatePayload)
        .eq("id", taskId);

      if (error) {
        await supabase
          .from("tasks")
          .update({
            description: `${tasks.find((t) => t.id === taskId)?.description || ""} [RESOLVED]`,
          })
          .eq("id", taskId);
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: "completed",
              }
            : t
        )
      );

      setExpandedAcceptedTaskId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error resolving task";
      alert("Error: " + msg);
    } finally {
      setActionLoadingTaskId(null);
    }
  };

  // ==============================================================
  // FACULTY ACTIONS: Update Profile Year Level (Self)
  // ==============================================================
  const [profileUpdating, setProfileUpdating] = useState(false);
  const handleUpdateFacultyProfileYearLevel = async (newYear: string) => {
    if (!activeAdviser?.id) return;
    setProfileUpdating(true);
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("advisers")
        .update({ year_level: newYear })
        .eq("id", activeAdviser.id);

      if (!error) {
        setAdvisers((prev) =>
          prev.map((a) => (a.id === activeAdviser.id ? { ...a, year_level: newYear } : a))
        );
      }
    } catch (err: unknown) {
      console.error("Error updating profile year level:", err);
    } finally {
      setProfileUpdating(false);
    }
  };

  // ==============================================================
  // TASK YEAR LEVEL: Update Task Year Level (Independent of Profile)
  // ==============================================================
  const handleUpdateTaskYearLevel = async (taskId: string, newYear: string) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ year_level: newYear })
        .eq("id", taskId);

      if (!error) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, year_level: newYear } : t))
        );
      }
    } catch (err: unknown) {
      console.error("Error updating task year level:", err);
    }
  };

  // ==============================================================
  // DEMO / REAL DATA SEPARATION
  // ==============================================================
  // Demo accounts (all 3 preset emails) → see only demo tasks.
  // Real accounts (any other email) → see only real (non-demo) tasks.
  const visibleTasks = tasks.filter((t) => {
    const isDemo = isTaskDemo(t);
    return isCurrentUserDemo ? isDemo : !isDemo;
  });

  // ==============================================================
  // DATA FILTERING FOR ADMIN DASHBOARD
  // ==============================================================
  const adminPendingTasks = visibleTasks.filter((t) => {
    const status = getTaskStatus(t);
    if (status === "completed") return false;
    if (status === "assigned" || status === "declined") return true;
    if (status === "accepted" && (t.oic_approval !== "approved" || t.dean_approval !== "approved")) {
      return true;
    }
    return false;
  });

  // ==============================================================
  // DATA FILTERING FOR FACULTY DASHBOARD
  // ==============================================================
  const myOwnTasks = visibleTasks.filter((t) => {
    if (t.adviser_id === activeAdviser?.id) return true;
    if (isCurrentUserDemo) {
      const assignedAdv = advisers.find((a) => a.id === t.adviser_id);
      if (!t.adviser_id || assignedAdv?.email?.toLowerCase() === "faculty@gmail.com") return true;
    }
    return false;
  });

  const facultyNewAssignedTasks = myOwnTasks.filter((t) => getTaskStatus(t) === "assigned");

  const facultyAcceptedTasks = myOwnTasks.filter((t) => {
    const status = getTaskStatus(t);
    const isAdminApproved = t.oic_approval === "approved" || t.dean_approval === "approved";
    return status === "accepted" && isAdminApproved;
  });

  const facultyFinishedTasks = myOwnTasks.filter((t) => getTaskStatus(t) === "completed");

  const otherFacultiesTasks = visibleTasks.filter((t) => t.adviser_id !== activeAdviser?.id);

  return (
    <div className="flex flex-col gap-6">
      {/* Supabase Auth Bar */}
      <AuthBar onUserChange={handleUserChange} />

      {/* ============================================================== */}
      {/* 1. DEAN AND OIC DASHBOARD (ADMIN VIEW)                         */}
      {/* ============================================================== */}
      {isAdmin ? (
        <div className="flex flex-col gap-6">
          {/* Top Bar with "Assign a Task" shortcut button */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground uppercase tracking-wider">
                  Admin Dashboard
                </span>
                <h2 className="text-base font-bold text-primary sm:text-lg">
                  {userRole === "dean" ? "College Dean Oversight" : userRole === "oic" ? "OIC Coordinator Command" : "Admin Command Center"}
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Monitor pending tasks across all year levels, track faculty workloads, and reassign duties.
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setShowAssignShortcut(!showAssignShortcut)}
              className="text-xs font-semibold shadow-xs"
            >
              {showAssignShortcut ? "Close Form" : "+ Assign a Task"}
            </Button>
          </div>

          {/* Top Expandable "Assign a Task" Form */}
          {showAssignShortcut && (
            <Card className="border-primary/40 shadow-md">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-base font-bold text-foreground">
                  Quick Assign Task
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Create a new duty assignment. The faculty member will receive this immediately under their New Assigned tasks.
                </p>
              </CardHeader>
              <CardContent className="pb-5">
                <form onSubmit={handleShortcutAssign} className="flex flex-col gap-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="sc-faculty" className="text-xs font-medium">
                        Select Faculty Member
                      </Label>
                      <select
                        id="sc-faculty"
                        value={shortcutFacultyId}
                        onChange={(e) => setShortcutFacultyId(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {assignableAdvisers.map((adv) => (
                          <option key={adv.id} value={adv.id}>
                            {adv.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <Label htmlFor="sc-year" className="text-xs font-medium">
                        Assigned Year Level
                      </Label>
                      <select
                        id="sc-year"
                        value={shortcutYearLevel}
                        onChange={(e) => setShortcutYearLevel(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {YEAR_LEVEL_OPTIONS.map((yl) => (
                          <option key={yl} value={yl}>
                            {yl}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label htmlFor="sc-title" className="text-xs font-medium">
                      Task Title
                    </Label>
                    <Input
                      id="sc-title"
                      placeholder="e.g. Lead Opening Ceremony Stage Setup & Sound Check"
                      value={shortcutTitle}
                      onChange={(e) => setShortcutTitle(e.target.value)}
                      required
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="sc-loc" className="text-xs font-medium">
                        Location / Venue
                      </Label>
                      <Input
                        id="sc-loc"
                        placeholder="e.g. University Gym"
                        value={shortcutLocation}
                        onChange={(e) => setShortcutLocation(e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="sc-date" className="text-xs font-medium">
                        Date
                      </Label>
                      <Input
                        id="sc-date"
                        placeholder="Dec 16, 2026"
                        value={shortcutDate}
                        onChange={(e) => setShortcutDate(e.target.value)}
                        required
                        className="text-xs h-9"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="sc-time" className="text-xs font-medium">
                        Time
                      </Label>
                      <Input
                        id="sc-time"
                        placeholder="9:00 AM"
                        value={shortcutTime}
                        onChange={(e) => setShortcutTime(e.target.value)}
                        required
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label htmlFor="sc-desc" className="text-xs font-medium">
                      Description / Instructions
                    </Label>
                    <Textarea
                      id="sc-desc"
                      placeholder="Specific responsibilities, checklist items, materials needed..."
                      value={shortcutDesc}
                      onChange={(e) => setShortcutDesc(e.target.value)}
                      className="text-xs min-h-[60px]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAssignShortcut(false)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={shortcutLoading || !shortcutTitle.trim()}
                      className="text-xs"
                    >
                      {shortcutLoading ? "Assigning..." : "Assign Task"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* TWO SECTION SPLIT: Left Section (Pending Tasks) & Right Section (Faculties List) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ============================================================== */}
            {/* ADMIN LEFT SECTION: All Pending Tasks (Titles Only, Expandable) */}
            {/* ============================================================== */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-foreground">Pending Tasks</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                    {adminPendingTasks.length}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">Click task to expand actions</span>
              </div>

              {adminPendingTasks.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-xs text-muted-foreground">
                    No pending tasks! All duties have either been completed or approved.
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {adminPendingTasks.map((task) => {
                    const assignedFaculty = advisers.find((a) => a.id === task.adviser_id);
                    const facultyName = assignedFaculty?.name || "Unassigned";
                    const yearLevel = formatYearLevel(task.year_level || assignedFaculty?.year_level);
                    const isExpanded = expandedPendingTaskId === task.id;
                    const status = getTaskStatus(task);
                    const isEditing = editingTaskId === task.id;
                    const taskComments = comments.filter((c) => c.task_id === task.id);

                    return (
                      <Card
                        key={task.id}
                        className={`transition-all border-border shadow-xs ${
                          isExpanded ? "ring-1 ring-primary/40 bg-card" : "hover:border-primary/30"
                        }`}
                      >
                        {/* Title Row: (Faculty name, year level, task title) */}
                        <div
                          onClick={() => {
                            setExpandedPendingTaskId(isExpanded ? null : task.id);
                            if (isEditing) setEditingTaskId(null);
                          }}
                          className="flex cursor-pointer items-center justify-between p-3.5 hover:bg-muted/40 rounded-lg transition-colors"
                        >
                          <div className="flex flex-col gap-1 pr-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-primary">
                                {facultyName}
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 px-1.5 py-0.5 text-[10px] font-semibold">
                                {yearLevel}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-foreground">
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {status === "declined" ? (
                              <span className="rounded-full bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                                Declined
                              </span>
                            ) : status === "accepted" ? (
                              <span className="rounded-full bg-blue-100 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                                Needs Admin Approval
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                Pending Faculty Review
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {isExpanded ? "Hide" : "Details"}
                            </span>
                          </div>
                        </div>

                        {/* Expanded Actions & Details */}
                        {isExpanded && (
                          <div className="border-t border-border p-4 bg-muted/10 flex flex-col gap-3.5">
                            {/* Declined Notice with Reason */}
                            {status === "declined" && (
                              <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900">
                                <div className="font-bold flex items-center gap-1 mb-1">
                                  Declined by {facultyName}
                                </div>
                                <p className="italic">
                                  <strong>Reason:</strong> {task.decline_reason || "No reason specified."}
                                </p>
                                <p className="mt-1 text-[11px] text-rose-700">
                                  Click &ldquo;Edit Task&rdquo; below to update the venue, schedule, or reassign to another faculty.
                                </p>
                              </div>
                            )}

                            {/* Pending Faculty Notice */}
                            {status === "assigned" && (
                              <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
                                <strong>Status:</strong> Waiting for {facultyName} to review and accept/decline.
                              </div>
                            )}

                            {/* Accepted by Faculty, Awaiting Admin Approval */}
                            {status === "accepted" && (
                              <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5 text-xs text-blue-900 flex items-center justify-between flex-wrap gap-2">
                                <div>
                                  <strong>Accepted by Faculty:</strong> Awaiting your administrative approval.
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleApprovePendingTask(task.id)}
                                  className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  Approve as {userRole === "dean" ? "Dean" : userRole === "oic" ? "OIC" : "Admin"}
                                </Button>
                              </div>
                            )}

                            {/* Task Metadata */}
                            {!isEditing ? (
                              <div className="flex flex-col gap-2">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">Date:</span>{" "}
                                    <span className="font-semibold text-foreground">{task.event_date}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Venue:</span>{" "}
                                    <span className="font-semibold text-foreground">{task.venue}</span>
                                  </div>
                                </div>

                                {task.description && (
                                  <div className="rounded bg-background p-2.5 text-xs text-foreground border border-border">
                                    <span className="font-semibold text-muted-foreground block mb-0.5">Instructions:</span>
                                    {task.description}
                                  </div>
                                )}

                                {/* Action Buttons: Edit, Delete */}
                                <div className="flex items-center justify-between pt-2 border-t border-border flex-wrap gap-2">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => startEditTask(task)}
                                      className="text-xs h-8"
                                    >
                                      Edit Task
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteTask(task.id)}
                                      className="text-xs h-8 font-semibold text-rose-700 bg-rose-50 border border-rose-300 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                                    >
                                      Delete Task
                                    </Button>
                                  </div>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      setExpandedCommentsTaskId(
                                        expandedCommentsTaskId === task.id ? null : task.id
                                      )
                                    }
                                    className="text-xs h-8 font-semibold"
                                  >
                                    Notes ({taskComments.length})
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              /* Inline Edit Form */
                              <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-background p-3.5 shadow-xs">
                                <div className="font-bold text-xs text-primary">
                                  Edit & Reassign Task
                                </div>

                                <div className="flex flex-col gap-1">
                                  <Label className="text-[11px]">Task Title</Label>
                                  <Input
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="text-xs h-8"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex flex-col gap-1">
                                    <Label className="text-[11px]">Reassign Faculty</Label>
                                    <select
                                      value={editFacultyId}
                                      onChange={(e) => setEditFacultyId(e.target.value)}
                                      className="h-8 rounded border border-input bg-background px-2 text-xs"
                                    >
                                      {assignableAdvisers.map((adv) => (
                                        <option key={adv.id} value={adv.id}>
                                          {adv.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <Label className="text-[11px]">Year Level</Label>
                                    <select
                                      value={editYearLevel}
                                      onChange={(e) => setEditYearLevel(e.target.value)}
                                      className="h-8 rounded border border-input bg-background px-2 text-xs"
                                    >
                                      {YEAR_LEVEL_OPTIONS.map((yl) => (
                                        <option key={yl} value={yl}>
                                          {yl}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                  <div className="flex flex-col gap-1">
                                    <Label className="text-[11px]">Venue</Label>
                                    <Input
                                      value={editLocation}
                                      onChange={(e) => setEditLocation(e.target.value)}
                                      className="text-xs h-8"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <Label className="text-[11px]">Date</Label>
                                    <Input
                                      value={editDate}
                                      onChange={(e) => setEditDate(e.target.value)}
                                      className="text-xs h-8"
                                    />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <Label className="text-[11px]">Time</Label>
                                    <Input
                                      value={editTime}
                                      onChange={(e) => setEditTime(e.target.value)}
                                      className="text-xs h-8"
                                    />
                                  </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <Label className="text-[11px]">Instructions / Description</Label>
                                  <Textarea
                                    value={editDesc}
                                    onChange={(e) => setEditDesc(e.target.value)}
                                    className="text-xs min-h-[50px]"
                                  />
                                </div>

                                <div className="flex justify-end gap-2 pt-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingTaskId(null)}
                                    className="text-xs h-8"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    disabled={editLoading || !editTitle.trim()}
                                    onClick={() => handleSaveEditTask(task.id)}
                                    className="text-xs h-8"
                                  >
                                    {editLoading ? "Updating..." : "Update & Pass to Faculty"}
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Modular Comments Drawer */}
                            {expandedCommentsTaskId === task.id && (
                              <TaskComments
                                taskId={task.id}
                                comments={taskComments}
                                authorName={effectiveAuthorName}
                                onCommentAdded={(newComment) =>
                                  setComments((prev) => [...prev, newComment])
                                }
                              />
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ============================================================== */}
            {/* ADMIN RIGHT SECTION: Faculties as Lists (Expandable)          */}
            {/* ============================================================== */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-foreground">Faculty Directory</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                    {assignableAdvisers.length}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">Click faculty to expand actions</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {assignableAdvisers.map((faculty) => {
                  const isExpanded = expandedFacultyId === faculty.id;
                  const facultyTasks = visibleTasks.filter((t) => t.adviser_id === faculty.id);
                  const isAddingTask = addingTaskFacultyId === faculty.id;

                  return (
                    <Card
                      key={faculty.id}
                      className={`transition-all border-border shadow-xs ${
                        isExpanded ? "ring-1 ring-primary/40 bg-card" : "hover:border-primary/30"
                      }`}
                    >
                      {/* Faculty Row: Name, Year Level, Task Count */}
                      <div
                        onClick={() => {
                          setExpandedFacultyId(isExpanded ? null : faculty.id);
                          if (!reassignYearLevels[faculty.id]) {
                            setReassignYearLevels((prev) => ({
                              ...prev,
                              [faculty.id]: faculty.year_level,
                            }));
                          }
                        }}
                        className="flex cursor-pointer items-center justify-between p-3.5 hover:bg-muted/40 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-bold text-primary text-xs">
                            {faculty.name.charAt(0) || "F"}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">
                                {faculty.name}
                              </span>
                              {faculty.role === "admin" && (
                                <span className="rounded bg-indigo-100 text-indigo-800 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                                  Admin
                                </span>
                              )}
                              <span className="rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 px-2 py-0.5 text-[10px] font-semibold">
                                {formatYearLevel(faculty.year_level)}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {facultyTasks.length === 0
                                ? "0 tasks assigned"
                                : `${facultyTasks.length} task${facultyTasks.length === 1 ? "" : "s"} assigned`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                              facultyTasks.length > 0
                                ? "bg-primary/15 text-primary"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {facultyTasks.length}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {isExpanded ? "Hide" : "Details"}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Faculty Actions */}
                      {isExpanded && (
                        <div className="border-t border-border p-4 bg-muted/10 flex flex-col gap-4">
                          {/* 1. Admin Privileges Management */}
                          <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div>
                                <Label className="text-xs font-semibold text-foreground block mb-0.5">
                                  Role & Permissions
                                </Label>
                                <p className="text-[11px] text-muted-foreground">
                                  {faculty.role === "admin"
                                    ? "Has Admin access (task approvals, assignments, management)."
                                    : "Standard Faculty Adviser access."}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleAdminPrivilege(faculty.id, faculty.role)}
                                  className={`text-xs h-8 ${
                                    faculty.role === "admin"
                                      ? "text-amber-700 border-amber-300 hover:bg-amber-50"
                                      : "text-indigo-700 border-indigo-300 hover:bg-indigo-50 font-semibold"
                                  }`}
                                >
                                  {faculty.role === "admin" ? "Revoke Admin" : "Grant Admin"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDeleteAdviser(faculty.id, faculty.name)}
                                  className="text-xs h-8 font-semibold text-rose-700 bg-rose-50 border border-rose-300 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                                >
                                  Remove Account
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* 2. Reassign Year Level */}
                          <div className="rounded-lg border border-border bg-card p-3 shadow-xs">
                            <Label className="text-xs font-semibold text-foreground block mb-1.5">
                              Assign Faculty Year Level
                            </Label>
                            <div className="flex items-center gap-2">
                              <select
                                value={formatYearLevel(reassignYearLevels[faculty.id] || faculty.year_level)}
                                onChange={(e) =>
                                  setReassignYearLevels((prev) => ({
                                    ...prev,
                                    [faculty.id]: e.target.value,
                                  }))
                                }
                                className="flex h-8 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring flex-1 font-medium cursor-pointer"
                              >
                                {YEAR_LEVEL_OPTIONS.map((yl) => (
                                  <option key={yl} value={yl}>
                                    {yl}
                                  </option>
                                ))}
                              </select>
                              <Button
                                size="sm"
                                onClick={() => handleSaveReassignedYearLevel(faculty.id)}
                                className="text-xs h-8 font-semibold"
                              >
                                Save Year Level
                              </Button>
                            </div>
                          </div>

                          {/* 2. List of Tasks Assigned under this Faculty (Expandable) */}
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Assigned Tasks ({facultyTasks.length})
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setAddingTaskFacultyId(isAddingTask ? null : faculty.id);
                                  setAddUnderYearLevel(formatYearLevel(faculty.year_level));
                                }}
                                className="text-xs h-7 font-semibold"
                              >
                                {isAddingTask ? "Close" : "+ Add Another Task"}
                              </Button>
                            </div>

                            {/* Inline "Add Another Task" Form for this faculty */}
                            {isAddingTask && (
                              <div className="rounded-lg border border-primary/30 bg-card p-3 shadow-xs flex flex-col gap-2.5">
                                <span className="text-xs font-bold text-primary">
                                  Add Task for {faculty.name}
                                </span>
                                <Input
                                  placeholder="Task Title..."
                                  value={addUnderTitle}
                                  onChange={(e) => setAddUnderTitle(e.target.value)}
                                  className="text-xs h-8"
                                />
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                  <Input
                                    placeholder="Venue (Room 205)"
                                    value={addUnderLocation}
                                    onChange={(e) => setAddUnderLocation(e.target.value)}
                                    className="text-xs h-8"
                                  />
                                  <Input
                                    placeholder="Date"
                                    value={addUnderDate}
                                    onChange={(e) => setAddUnderDate(e.target.value)}
                                    className="text-xs h-8"
                                  />
                                  <Input
                                    placeholder="Time"
                                    value={addUnderTime}
                                    onChange={(e) => setAddUnderTime(e.target.value)}
                                    className="text-xs h-8"
                                  />
                                  <select
                                    value={addUnderYearLevel}
                                    onChange={(e) => setAddUnderYearLevel(e.target.value)}
                                    className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium cursor-pointer"
                                  >
                                    {YEAR_LEVEL_OPTIONS.map((yl) => (
                                      <option key={yl} value={yl}>
                                        {yl}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <Textarea
                                  placeholder="Description..."
                                  value={addUnderDesc}
                                  onChange={(e) => setAddUnderDesc(e.target.value)}
                                  className="text-xs min-h-[45px]"
                                />
                                <div className="flex justify-end gap-2 pt-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setAddingTaskFacultyId(null)}
                                    className="text-xs h-7"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    disabled={addUnderLoading || !addUnderTitle.trim()}
                                    onClick={() => handleAddUnderFaculty(faculty.id)}
                                    className="text-xs h-7"
                                  >
                                    {addUnderLoading ? "Adding..." : "Add Task"}
                                  </Button>
                                </div>
                              </div>
                            )}

                            {facultyTasks.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic p-2 bg-background rounded border">
                                No tasks assigned to {faculty.name} yet.
                              </p>
                            ) : (
                              <div className="flex flex-col gap-2">
                                {facultyTasks.map((t) => {
                                  const tStatus = getTaskStatus(t);
                                  const isTExpanded = expandedFacultyTaskId === t.id;

                                  return (
                                    <div
                                      key={t.id}
                                      className="rounded-lg border border-border bg-card p-2.5 text-xs shadow-xs"
                                    >
                                      <div
                                        onClick={() =>
                                          setExpandedFacultyTaskId(isTExpanded ? null : t.id)
                                        }
                                        className="flex cursor-pointer items-center justify-between"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-foreground">
                                            {t.title}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                              tStatus === "completed"
                                                ? "bg-emerald-100 text-emerald-800"
                                                : tStatus === "declined"
                                                ? "bg-rose-100 text-rose-800"
                                                : tStatus === "accepted"
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-amber-100 text-amber-800"
                                            }`}
                                          >
                                            {tStatus === "completed"
                                              ? "Completed"
                                              : tStatus === "declined"
                                              ? "Declined"
                                              : tStatus === "accepted"
                                              ? "Accepted"
                                              : "Pending"}
                                          </span>
                                          <span className="text-[10px] text-muted-foreground">
                                            {isTExpanded ? "Hide" : "Details"}
                                          </span>
                                        </div>
                                      </div>

                                      {isTExpanded && (
                                        <div className="mt-2.5 border-t border-border pt-2 flex flex-col gap-1.5 text-muted-foreground">
                                          <div>
                                            <strong>Schedule:</strong> {t.event_date} • {t.venue}
                                          </div>
                                          {t.description && (
                                            <div>
                                              <strong>Description:</strong> {t.description}
                                            </div>
                                          )}
                                          {tStatus === "declined" && t.decline_reason && (
                                            <div className="text-rose-700 italic">
                                              <strong>Decline Reason:</strong> {t.decline_reason}
                                            </div>
                                          )}
                                          <div className="flex justify-end pt-1">
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleDeleteTask(t.id)}
                                              className="text-[11px] h-6 px-2 text-rose-600 hover:bg-rose-50 border-rose-200"
                                            >
                                              Delete Task
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* 2. FACULTY DASHBOARD (ADVISER VIEW)                            */
        /* ============================================================== */
        <div className="flex flex-col gap-6">
          {/* Faculty Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold text-sm">
                {activeAdviser?.name?.charAt(0) || "F"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-foreground sm:text-lg">
                    {activeAdviser?.name || "Faculty Adviser"}
                  </h2>
                  <span className="rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 px-2.5 py-0.5 text-xs font-semibold">
                    {formatYearLevel(activeAdviser?.year_level)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Faculty Adviser — Task Designation Management
                </p>
              </div>
            </div>

            {/* Profile Year Level Selection (Faculty can change in their profile) */}
            <div className="flex items-center gap-2 rounded-xl border border-blue-200/80 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800 p-2 shadow-2xs">
              <Label className="text-xs font-semibold text-blue-950 dark:text-blue-100 whitespace-nowrap">
                My Year Level:
              </Label>
              <select
                value={formatYearLevel(activeAdviser?.year_level)}
                onChange={(e) => handleUpdateFacultyProfileYearLevel(e.target.value)}
                disabled={profileUpdating}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs font-semibold text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
              >
                {YEAR_LEVEL_OPTIONS.map((yl) => (
                  <option key={yl} value={yl}>
                    {yl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TWO SECTION SPLIT: Left Section (New Assigned Tasks) & Right Section (Accepted Tasks) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ============================================================== */}
            {/* FACULTY LEFT SECTION: New Assigned Tasks                       */}
            {/* ============================================================== */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-foreground">New Assigned Tasks</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                    {facultyNewAssignedTasks.length}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">Action required</span>
              </div>

              {facultyNewAssignedTasks.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-xs text-muted-foreground">
                    No new tasks awaiting action. All assigned tasks have been accepted or resolved.
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {facultyNewAssignedTasks.map((task) => {
                    const isExpanded = expandedNewTaskId === task.id;
                    const isDeclining = showDeclineFormForTask === task.id;
                    const isAccepting = showAcceptFormForTask === task.id;
                    const taskComments = comments.filter((c) => c.task_id === task.id);

                    return (
                      <Card
                        key={task.id}
                        className={`transition-all border-border shadow-xs ${
                          isExpanded ? "ring-1 ring-primary/40 bg-card" : "hover:border-primary/30"
                        }`}
                      >
                        {/* Title Row */}
                        <div
                          onClick={() => setExpandedNewTaskId(isExpanded ? null : task.id)}
                          className="flex cursor-pointer items-center justify-between p-3.5 hover:bg-muted/40 rounded-lg transition-colors"
                        >
                          <div className="flex flex-col gap-1 pr-2">
                            <span className="text-sm font-semibold text-foreground">
                              {task.title}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>Date: {task.event_date}</span>
                              <span>•</span>
                              <span>Venue: {task.venue}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              Review Needed
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {isExpanded ? "Hide" : "Details"}
                            </span>
                          </div>
                        </div>

                        {/* Expanded Actions */}
                        {isExpanded && (
                          <div className="border-t border-border p-4 bg-muted/10 flex flex-col gap-3.5">
                            {task.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed bg-background p-2.5 rounded border border-border">
                                <strong>Instructions:</strong> {task.description}
                              </p>
                            )}

                            {/* Task Year Level Selector (Separate from Profile) */}
                            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg border border-border bg-background">
                              <div className="flex items-center gap-2">
                                <Label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                                  Task Year Level:
                                </Label>
                                <select
                                  value={formatYearLevel(task.year_level)}
                                  onChange={(e) => handleUpdateTaskYearLevel(task.id, e.target.value)}
                                  className="h-7 rounded border border-input bg-background px-2 text-xs font-semibold text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                  {YEAR_LEVEL_OPTIONS.map((yl) => (
                                    <option key={yl} value={yl}>
                                      {yl}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <span className="text-[11px] text-muted-foreground italic">
                                Task year level updates separately from your profile
                              </span>
                            </div>

                            {/* Action Buttons: Decline Tasks & Accept Tasks */}
                            {!isDeclining && !isAccepting && (
                              <div className="flex items-center justify-between pt-1 border-t border-border flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setShowDeclineFormForTask(task.id);
                                      setShowAcceptFormForTask(null);
                                    }}
                                    className="text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                                  >
                                    Decline Task
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setShowAcceptFormForTask(task.id);
                                      setShowDeclineFormForTask(null);
                                    }}
                                    className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                                  >
                                    Accept Task
                                  </Button>
                                </div>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setExpandedCommentsTaskId(
                                      expandedCommentsTaskId === task.id ? null : task.id
                                    )
                                  }
                                  className="text-xs font-semibold"
                                >
                                  Notes ({taskComments.length})
                                </Button>
                              </div>
                            )}

                            {/* DECLINE FORM: Reason Required */}
                            {isDeclining && (
                              <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 flex flex-col gap-2.5 text-xs">
                                <div className="font-bold text-rose-900">
                                  Decline Task — Reason Required
                                </div>
                                <p className="text-[11px] text-rose-700">
                                  Please explain why you cannot coordinate this task so the Dean or OIC can adjust schedules.
                                </p>
                                <Textarea
                                  placeholder="e.g. Conflict with final examination schedule in Laboratory 2..."
                                  value={declineReasonText[task.id] || ""}
                                  onChange={(e) =>
                                    setDeclineReasonText((prev) => ({
                                      ...prev,
                                      [task.id]: e.target.value,
                                    }))
                                  }
                                  className="text-xs min-h-[60px] bg-background text-foreground"
                                  required
                                />
                                <div className="flex justify-end gap-2 pt-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowDeclineFormForTask(null)}
                                    className="text-xs h-7"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    disabled={
                                      actionLoadingTaskId === task.id ||
                                      !(declineReasonText[task.id] || "").trim()
                                    }
                                    onClick={() => handleDeclineTask(task.id)}
                                    className="text-xs h-7 bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50"
                                  >
                                    {actionLoadingTaskId === task.id
                                      ? "Declining..."
                                      : !(declineReasonText[task.id] || "").trim()
                                      ? "Enter reason to decline"
                                      : "Confirm Decline"}
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* ACCEPT FORM: Comments Optional */}
                            {isAccepting && (
                              <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 flex flex-col gap-2.5 text-xs">
                                <div className="font-bold text-emerald-900">
                                  Accept Task
                                </div>
                                <p className="text-[11px] text-emerald-700">
                                  Confirm your acceptance. You can optionally add notes, questions, or equipment requests for the OIC.
                                </p>
                                <Textarea
                                  placeholder="Optional remarks (e.g. Requesting 3 microphones and whiteboard markers)..."
                                  value={acceptCommentText[task.id] || ""}
                                  onChange={(e) =>
                                    setAcceptCommentText((prev) => ({
                                      ...prev,
                                      [task.id]: e.target.value,
                                    }))
                                  }
                                  className="text-xs min-h-[50px] bg-background text-foreground"
                                />
                                <div className="flex justify-end gap-2 pt-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowAcceptFormForTask(null)}
                                    className="text-xs h-7"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    disabled={actionLoadingTaskId === task.id}
                                    onClick={() => handleAcceptTask(task.id)}
                                    className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  >
                                    {actionLoadingTaskId === task.id
                                      ? "Accepting..."
                                      : "Confirm Acceptance"}
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Modular Comments Drawer */}
                            {expandedCommentsTaskId === task.id && (
                              <TaskComments
                                taskId={task.id}
                                comments={taskComments}
                                authorName={effectiveAuthorName}
                                onCommentAdded={(newComment) =>
                                  setComments((prev) => [...prev, newComment])
                                }
                              />
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ============================================================== */}
            {/* FACULTY RIGHT SECTION: Accepted Tasks (In Progress)           */}
            {/* ============================================================== */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-foreground">Accepted Tasks</span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                    {facultyAcceptedTasks.length}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">In progress • Click to resolve</span>
              </div>

              {facultyAcceptedTasks.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-xs text-muted-foreground">
                    No active accepted tasks. Accept new assignments on the left to start tracking them here.
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {facultyAcceptedTasks.map((task) => {
                    const isExpanded = expandedAcceptedTaskId === task.id;
                    const taskComments = comments.filter((c) => c.task_id === task.id);
                    const yearLevel = formatYearLevel(task.year_level || activeAdviser?.year_level);

                    return (
                      <Card
                        key={task.id}
                        className={`transition-all border-border shadow-xs ${
                          isExpanded ? "ring-1 ring-primary/40 bg-card" : "hover:border-primary/30"
                        }`}
                      >
                        {/* List Row: Title, Year Level, Date */}
                        <div
                          onClick={() => setExpandedAcceptedTaskId(isExpanded ? null : task.id)}
                          className="flex cursor-pointer items-center justify-between p-3.5 hover:bg-muted/40 rounded-lg transition-colors"
                        >
                          <div className="flex flex-col gap-1 pr-2">
                            <span className="text-sm font-semibold text-foreground">
                              {task.title}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 px-1.5 py-0.5 text-[10px] font-semibold">
                                {yearLevel}
                              </span>
                              <span>•</span>
                              <span>Date: {task.event_date}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              Active
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {isExpanded ? "Hide" : "Details"}
                            </span>
                          </div>
                        </div>

                        {/* Expanded Details & Resolve Action */}
                        {isExpanded && (
                          <div className="border-t border-border p-4 bg-muted/10 flex flex-col gap-3.5">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Venue:</span>{" "}
                                <span className="font-semibold text-foreground">{task.venue}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Schedule:</span>{" "}
                                <span className="font-semibold text-foreground">{task.event_date}</span>
                              </div>
                            </div>

                            {task.description && (
                              <p className="text-xs text-muted-foreground bg-background p-2.5 rounded border border-border">
                                <strong>Instructions:</strong> {task.description}
                              </p>
                            )}

                            {/* Task Year Level Selector (Separate from Profile) */}
                            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg border border-border bg-background">
                              <div className="flex items-center gap-2">
                                <Label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                                  Task Year Level:
                                </Label>
                                <select
                                  value={formatYearLevel(task.year_level)}
                                  onChange={(e) => handleUpdateTaskYearLevel(task.id, e.target.value)}
                                  className="h-7 rounded border border-input bg-background px-2 text-xs font-semibold text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                  {YEAR_LEVEL_OPTIONS.map((yl) => (
                                    <option key={yl} value={yl}>
                                      {yl}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <span className="text-[11px] text-muted-foreground italic">
                                Task year level updates separately from your profile
                              </span>
                            </div>

                            {/* Remarks & Resolve Action */}
                            <div className="flex items-center justify-between pt-2 border-t border-border flex-wrap gap-2">
                              <Button
                                size="sm"
                                disabled={actionLoadingTaskId === task.id}
                                onClick={() => handleResolveTask(task.id)}
                                className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                              >
                                {actionLoadingTaskId === task.id
                                  ? "Resolving..."
                                  : "Mark as Resolved"}
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setExpandedCommentsTaskId(
                                    expandedCommentsTaskId === task.id ? null : task.id
                                  )
                                }
                                className="text-xs"
                              >
                                Remarks & Notes ({taskComments.length})
                              </Button>
                            </div>

                            {/* Remarks / Comments Drawer */}
                            {expandedCommentsTaskId === task.id && (
                              <TaskComments
                                taskId={task.id}
                                comments={taskComments}
                                authorName={effectiveAuthorName}
                                onCommentAdded={(newComment) =>
                                  setComments((prev) => [...prev, newComment])
                                }
                              />
                            )}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* FACULTY BOTTOM SECTION: Finished Tasks & Tasks from Other Faculties */}
          {/* ============================================================== */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs flex flex-col gap-4">
            <div className="flex border-b border-border pb-2 gap-4">
              <button
                type="button"
                onClick={() => setBottomTab("finished")}
                className={`flex items-center gap-2 pb-2 text-sm font-semibold transition-colors border-b-2 ${
                  bottomTab === "finished"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Finished Tasks</span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.2">
                  {facultyFinishedTasks.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setBottomTab("other-faculties")}
                className={`flex items-center gap-2 pb-2 text-sm font-semibold transition-colors border-b-2 ${
                  bottomTab === "other-faculties"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>Tasks from Other Faculty</span>
                <span className="rounded-full bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.2">
                  {otherFacultiesTasks.length}
                </span>
              </button>
            </div>

            {/* TAB 1: Finished Tasks */}
            {bottomTab === "finished" && (
              <div>
                {facultyFinishedTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic p-4 text-center">
                    No resolved tasks yet. When you complete an accepted task and click &ldquo;Resolve Task&rdquo;, it moves here.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {facultyFinishedTasks.map((task) => {
                      const isExpanded = expandedFinishedTaskId === task.id;
                      const taskComments = comments.filter((c) => c.task_id === task.id);

                      return (
                        <Card key={task.id} className="border-border shadow-xs">
                          <div
                            onClick={() =>
                              setExpandedFinishedTaskId(isExpanded ? null : task.id)
                            }
                            className="flex cursor-pointer items-center justify-between p-3 hover:bg-muted/40 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-600 font-semibold text-xs">[Done]</span>
                              <span className="text-xs font-semibold text-foreground">
                                {task.title}
                              </span>
                              <span className="text-xs text-muted-foreground">• {task.venue}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                Completed
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {isExpanded ? "Hide" : "Details"}
                              </span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-border p-3 text-xs bg-muted/10 flex flex-col gap-2">
                              <div>
                                <strong>Event Date:</strong> {task.event_date}
                              </div>
                              {task.description && (
                                <div>
                                  <strong>Details:</strong> {task.description}
                                </div>
                              )}
                              <div className="pt-2 border-t border-border">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setExpandedCommentsTaskId(
                                      expandedCommentsTaskId === task.id ? null : task.id
                                    )
                                  }
                                  className="text-xs h-7"
                                >
                                  Notes & Remarks ({taskComments.length})
                                </Button>
                                {expandedCommentsTaskId === task.id && (
                                  <div className="mt-2">
                                    <TaskComments
                                      taskId={task.id}
                                      comments={taskComments}
                                      authorName={effectiveAuthorName}
                                      onCommentAdded={(newComment) =>
                                        setComments((prev) => [...prev, newComment])
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Tasks from Other Faculties */}
            {bottomTab === "other-faculties" && (
              <div>
                {otherFacultiesTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic p-4 text-center">
                    No colleagues have tasks assigned yet.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {otherFacultiesTasks.map((task) => {
                      const assignedPeer = advisers.find((a) => a.id === task.adviser_id);
                      const isExpanded = expandedOtherTaskId === task.id;
                      const status = getTaskStatus(task);
                      const taskComments = comments.filter((c) => c.task_id === task.id);

                      return (
                        <Card key={task.id} className="border-border shadow-xs">
                          <div
                            onClick={() =>
                              setExpandedOtherTaskId(isExpanded ? null : task.id)
                            }
                            className="flex cursor-pointer items-center justify-between p-3 hover:bg-muted/40 rounded-lg transition-colors"
                          >
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-primary">
                                  {assignedPeer?.name || "Colleague"}
                                </span>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 px-1.5 py-0.5 text-[10px] font-semibold">
                                  {formatYearLevel(task.year_level || assignedPeer?.year_level)}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-foreground">
                                {task.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  status === "completed"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : status === "accepted"
                                    ? "bg-blue-100 text-blue-800"
                                    : status === "declined"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {status === "completed"
                                  ? "Completed"
                                  : status === "accepted"
                                  ? "Accepted"
                                  : status === "declined"
                                  ? "Declined"
                                  : "Pending"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {isExpanded ? "Hide" : "Details"}
                              </span>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="border-t border-border p-3 text-xs bg-muted/10 flex flex-col gap-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <strong>Schedule:</strong> {task.event_date}
                                </div>
                                <div>
                                  <strong>Venue:</strong> {task.venue}
                                </div>
                              </div>
                              {task.description && (
                                <div>
                                  <strong>Instructions:</strong> {task.description}
                                </div>
                              )}
                              <div className="pt-2 border-t border-border">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setExpandedCommentsTaskId(
                                      expandedCommentsTaskId === task.id ? null : task.id
                                    )
                                  }
                                  className="text-xs h-7"
                                >
                                  Coordinator Notes ({taskComments.length})
                                </Button>
                                {expandedCommentsTaskId === task.id && (
                                  <div className="mt-2">
                                    <TaskComments
                                      taskId={task.id}
                                      comments={taskComments}
                                      authorName={effectiveAuthorName}
                                      onCommentAdded={(newComment) =>
                                        setComments((prev) => [...prev, newComment])
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
