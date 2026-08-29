// Link that leaves the Whop iframe. Inside Whop, plain <a target="_blank"> can
// be swallowed by the embedded webview, so when the iframe SDK is mounted we
// route through its openExternalUrl. Browser-only: the SDK context only exists
// under the /whop layout after mount; everywhere else this degrades to a
// normal external anchor.

import { useContext, type ReactNode } from "react";
import { WhopIframeSdkContext } from "@whop/react/iframe";

export function WhopExternalLink({ url, children }: { url: string; children: ReactNode }) {
  // useContext (not the throwing hook) so SSR and non-provider renders degrade
  // to the plain anchor instead of crashing. The context value is the sdk.
  const sdk = useContext(WhopIframeSdkContext);

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className="underline decoration-dotted underline-offset-2 hover:text-bone"
      onClick={(e) => {
        if (sdk?.openExternalUrl) {
          e.preventDefault();
          sdk.openExternalUrl({ url });
        }
      }}
    >
      {children}
    </a>
  );
}
