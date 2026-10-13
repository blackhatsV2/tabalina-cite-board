"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@supabase/supabase-js";

export type UserRole = "dean" | "oic" | "adviser";

interface AuthBarProps {
  onUserChange?: (user: User | null, role: UserRole) => void;
}

export function AuthBar({ onUserChange }: AuthBarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>("adviser");
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [yearLevel, setYearLevel] = useState("Year 2");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const determineRole = (userEmail?: string | null): UserRole => {
    if (!userEmail) return "adviser";
    const cleanEmail = userEmail.toLowerCase().trim();
    if (cleanEmail === "dean@gmail.com") return "dean";
    if (cleanEmail === "oic@gmail.com") return "oic";
    return "adviser";
  };

  // Keep a stable ref to onUserChange to prevent infinite re-render loops
  const onUserChangeRef = useRef(onUserChange);
  useEffect(() => {
    onUserChangeRef.current = onUserChange;
  }, [onUserChange]);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      const userRole = determineRole(user?.email);
      setRole(userRole);
      onUserChangeRef.current?.(user, userRole);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      const userRole = determineRole(currentUser?.email);
      setRole(userRole);
      onUserChangeRef.current?.(currentUser, userRole);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Run only once on mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage({ type: "error", text: error.message });
        } else {
          setMessage({ type: "success", text: "Signed in successfully!" });
          setTimeout(() => setIsOpen(false), 600);
        }
      } else {
        // Sign up with first and last name
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim() || email.split("@")[0];

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              full_name: fullName,
              year_level: yearLevel,
            },
          },
        });

        if (error) {
          setMessage({ type: "error", text: error.message });
        } else {
          // Record or sync into advisers table
          try {
            await supabase.from("advisers").insert({
              name: fullName,
              year_level: yearLevel,
              email: email.toLowerCase().trim(),
              role: determineRole(email),
            });
          } catch {
            // If already exists or error, continue
          }

          if (data.user && !data.session) {
            setMessage({
              type: "success",
              text: "Account created! You can now log in with your credentials.",
            });
          } else {
            setMessage({ type: "success", text: "Account created and logged in!" });
            setTimeout(() => setIsOpen(false), 600);
          }
        }
      }
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : "Authentication error";
      setMessage({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setLoading(true);
    setMessage(null);
    setEmail(demoEmail);
    setPassword("password123");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: "password123",
    });

    if (error) {
      // If user not yet created in Supabase Auth, attempt automatic sign up for instant demo experience
      const demoRole = determineRole(demoEmail);
      const demoName =
        demoEmail === "dean@gmail.com"
          ? "Dean"
          : demoEmail === "oic@gmail.com"
          ? "OIC Coordinator"
          : "Jayrold Tabalina";

      const signUpRes = await supabase.auth.signUp({
        email: demoEmail,
        password: "password123",
        options: {
          data: { full_name: demoName },
        },
      });

      if (signUpRes.error) {
        setMessage({
          type: "error",
          text: `Demo sign-in failed: ${signUpRes.error.message}. Please create the user in Supabase Auth or click Sign Up.`,
        });
      } else {
        setMessage({
          type: "success",
          text: `Demo account initialized for ${demoEmail}!`,
        });
        setTimeout(() => setIsOpen(false), 800);
      }
    } else {
      setMessage({ type: "success", text: `Signed in as ${demoEmail}!` });
      setTimeout(() => setIsOpen(false), 600);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case "dean":
        return <span className="rounded bg-purple-100 text-purple-800 px-1.5 py-0.5 font-bold uppercase text-[10px]">Dean (Admin)</span>;
      case "oic":
        return <span className="rounded bg-blue-100 text-blue-800 px-1.5 py-0.5 font-bold uppercase text-[10px]">OIC (Admin)</span>;
      default:
        return <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.5 font-semibold text-[10px]">Faculty Adviser</span>;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Top Session Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/40 px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-foreground">
                Logged in: <strong className="font-semibold">{user.email}</strong>
              </span>
              {getRoleBadge(role)}
            </div>
          ) : (
            <span className="text-muted-foreground">
              Guest Mode — Sign in to assign, approve, or confirm tasks
            </span>
          )}
        </div>

        {user ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSignOut}
            className="h-7 text-xs px-2.5"
          >
            Sign Out
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="h-7 text-xs px-2.5"
          >
            {isOpen ? "Close" : "Sign In / Register"}
          </Button>
        )}
      </div>

      {/* Expandable Sign In / Sign Up Form Card */}
      {isOpen && !user && (
        <Card className="border-primary/30 shadow-md">
          <CardHeader className="pb-3 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {mode === "signin" ? "Account Sign In" : "Register Faculty Adviser"}
              </CardTitle>
              <div className="flex gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setMessage(null);
                  }}
                  className={`px-2 py-0.5 rounded font-medium ${
                    mode === "signin"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setMessage(null);
                  }}
                  className={`px-2 py-0.5 rounded font-medium ${
                    mode === "signup"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pb-4 flex flex-col gap-4">
            {/* Quick Demo Logins Section */}
            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                  ⚡ 1-Click Demo Accounts (password: password123)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loading}
                  onClick={() => handleQuickLogin("dean@gmail.com")}
                  className="h-7 text-[11px] bg-background"
                >
                  👔 Dean
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loading}
                  onClick={() => handleQuickLogin("oic@gmail.com")}
                  className="h-7 text-[11px] bg-background"
                >
                  📋 OIC (Assign Tasks)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={loading}
                  onClick={() => handleQuickLogin("jtabalina.ui@phinmaed.com")}
                  className="h-7 text-[11px] bg-background"
                >
                  🧑‍🏫 Adviser (J. Tabalina)
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {mode === "signup" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="first-name" className="text-xs">
                        First Name
                      </Label>
                      <Input
                        id="first-name"
                        placeholder="e.g. Maria"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        className="text-xs h-9"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="last-name" className="text-xs">
                        Last Name
                      </Label>
                      <Input
                        id="last-name"
                        placeholder="e.g. Santos"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <Label htmlFor="year-level" className="text-xs">
                      Assigned Year Level
                    </Label>
                    <select
                      id="year-level"
                      value={yearLevel}
                      onChange={(e) => setYearLevel(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                <Label htmlFor="auth-email" className="text-xs">
                  Email Address
                </Label>
                <Input
                  id="auth-email"
                  type="email"
                  placeholder="name@phinmaed.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-xs h-9"
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="auth-password" className="text-xs">
                  Password
                </Label>
                <Input
                  id="auth-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-xs h-9"
                />
              </div>

              {message && (
                <div
                  className={`rounded-md p-2 text-xs ${
                    message.type === "success"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <Button type="submit" disabled={loading} className="mt-1 h-9 text-xs">
                {loading
                  ? "Processing..."
                  : mode === "signin"
                  ? "Sign In"
                  : "Create Adviser Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
