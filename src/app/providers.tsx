"use client";

import { useEffect } from "react";
import { setGlobalTheme } from "@atlaskit/tokens";
import { DeliberationProvider } from "@/lib/deliberation/context";
import { DiscoveryProvider } from "@/lib/discovery/context";
import { StoreProvider } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void setGlobalTheme({
      colorMode: "light",
      light: "light",
      dark: "dark",
      spacing: "spacing"
    });
  }, []);

  return (
    <StoreProvider>
      <DiscoveryProvider>
        <DeliberationProvider>{children}</DeliberationProvider>
      </DiscoveryProvider>
    </StoreProvider>
  );
}
