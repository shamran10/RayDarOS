"use client";

import Button from "@atlaskit/button";
import SectionMessage from "@atlaskit/section-message";
import Spinner from "@atlaskit/spinner";
import { Inline } from "@atlaskit/primitives";

interface ProjectBrainLoadStateProps {
  status: "loading" | "ready" | "error";
  error?: string;
  retry: () => Promise<void>;
}

export function ProjectBrainLoadState({
  status,
  error,
  retry
}: ProjectBrainLoadStateProps) {
  if (status === "ready") return null;

  if (status === "loading") {
    return (
      <SectionMessage title="Loading Project Brain">
        <Inline space="space.100" alignBlock="center">
          <Spinner size="small" />
          <span>Loading projects and knowledge from the database.</span>
        </Inline>
      </SectionMessage>
    );
  }

  return (
    <SectionMessage appearance="error" title="Project Brain is unavailable">
      <p>{error ?? "The database-backed Project Brain could not be loaded."}</p>
      <Button appearance="link" spacing="compact" onClick={() => void retry()}>
        Try again
      </Button>
    </SectionMessage>
  );
}
