import { createClient } from "@/lib/supabase/server";
import { TaskBoard, Adviser, Task, TaskComment } from "@/components/TaskBoard";
import { LandingPage } from "@/components/LandingPage";

export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();

  // Auth gate — unauthenticated visitors see the landing page only
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return <LandingPage />;
  }

  // Authenticated — fetch board data
  const { data: advisersData } = await supabase
    .from("advisers")
    .select("*")
    .order("year_level", { ascending: true });

  const { data: tasksData } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: true });

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
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          CITE Boardroom
        </h1>
        <p className="text-sm text-muted-foreground">
          Task Designation Management
        </p>
      </header>

      {/* Interactive Board */}
      <TaskBoard
        initialAdvisers={advisers}
        initialTasks={tasks}
        initialComments={comments}
      />

      <footer className="mt-auto border-t border-border pt-4 text-xs text-muted-foreground flex justify-between">
        <span>PHINMA AI Builder Workshop — Team Tabalina</span>
        <span>College of IT Education</span>
      </footer>
    </main>
  );
}
