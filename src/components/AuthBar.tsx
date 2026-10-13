"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";

export type UserRole = "dean" | "oic" | "admin" | "adviser";

interface AuthBarProps {
  onUserChange?: (user: User | null, role: UserRole) => void;
}

export function AuthBar({ onUserChange }: AuthBarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>("adviser");
  const [displayName, setDisplayName] = useState("");

  const resolveRole = async (userEmail?: string | null): Promise<UserRole> => {
    if (!userEmail) return "adviser";
    const cleanEmail = userEmail.toLowerCase().trim();
    if (cleanEmail === "dean@gmail.com") return "dean";
    if (cleanEmail === "oic@gmail.com") return "oic";
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("advisers")
        .select("role")
        .eq("email", cleanEmail)
        .maybeSingle();
      if (data?.role === "dean") return "dean";
      if (data?.role === "oic") return "oic";
      if (data?.role === "admin") return "admin";
      if (data?.role === "adviser") return "adviser";
    } catch { /* fallback */ }
    return "adviser";
  };

  const resolveName = async (u: User | null): Promise<string> => {
    if (!u) return "";
    const cleanEmail = u.email?.toLowerCase().trim() ?? "";

    // Hardcoded real admin display names
    if (cleanEmail === "dean@gmail.com") return "Dean Admin";
    if (cleanEmail === "oic@gmail.com") return "OIC Admin";

    // Try full_name from auth metadata
    const meta = u.user_metadata;
    if (meta?.full_name) return meta.full_name as string;
    if (meta?.first_name) {
      const fn = [meta.first_name, meta.last_name].filter(Boolean).join(" ");
      if (fn.trim()) return fn.trim();
    }
    // Fall back to advisers table name
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("advisers")
        .select("name")
        .eq("email", cleanEmail)
        .maybeSingle();
      if (data?.name) return data.name as string;
    } catch { /* ignore */ }
    // Last resort: email prefix
    return u.email?.split("@")[0] ?? "User";
  };

  const onUserChangeRef = useRef(onUserChange);
  useEffect(() => { onUserChangeRef.current = onUserChange; }, [onUserChange]);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      setUser(u);
      const userRole = await resolveRole(u?.email);
      setRole(userRole);
      setDisplayName(await resolveName(u));
      onUserChangeRef.current?.(u, userRole);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      const userRole = await resolveRole(u?.email);
      setRole(userRole);
      setDisplayName(await resolveName(u));
      onUserChangeRef.current?.(u, userRole);
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (!user) return null;

  const roleBadge: Record<UserRole, { label: string; cls: string }> = {
    dean:    { label: "Dean",    cls: "bg-purple-100 text-purple-800" },
    oic:     { label: "OIC",     cls: "bg-blue-100 text-blue-800" },
    admin:   { label: "Admin",   cls: "bg-indigo-100 text-indigo-800" },
    adviser: { label: "Adviser", cls: "bg-emerald-100 text-emerald-800" },
  };
  const badge = roleBadge[role];

  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-border/60 mb-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-foreground">{displayName}</span>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={handleSignOut}
        className="h-7 text-xs px-2.5 text-muted-foreground hover:text-foreground"
      >
        Sign Out
      </Button>
    </div>
  );
}
