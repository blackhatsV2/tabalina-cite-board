"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "idle" | "signin" | "signup";

export function LandingPage() {
  const [mode, setMode] = useState<AuthMode>("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [yearLevel, setYearLevel] = useState("Year 1");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const openMode = (m: AuthMode) => {
    setMode(m);
    setMessage(null);
    setEmail("");
    setPassword("");
    setFirstName("");
    setLastName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage({ type: "error", text: error.message });
        } else {
          window.location.reload();
        }
      } else {
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || email.split("@")[0];
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { first_name: firstName, last_name: lastName, full_name: fullName, year_level: yearLevel } },
        });
        if (error) {
          setMessage({ type: "error", text: error.message });
        } else {
          try {
            await supabase.from("advisers").insert({
              name: fullName,
              year_level: yearLevel,
              email: email.toLowerCase().trim(),
              role: "adviser",
            });
          } catch { /* ignore if already exists */ }

          if (data.user && !data.session) {
            setMessage({ type: "success", text: "Account created! You can now sign in." });
            setMode("signin");
          } else {
            window.location.reload();
          }
        }
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Authentication error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: demoEmail, password: "password123" });

    if (error) {
      const demoRole = demoEmail === "dean@gmail.com" ? "dean" : demoEmail === "oic@gmail.com" ? "oic" : "adviser";
      const demoName = demoEmail === "dean@gmail.com" ? "Dean" : demoEmail === "oic@gmail.com" ? "OIC Coordinator" : "Faculty Member";

      const { error: signUpError } = await supabase.auth.signUp({
        email: demoEmail,
        password: "password123",
        options: { data: { full_name: demoName } },
      });
      if (signUpError) {
        setMessage({ type: "error", text: `Could not sign in: ${signUpError.message}` });
        setLoading(false);
        return;
      }
      try {
        await supabase.from("advisers").insert({
          name: demoName,
          year_level: demoRole === "adviser" ? "Year 1" : "Admin",
          email: demoEmail.toLowerCase().trim(),
          role: demoRole,
        });
      } catch { /* ignore */ }
    }
    window.location.reload();
  };

  const demoAccounts = [
    { email: "dean@gmail.com", label: "Dean", sub: "Full admin access" },
    { email: "oic@gmail.com", label: "OIC Coordinator", sub: "Admin access" },
    { email: "faculty@gmail.com", label: "Faculty Member", sub: "Adviser view" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm flex flex-col gap-8">

        {/* Brand */}
        <div className="flex flex-col gap-1.5 text-center">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">
            College of IT Education
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">CITE Board</h1>
          <p className="text-sm text-muted-foreground">Task Designation Management</p>
        </div>

        {/* Auth form or idle CTA */}
        {mode === "idle" ? (
          <div className="flex flex-col gap-3">
            <Button onClick={() => openMode("signin")} className="w-full h-10 text-sm font-semibold">
              Sign In
            </Button>
            <Button
              onClick={() => openMode("signup")}
              variant="outline"
              className="w-full h-10 text-sm font-semibold"
            >
              Create Account
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Mode toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden text-xs font-medium">
              <button
                type="button"
                onClick={() => openMode("signin")}
                className={`flex-1 py-2 transition-colors ${
                  mode === "signin"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => openMode("signup")}
                className={`flex-1 py-2 transition-colors ${
                  mode === "signup"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                Create Account
              </button>
            </div>

            {mode === "signup" && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="lp-first" className="text-xs text-muted-foreground">First Name</Label>
                    <Input
                      id="lp-first"
                      placeholder="Maria"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="lp-last" className="text-xs text-muted-foreground">Last Name</Label>
                    <Input
                      id="lp-last"
                      placeholder="Santos"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label htmlFor="lp-year" className="text-xs text-muted-foreground">Year Level</Label>
                  <select
                    id="lp-year"
                    value={yearLevel}
                    onChange={(e) => setYearLevel(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Year 1">Year 1</option>
                    <option value="Year 2">Year 2</option>
                    <option value="Year 3">Year 3</option>
                    <option value="Year 4">Year 4</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex flex-col gap-1">
              <Label htmlFor="lp-email" className="text-xs text-muted-foreground">Email Address</Label>
              <Input
                id="lp-email"
                type="email"
                placeholder="name@phinmaed.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="lp-password" className="text-xs text-muted-foreground">Password</Label>
              <Input
                id="lp-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-9 text-sm"
              />
            </div>

            {message && (
              <p
                className={`rounded-md px-3 py-2 text-xs ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message.text}
              </p>
            )}

            <Button type="submit" disabled={loading} className="h-10 text-sm font-semibold">
              {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
            </Button>

            <button
              type="button"
              onClick={() => openMode("idle")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center"
            >
              ← Back
            </button>
          </form>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[11px] text-muted-foreground">or preview with a demo account</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Demo accounts */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] text-muted-foreground text-center">
            Demo accounts use sandboxed data — separate from the real board.
          </p>
          {demoAccounts.map(({ email: dEmail, label, sub }) => (
            <button
              key={dEmail}
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin(dEmail)}
              className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/30 px-3.5 py-2.5 text-left transition-colors hover:bg-muted/60 disabled:opacity-50"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground">{sub}</p>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">{dEmail}</span>
            </button>
          ))}
          <p className="text-center text-[11px] text-muted-foreground mt-1">
            Password for all demo accounts: <span className="font-semibold">password123</span>
          </p>
        </div>

      </div>

      {/* Footer */}
      <footer className="absolute bottom-4 text-[11px] text-muted-foreground">
        PHINMA AI Builder Workshop · Team Tabalina
      </footer>
    </div>
  );
}
