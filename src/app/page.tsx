import { createClient } from "@/lib/supabase/server";
import { TaskBoard, Adviser, Task, TaskComment } from "@/components/TaskBoard";

export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();

  // Fetch advisers
  const { data: advisersData } = await supabase
    .from("advisers")
    .select("*")
    .order("year_level", { ascending: true });

  // Fetch tasks
  const { data: tasksData } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });

  // Fetch comments (fail gracefully if table not yet created)
  const { data: commentsData } = await supabase
    .from("comments")
    .select("*")
    .order("created_at", { ascending: true });

  const advisers: Adviser[] = advisersData || [];
  const tasks: Task[] = tasksData || [];
  const comments: TaskComment[] = commentsData || [];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:py-10">
      {/* Brand Header */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            CITE Week 2026
          </span>
          <span className="text-xs text-muted-foreground">College of IT Education</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          CITE Board
        </h1>
        <p className="text-sm text-muted-foreground">
          Assigned tasks, event schedules, live approvals, and coordinator notes in one place.
        </p>
      </header>

      {/* Interactive Board */}
      <TaskBoard
        initialAdvisers={advisers}
        initialTasks={tasks}
        initialComments={comments}
      />

      <footer className="mt-auto border-t border-border pt-4 text-xs text-muted-foreground flex justify-between">
        <span>PHINMA AI Builder MVP — Team Tabalina</span>
        <span>Ticket 08 — Admin & Faculty Dashboards</span>
      </footer>
    </main>
  );
}
