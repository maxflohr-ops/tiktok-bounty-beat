import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { z } from "zod";
import { BsButton, BsDisplay, BsEyebrow, BsMarker, BsWell } from "@/components/bs";
import { consumeReturnTo } from "@/lib/return-to";

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
        navigate({ to: (consumeReturnTo() ?? "/dashboard") as never });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. Let's get you set up.");
        navigate({ to: (consumeReturnTo() ?? "/start") as never });
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
    navigate({ to: (consumeReturnTo() ?? "/dashboard") as never });
  };

  return (
    <div className="bs-surface min-h-screen">
      <main className="container-board flex min-h-screen items-center justify-center py-10">
        <BsWell className="w-full max-w-md">
          <div className="text-center">
            <Link to="/" className="inline-flex min-h-[44px] items-center gap-2 text-xl font-semibold text-[var(--color-bs-ink)] [font-family:var(--font-brand)]">
              <img src="/art/great-seal.png" alt="" aria-hidden className="h-7 w-7 object-contain" />
              Bounty Sounds
            </Link>
            <BsEyebrow className="mt-4 block">
              {mode === "signin" ? "welcome back" : "create account"}
            </BsEyebrow>
            <BsDisplay as="h1" size="sm" className="mt-2">
              {mode === "signin" ? "Sign in" : "Editor account"}
            </BsDisplay>
            <p className="mt-2 text-sm text-[var(--color-bs-ink-soft)]">
              {mode === "signin" ? "Claim contracts. Cash verified views." : "Takes a minute. Start claiming right after."}
            </p>
          </div>

          <button
            onClick={google}
            disabled={busy}
            className="bs-btn bs-btn-ghost mt-6 w-full"
          >
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.4 2.6 30 .5 24 .5 14.6.5 6.5 5.9 2.6 13.7l7.9 6.1C12.5 13.2 17.7 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.9 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.9c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z"/>
              <path fill="#FBBC05" d="M10.5 28.3a14.5 14.5 0 010-8.6l-7.9-6.1a24 24 0 000 20.8l7.9-6.1z"/>
              <path fill="#34A853" d="M24 47.5c6 0 11.1-2 14.8-5.4l-7.6-5.9c-2.1 1.4-4.8 2.3-7.2 2.3-6.3 0-11.5-3.7-13.5-9.1l-7.9 6.1C6.5 42.1 14.6 47.5 24 47.5z"/>
            </svg>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-xs text-[var(--color-bs-ink-mute)]">
            <span className="h-px flex-1 bg-[var(--color-bs-rule)]" /> or <span className="h-px flex-1 bg-[var(--color-bs-rule)]" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="bs-mono uppercase text-[var(--color-bs-ink-mute)]">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bs-input mt-1"
              />
            </label>
            <label className="block">
              <span className="bs-mono uppercase text-[var(--color-bs-ink-mute)]">Password</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bs-input mt-1"
              />
            </label>
            <BsButton type="submit" disabled={busy} className="w-full">
              {mode === "signin" ? "Sign in" : "Create account"}
            </BsButton>
          </form>

          <p className="mt-5 text-center text-sm text-[var(--color-bs-ink-soft)]">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="inline-flex min-h-[44px] items-center font-medium text-[var(--color-bs-ink)] underline underline-offset-2 md:min-h-0"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <p className="mt-4 text-center">
            <BsMarker>paid in verified views</BsMarker>
          </p>
        </BsWell>
      </main>
    </div>
  );
}
