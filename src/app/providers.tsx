"use client";

import { useEffect } from "react";
import { setGlobalTheme } from "@atlaskit/tokens";
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

  return <StoreProvider>{children}</StoreProvider>;
}
