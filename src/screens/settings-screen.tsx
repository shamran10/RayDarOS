"use client";

import Button from "@atlaskit/button";
import SectionMessage from "@atlaskit/section-message";
import { Stack } from "@atlaskit/primitives";
import { PageHeading } from "@/components/page-heading";
import { SectionPanel } from "@/components/section-panel";
import { useReydar } from "@/lib/store";

export function SettingsScreen() {
  const { resetDemoData } = useReydar();

  return (
    <>
      <PageHeading
        title="Settings"
        description="Authentication, model, database, workspace, and admin fallback settings."
        breadcrumbs={[{ text: "ReydarOS", href: "/" }, { text: "Settings", href: "/settings" }]}
      />
      <div className="dense-grid">
        <SectionPanel title="Admin and debug fallbacks">
          <Stack space="space.150">
            <p>These screens are kept for inspection, recovery, and provider testing. They are no longer part of the default autonomous operating loop.</p>
            <Button href="/signal-monitor">Manual intake fallback</Button>
            <Button href="/candidates">Candidate map debug</Button>
            <Button href="/deliberation">Deliberation debug</Button>
            <Button href="/autonomy-queue">Legacy approval queue</Button>
            <Button href="/guardrails">Guardrail results</Button>
          </Stack>
        </SectionPanel>
        <SectionPanel title="Authentication-ready structure">
          <Stack space="space.150">
            <p>NextAuth route scaffolding is included at <code>/api/auth/[...nextauth]</code>.</p>
            <p className="muted-text">Connect providers and a production secret before deployment.</p>
          </Stack>
        </SectionPanel>
        <SectionPanel title="Database">
          <Stack space="space.150">
            <p>Prisma 7 is configured for PostgreSQL with a driver adapter and seed data.</p>
            <p className="muted-text">Set <code>DATABASE_URL</code>, run migrations, then seed the demo workspace.</p>
          </Stack>
        </SectionPanel>
        <SectionPanel title="AI model">
          <Stack space="space.150">
            <p>DARM uses a deterministic MVP analyzer locally and includes an OpenAI-ready API route.</p>
            <p className="muted-text">Set <code>OPENAI_API_KEY</code> and <code>OPENAI_MODEL</code> for model-backed analysis.</p>
          </Stack>
        </SectionPanel>
        <SectionPanel title="Demo data">
          <Stack space="space.150">
            <SectionMessage appearance="warning">
              <p>Resetting demo data clears local browser state and restores the seeded ReydarOS examples.</p>
            </SectionMessage>
            <Button appearance="warning" onClick={resetDemoData}>Reset local demo data</Button>
          </Stack>
        </SectionPanel>
      </div>
    </>
  );
}
