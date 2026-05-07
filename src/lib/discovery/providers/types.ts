import type { DiscoveredItem, Project, SignalSource } from "@/lib/types";

export interface DiscoveryProviderContext {
  project: Project;
  source: SignalSource;
  discoveryRunId: string;
  now: string;
}

export interface DiscoveryProvider {
  name: string;
  scan: (context: DiscoveryProviderContext) => DiscoveredItem[] | Promise<DiscoveredItem[]>;
}
