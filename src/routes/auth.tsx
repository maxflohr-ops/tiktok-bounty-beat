import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Bounty Sounds" },
      { name: "description", content: "Sign in or create an editor account to claim TikTok clipping bounties on Bounty Sounds." },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "Sign in — Bounty Sounds" },
      { property: "og:url", content: "https://bountysounds.com/auth" },
    ],
    links: [{ rel: "canonical", href: "https://bountysounds.com/auth" }],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email().max(255);
const passwordSchema = z.string().min(6).max(72);

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch {
      toast.error("Please use a valid email and a password with at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. You can start claiming contracts.");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="relative grid min-h-screen md:grid-cols-2">
      <div className="scanlines fixed inset-0 z-50 opacity-40" />
      <div className="vignette fixed inset-0 z-40" />
      <aside className="relative z-10 hidden flex-col justify-between border-r border-[var(--iron)] bg-[var(--wall-2)] p-10 md:flex">
        <Link to="/" className="font-display text-2xl text-bone">
          THE BOARD
        </Link>
        <div>
          <h2 className="font-display text-4xl leading-tight text-bone">
            Edit. Post. <span className="text-[var(--gold)]">Get rewarded.</span>
          </h2>
          <p className="mt-3 max-w-sm text-sm text-bone-soft">
            Join as an editor to claim contracts from the artist and earn points and cash payouts.
          </p>
        </div>
        <p className="text-xs text-bone-soft">By continuing you agree to reasonable use.</p>
      </aside>
      <main className="relative z-10 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex md:hidden">
            <Link to="/" className="font-display text-xl text-bone">
              THE BOARD
            </Link>
          </div>
          <h1 className="font-display text-3xl text-bone">
            {mode === "signin" ? "Welcome back" : "Create your editor account"}
          </h1>
          <p className="mt-1 text-sm text-bone-soft">
            {mode === "signin" ? "Sign in to submit contracts." : "It takes a minute."}
          </p>

          <button
            onClick={google}
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-2 border border-[var(--border)] bg-[var(--wall-2)] px-4 py-2.5 text-sm font-medium text-bone transition hover:bg-[var(--wall)] disabled:opacity-60"
          >
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.4 2.6 30 .5 24 .5 14.6.5 6.5 5.9 2.6 13.7l7.9 6.1C12.5 13.2 17.7 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.9 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.9c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/>
              <path fill="#FBBC05" d="M10.5 28.3a14.5 14.5 0 010-8.6l-7.9-6.1a24 24 0 000 20.8l7.9-6.1z"/>
              <path fill="#34A853" d="M24 47.5c6 0 11.1-2 14.8-5.4l-7.6-5.9c-2.1 1.4-4.8 2.3-7.2 2.3-6.3 0-11.5-3.7-13.5-9.1l-7.9 6.1C6.5 42.1 14.6 47.5 24 47.5z"/>
            </svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-bone-soft">
            <span className="h-px flex-1 bg-[var(--border)]" /> or <span className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <label className="block text-xs font-medium text-bone-soft">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border border-[var(--border)] bg-[var(--wall-2)] px-3 py-2 text-sm text-bone outline-none focus:border-[var(--gold)]"
              />
            </label>
            <label className="block text-xs font-medium text-bone-soft">
              Password
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border border-[var(--border)] bg-[var(--wall-2)] px-3 py-2 text-sm text-bone outline-none focus:border-[var(--gold)]"
              />
            </label>
            <button
              disabled={busy}
              className="silver-btn w-full"
            >
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-bone-soft">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="font-medium text-bone underline underline-offset-2"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
