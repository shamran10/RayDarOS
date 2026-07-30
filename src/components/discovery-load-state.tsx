"use client";

import Button from "@atlaskit/button";
import SectionMessage from "@atlaskit/section-message";
import Spinner from "@atlaskit/spinner";
import { Inline } from "@atlaskit/primitives";
import type { DiscoveryDataStatus } from "@/lib/discovery/context";

interface DiscoveryLoadStateProps {
  status: DiscoveryDataStatus;
  error?: string;
  retry: () => Promise<void>;
}

export function DiscoveryLoadState({ status, error, retry }: DiscoveryLoadStateProps) {
  if (status === "ready") return null;

  if (status === "loading") {
    return (
      <SectionMessage title="Loading discovery data">
        <Inline space="space.100" alignBlock="center">
          <Spinner size="small" />
          <span>Loading signal sources, discovery runs, and candidates from the database.</span>
        </Inline>
      </SectionMessage>
    );
  }

  return (
    <SectionMessage appearance="error" title="Discovery data is unavailable">
      <p>{error ?? "The database-backed discovery service could not be loaded."}</p>
      <Button appearance="link" spacing="compact" onClick={() => void retry()}>
        Try again
      </Button>
    </SectionMessage>
  );
}
