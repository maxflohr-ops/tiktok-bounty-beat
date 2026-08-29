// Whop shell layout (/whop/*). Whop provides the surrounding chrome, so this
// layout renders no site header/footer — just the page body on the house ground.
//
// WhopIframeSdkProvider is mounted here and ONLY here: web routes never import
// it. The iframe SDK speaks window.postMessage, so it is browser-only — the
// provider is loaded after mount and never instantiated during SSR.

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useState, type ReactNode } from "react";

export const Route = createFileRoute("/whop")({
  component: WhopLayout,
});

const IframeProvider = lazy(async () => {
  const { WhopIframeSdkProvider } = await import("@whop/react/iframe");
  const appId = import.meta.env.VITE_WHOP_APP_ID as string | undefined;
  const Provider = ({ children }: { children: ReactNode }) => (
    <WhopIframeSdkProvider options={appId ? { appId } : undefined}>
      {children}
    </WhopIframeSdkProvider>
  );
  return { default: Provider };
});

function WhopLayout() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const body = (
    <main className="relative min-h-screen px-4 py-6">
      <Outlet />
    </main>
  );

  // SSR and first paint render without the iframe SDK; it attaches on mount.
  if (!mounted) return body;
  return <Suspense fallback={body}>{<IframeProvider>{body}</IframeProvider>}</Suspense>;
}
