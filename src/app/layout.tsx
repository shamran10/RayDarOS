import type { Metadata } from "next";
import "@atlaskit/css-reset";
import "@/app/globals.css";
import { Providers } from "@/app/providers";
import { ClientShell } from "@/components/client-shell";

export const metadata: Metadata = {
  title: "ReydarOS",
  description: "Engagement intelligence operating system"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ClientShell>{children}</ClientShell>
        </Providers>
      </body>
    </html>
  );
}
