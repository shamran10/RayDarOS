"use client";

import { useState } from "react";
import Badge from "@atlaskit/badge";
import Button from "@atlaskit/button";
import DynamicTable from "@atlaskit/dynamic-table";
import EmptyState from "@atlaskit/empty-state";
import Modal, { ModalBody, ModalFooter, ModalHeader, ModalTitle, ModalTransition } from "@atlaskit/modal-dialog";
import TextArea from "@atlaskit/textarea";
import { Box, Inline, Stack } from "@atlaskit/primitives";
import { PageHeading } from "@/components/page-heading";
import { SectionPanel } from "@/components/section-panel";
import { autonomousActionStatusLabels, autonomousActionTypeLabels, finalDecisionActionLabels } from "@/lib/labels";
import { useReydar } from "@/lib/store";
import type { AutonomousActionLog } from "@/lib/types";

export function AutonomousActionLogScreen() {
  const { activeProject, state } = useReydar();
  const [selected, setSelected] = useState<AutonomousActionLog | undefined>();
  const logs = state.autonomousActionLogs.filter((log) => log.projectId === activeProject.id);

  return (
    <>
      <PageHeading
        title="Audit Log"
        description="Every autonomous or semi-autonomous action is traceable to a candidate, deliberation, final decision, and policy snapshot."
        breadcrumbs={[{ text: "ReydarOS", href: "/" }, { text: "Audit Log", href: "/action-log" }]}
      />

      <SectionPanel title="Action trail">
        {logs.length ? (
          <DynamicTable
            head={{
              cells: [
                { key: "type", content: "Action type" },
                { key: "status", content: "Status" },
                { key: "candidate", content: "Candidate" },
                { key: "community", content: "Community" },
                { key: "decision", content: "Decision" },
                { key: "policy", content: "Policy snapshot" },
                { key: "response", content: "Response text" },
                { key: "reason", content: "Reason" },
                { key: "date", content: "Date" },
                { key: "inspect", content: "Inspect" }
              ]
            }}
            rows={logs.map((log) => {
              const candidate = state.conversationCandidates.find((item) => item.id === log.candidateId);
              const decision = state.finalDecisions.find((item) => item.id === log.finalDecisionId);
              return {
                key: log.id,
                cells: [
                  { key: "type", content: autonomousActionTypeLabels[log.actionType] },
                  { key: "status", content: <Badge>{autonomousActionStatusLabels[log.actionStatus]}</Badge> },
                  { key: "candidate", content: candidate?.title ?? "Unknown candidate" },
                  { key: "community", content: log.community },
                  { key: "decision", content: decision ? finalDecisionActionLabels[decision.selectedAction] : "Unknown" },
                  { key: "policy", content: log.policySnapshot.name },
                  { key: "response", content: log.responseText ? `${log.responseText.slice(0, 110)}...` : "No response" },
                  { key: "reason", content: log.reason.slice(0, 110) },
                  { key: "date", content: new Date(log.createdAt).toLocaleString() },
                  { key: "inspect", content: <Button onClick={() => setSelected(log)}>Inspect trail</Button> }
                ]
              };
            })}
            rowsPerPage={10}
          />
        ) : (
          <EmptyState
            header="No autonomous actions logged yet"
            description="Run discovery or deliberation. ReydarOS will log queue, monitor, save, block, or simulated auto-reply actions."
            primaryAction={<Button appearance="primary" href="/signal-discovery">Run discovery</Button>}
          />
        )}
      </SectionPanel>

      <Box paddingBlockStart="space.200">
        <div className="responsive-grid">
          {["auto_reply", "queue_for_approval", "save_as_insight", "monitor", "block"].map((type) => (
            <SectionPanel key={type} title={autonomousActionTypeLabels[type as keyof typeof autonomousActionTypeLabels]}>
              <strong>{logs.filter((log) => log.actionType === type).length}</strong>
            </SectionPanel>
          ))}
        </div>
      </Box>

      <ModalTransition>
        {selected ? (
          <Modal onClose={() => setSelected(undefined)} width="x-large">
            <ModalHeader><ModalTitle>Decision trail</ModalTitle></ModalHeader>
            <ModalBody>
              <Stack space="space.200">
                <Inline space="space.100" shouldWrap>
                  <Badge>{autonomousActionTypeLabels[selected.actionType]}</Badge>
                  <Badge>{autonomousActionStatusLabels[selected.actionStatus]}</Badge>
                  <Badge>{selected.platform}</Badge>
                  <Badge>{selected.community}</Badge>
                </Inline>
                <SectionPanel title="Reason">
                  <p>{selected.reason}</p>
                </SectionPanel>
                <SectionPanel title="Policy snapshot">
                  <div className="dense-grid">
                    <Inline spread="space-between"><span>Policy</span><strong>{selected.policySnapshot.name}</strong></Inline>
                    <Inline spread="space-between"><span>Auto-engage</span><strong>{selected.policySnapshot.allowAutoEngage ? "Enabled" : "Disabled"}</strong></Inline>
                    <Inline spread="space-between"><span>Min relevance</span><strong>{selected.policySnapshot.minRelevanceScore}</strong></Inline>
                    <Inline spread="space-between"><span>Max promotion risk</span><strong>{selected.policySnapshot.maxPromotionRiskScore}</strong></Inline>
                    <Inline spread="space-between"><span>Links</span><strong>{selected.policySnapshot.allowLinks ? "Allowed" : "Blocked"}</strong></Inline>
                    <Inline spread="space-between"><span>Allowed mention levels</span><strong>{selected.policySnapshot.allowedProductMentionLevels.join(", ")}</strong></Inline>
                  </div>
                </SectionPanel>
                <SectionPanel title="Response text">
                  <TextArea value={selected.responseText || "No response text for this action."} minimumRows={10} isReadOnly />
                </SectionPanel>
                {selected.errorMessage ? (
                  <SectionPanel title="Error">
                    <p>{selected.errorMessage}</p>
                  </SectionPanel>
                ) : null}
              </Stack>
            </ModalBody>
            <ModalFooter><Button appearance="primary" onClick={() => setSelected(undefined)}>Close</Button></ModalFooter>
          </Modal>
        ) : null}
      </ModalTransition>
    </>
  );
}
