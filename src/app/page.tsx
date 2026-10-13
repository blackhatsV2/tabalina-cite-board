import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();
  const { data: advisers, error } = await supabase
    .from("advisers")
    .select("*")
    .order("year_level", { ascending: true });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10 sm:py-16">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
            CITE Week 2026
          </span>
          <span className="text-xs text-muted-foreground">Ticket 02</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          CITE Board
        </h1>
        <p className="text-sm text-muted-foreground">
          Connected to Supabase. Below are the faculty advisers loaded directly from the database.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Faculty Advisers ({advisers?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {error && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              <p className="font-semibold">Database query error:</p>
              <p>{error.message}</p>
              <p className="mt-2 text-xs">
                Ensure you have run <code>supabase/sql/002-create-advisers.sql</code> in the Supabase SQL editor.
              </p>
            </div>
          )}

          {!error && advisers && advisers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No advisers found. Please run the seed SQL in the Supabase SQL Editor.
            </p>
          )}

          {!error && advisers && advisers.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {advisers.map((adviser) => (
                <div
                  key={adviser.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {adviser.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Assigned: {adviser.year_level}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <footer className="mt-auto border-t border-border pt-4 text-xs text-muted-foreground">
        CITE Board — PHINMA AI Builder MVP
      </footer>
    </main>
  );
}
