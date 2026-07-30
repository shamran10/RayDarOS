"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Button, { LoadingButton } from "@atlaskit/button";
import Banner from "@atlaskit/banner";
import Flag, { FlagGroup } from "@atlaskit/flag";
import Select from "@/components/apple-select";
import SectionMessage from "@atlaskit/section-message";
import Tabs, { Tab, TabList, TabPanel } from "@atlaskit/tabs";
import TextArea from "@atlaskit/textarea";
import Textfield from "@atlaskit/textfield";
import SearchIcon from "@atlaskit/icon/core/search";
import { Box, Inline, Stack } from "@atlaskit/primitives";
import { DiscoveryLoadState } from "@/components/discovery-load-state";
import { Field } from "@/components/field";
import { PageHeading } from "@/components/page-heading";
import { SectionPanel } from "@/components/section-panel";
import { useDiscovery } from "@/lib/discovery/context";
import { useReydar } from "@/lib/store";

export function SignalMonitorScreen() {
  const router = useRouter();
  const { activeProject } = useReydar();
  const { status, error, retry, runManual } = useDiscovery();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [flag, setFlag] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string>();
  const [redditForm, setRedditForm] = useState({
    threadUrl: "",
    community: "",
    notes: ""
  });
  const [rawForm, setRawForm] = useState({
    platform: "Reddit",
    community: "",
    threadTitle: "",
    sourceText: "",
    sourceUrl: ""
  });
  const updateRedditForm = <Key extends keyof typeof redditForm>(
    key: Key,
    value: (typeof redditForm)[Key]
  ) => {
    setRedditForm((current) => ({ ...current, [key]: value }));
  };
  const updateRawForm = <Key extends keyof typeof rawForm>(
    key: Key,
    value: (typeof rawForm)[Key]
  ) => {
    setRawForm((current) => ({ ...current, [key]: value }));
  };

  const analyzeReddit = async (event: FormEvent) => {
    event.preventDefault();
    if (isAnalyzing || !activeProject.id) return;
    setIsAnalyzing(true);
    setOperationError(undefined);
    const titleFromUrl = redditForm.threadUrl.split("/").filter(Boolean).slice(-1)[0]?.replaceAll("_", " ") ?? "Fallback Reddit thread";
    try {
      const result = await runManual(activeProject.id, {
        platform: "Reddit",
        community: redditForm.community || "Unknown subreddit",
        title: titleFromUrl,
        body:
          redditForm.notes ||
          `Fallback Reddit URL submitted for candidate mapping: ${redditForm.threadUrl}. Add raw conversation text for stronger mapping.`,
        url: redditForm.threadUrl
      });
      if (result.run.status === "failed") {
        throw new Error(result.run.errors.join(" ") || "Manual discovery failed.");
      }
      setFlag("Candidate mapped from Reddit URL.");
      const candidateId = result.candidates[0]?.id;
      router.push(candidateId ? `/candidates?candidate=${encodeURIComponent(candidateId)}` : "/candidates");
    } catch (analysisError) {
      setOperationError(
        analysisError instanceof Error
          ? analysisError.message
          : "The Reddit URL could not be mapped."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeRaw = async (event: FormEvent) => {
    event.preventDefault();
    if (isAnalyzing || !activeProject.id) return;
    setIsAnalyzing(true);
    setOperationError(undefined);
    try {
      const result = await runManual(activeProject.id, {
        platform: rawForm.platform,
        community: rawForm.community || "Unknown community",
        title: rawForm.threadTitle || "Raw conversation analysis",
        body: rawForm.sourceText,
        url: rawForm.sourceUrl
      });
      if (result.run.status === "failed") {
        throw new Error(result.run.errors.join(" ") || "Manual discovery failed.");
      }
      setFlag("Candidate mapped from raw conversation.");
      const candidateId = result.candidates[0]?.id;
      router.push(candidateId ? `/candidates?candidate=${encodeURIComponent(candidateId)}` : "/candidates");
    } catch (analysisError) {
      setOperationError(
        analysisError instanceof Error
          ? analysisError.message
          : "The conversation could not be mapped."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <PageHeading
        title="Manual Intake Fallback"
        description="Admin fallback for persisting and mapping one-off URLs or pasted conversations when a source provider cannot scan them."
        breadcrumbs={[{ text: "ReydarOS", href: "/" }, { text: "Manual Intake Fallback", href: "/signal-monitor" }]}
      />

      <Box paddingBlockEnd="space.200">
        <DiscoveryLoadState status={status} error={error} retry={retry} />
        {operationError ? (
          <SectionMessage appearance="error" title="Manual intake failed">
            <p>{operationError}</p>
          </SectionMessage>
        ) : null}
        <Banner appearance="warning">
          Manual intake persists a discovery run, discovered item, and mapped candidate. It does not run deliberation or drafting in Phase 2.
        </Banner>
      </Box>

      <SectionPanel title="Fallback signal intake" description={`Active project: ${activeProject.name}`}>
        <Tabs id="signal-monitor-tabs">
          <TabList>
            <Tab>Reddit URL</Tab>
            <Tab>Raw conversation</Tab>
            <Tab>Future modes</Tab>
          </TabList>
          <TabPanel>
            <form className="signal-intake-form" onSubmit={analyzeReddit}>
              <Stack space="space.200">
                <Inline space="space.200" shouldWrap>
                  <div className="form-field-xl">
                    <Field label="Reddit thread URL" htmlFor="reddit-url">
                      <Textfield
                        id="reddit-url"
                        placeholder="https://www.reddit.com/r/startups/comments/..."
                        value={redditForm.threadUrl}
                        onChange={(event) => updateRedditForm("threadUrl", event.currentTarget.value)}
                        isRequired
                      />
                    </Field>
                  </div>
                  <div className="form-field">
                    <Field label="Optional community name" htmlFor="reddit-community">
                      <Textfield
                        id="reddit-community"
                        placeholder="r/startups"
                        value={redditForm.community}
                        onChange={(event) => updateRedditForm("community", event.currentTarget.value)}
                      />
                    </Field>
                  </div>
                </Inline>
                <Field label="Optional notes or pasted excerpt" htmlFor="reddit-notes">
                  <TextArea
                    id="reddit-notes"
                    value={redditForm.notes}
                    onChange={(event) => updateRedditForm("notes", event.currentTarget.value)}
                    minimumRows={8}
                    placeholder="Paste the thread text or key comments here for stronger MVP analysis."
                  />
                </Field>
                <div className="signal-intake-action-row">
                  <LoadingButton
                    appearance="primary"
                    type="submit"
                    isLoading={isAnalyzing}
                    isDisabled={status !== "ready"}
                    iconBefore={<SearchIcon label="" />}
                  >
                    Analyze Reddit thread
                  </LoadingButton>
                    <span className="small-text muted-text">Creates a persisted discovered item and mapped candidate.</span>
                </div>
              </Stack>
            </form>
          </TabPanel>
          <TabPanel>
            <form className="signal-intake-form" onSubmit={analyzeRaw}>
              <Stack space="space.200">
                <Inline space="space.200" shouldWrap>
                  <div className="form-field">
                    <Field label="Platform">
                      <Select
                        options={["Reddit", "Hacker News", "LinkedIn", "Quora", "Slack", "Other"].map((value) => ({ label: value, value }))}
                        value={{ label: rawForm.platform, value: rawForm.platform }}
                        onChange={(option) => setRawForm((current) => ({ ...current, platform: String(option?.value ?? "Reddit") }))}
                      />
                    </Field>
                  </div>
                  <div className="form-field">
                    <Field label="Community" htmlFor="raw-community">
                      <Textfield
                        id="raw-community"
                        value={rawForm.community}
                        onChange={(event) => updateRawForm("community", event.currentTarget.value)}
                      />
                    </Field>
                  </div>
                  <div className="form-field-wide">
                    <Field label="Thread title" htmlFor="raw-title">
                      <Textfield
                        id="raw-title"
                        value={rawForm.threadTitle}
                        onChange={(event) => updateRawForm("threadTitle", event.currentTarget.value)}
                        isRequired
                      />
                    </Field>
                  </div>
                </Inline>
                <Field label="Conversation text" htmlFor="raw-text">
                  <TextArea
                    id="raw-text"
                    value={rawForm.sourceText}
                    onChange={(event) => updateRawForm("sourceText", event.currentTarget.value)}
                    minimumRows={12}
                    isRequired
                  />
                </Field>
                <Field label="Source URL" htmlFor="source-url">
                  <Textfield
                    id="source-url"
                    value={rawForm.sourceUrl}
                    onChange={(event) => updateRawForm("sourceUrl", event.currentTarget.value)}
                  />
                </Field>
                <LoadingButton
                  appearance="primary"
                  type="submit"
                  isLoading={isAnalyzing}
                  isDisabled={status !== "ready"}
                  iconBefore={<SearchIcon label="" />}
                >
                  Run fallback intake
                </LoadingButton>
              </Stack>
            </form>
          </TabPanel>
          <TabPanel>
            <div className="dense-grid">
              {[
                "Automated subreddit monitoring",
                "Keyword monitoring",
                "Competitor monitoring",
                "Semantic discovery",
                "Slack alerts",
                "LinkedIn monitoring",
                "Hacker News monitoring",
                "Quora monitoring"
              ].map((mode) => (
                <div className="panel-muted" key={mode}>
                  <Box padding="space.150">
                    <Inline spread="space-between">
                      <span>{mode}</span>
                      <Button isDisabled>Future</Button>
                    </Inline>
                  </Box>
                </div>
              ))}
            </div>
          </TabPanel>
        </Tabs>
      </SectionPanel>

      <FlagGroup onDismissed={() => setFlag(null)}>
        {flag ? <Flag id="signal-created" title="Mapping complete" description={flag} appearance="success" /> : null}
      </FlagGroup>
    </>
  );
}
