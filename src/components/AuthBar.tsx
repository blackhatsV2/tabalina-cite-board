"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@supabase/supabase-js";

interface AuthBarProps {
  onUserChange?: (user: User | null) => void;
}

export function AuthBar({ onUserChange }: AuthBarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Check active session on mount
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      onUserChange?.(user);
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      onUserChange?.(currentUser);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [onUserChange]);

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
          setTimeout(() => setIsOpen(false), 800);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setMessage({ type: "error", text: error.message });
        } else if (data.user && !data.session) {
          setMessage({
            type: "success",
            text: "Account created! Please check your email to verify or sign in.",
          });
        } else {
          setMessage({ type: "success", text: "Account created & signed in!" });
          setTimeout(() => setIsOpen(false), 800);
        }
      }
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : "Authentication failed";
      setMessage({ type: "error", text });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Top Session Status Bar */}
      <div className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/40 px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          {user ? (
            <span className="text-foreground">
              Signed in as: <strong className="font-semibold">{user.email}</strong>
            </span>
          ) : (
            <span className="text-muted-foreground">
              Viewing as Guest / Demo Mode
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
                {mode === "signin" ? "Faculty Adviser Sign In" : "Create Adviser Account"}
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

          <CardContent className="pb-4">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
                  : "Create Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
