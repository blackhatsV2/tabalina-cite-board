import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:py-10 animate-fadeIn">
      {/* Brand Header */}
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            CITE Boardroom
          </h1>
          <div className="flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-50/70 dark:bg-blue-950/40 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Syncing database…</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Task Designation Management — College of IT Education
        </p>
      </header>

      {/* Modern Loading Banner Card */}
      <div className="flex flex-col items-center justify-center rounded-2xl border border-primary/20 bg-card p-8 sm:p-12 shadow-xs text-center relative overflow-hidden">
        {/* Subtle Top Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary/10 overflow-hidden">
          <div className="h-full bg-primary animate-pulse w-3/4 rounded-r-full" />
        </div>

        <div className="relative mb-4 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
        </div>

        <h2 className="text-base font-bold text-foreground sm:text-lg">
          Loading CITE Boardroom
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-md">
          Fetching the latest duty designations, committee assignments, and faculty schedules. Please hold on…
        </p>
      </div>

      {/* Shimmer Skeleton Placeholders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-70">
        {[1, 2, 3].map((col) => (
          <div
            key={col}
            className="rounded-xl border border-border/80 bg-card/60 p-4 flex flex-col gap-3 animate-pulse"
          >
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-2 bg-muted/60 rounded w-1/2" />
            <div className="mt-2 flex flex-col gap-2">
              <div className="h-20 bg-muted/50 rounded-lg" />
              <div className="h-20 bg-muted/50 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-auto border-t border-border pt-4 text-xs text-muted-foreground flex justify-between">
        <span>PHINMA AI Builder Workshop — Team Tabalina</span>
        <span>College of IT Education</span>
      </footer>
    </main>
  );
}
