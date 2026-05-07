import type { AutonomyPolicy, ReydarState } from "@/lib/types";

const now = "2026-05-06T15:30:00.000Z";

const defaultThe925Policy: AutonomyPolicy = {
  id: "policy-the925-default",
  projectId: "project-the925",
  name: "The925 default autonomy policy",
  allowAutoEngage: false,
  maxCommentsPerDay: 3,
  maxCommentsPerCommunityPerDay: 1,
  maxProductMentionsPerWeek: 1,
  allowedProductMentionLevels: [0, 1],
  allowLinks: false,
  requireDisclosure: true,
  minRelevanceScore: 85,
  minIntentScore: 75,
  minProductFitScore: 75,
  minEngagementValueScore: 70,
  maxPromotionRiskScore: 30,
  maxCommunityRiskScore: 35,
  minAccountSafetyScore: 80,
  maxSkepticObjectionStrength: 40,
  allowedCandidateTypes: [
    "original_post",
    "top_comment",
    "recent_comment",
    "nested_reply",
    "unanswered_question",
    "tool_request",
    "pain_point",
    "implementation_question",
    "buying_intent",
    "market_insight_only"
  ],
  blockedCandidateTypes: ["negative_sentiment"],
  isActive: true,
  createdAt: now,
  updatedAt: now
};

const reydarosPolicy: AutonomyPolicy = {
  ...defaultThe925Policy,
  id: "policy-reydaros-default",
  projectId: "project-reydaros",
  name: "ReydarOS default autonomy policy",
  createdAt: now,
  updatedAt: now
};

export const initialState: ReydarState = {
  activeProjectId: "project-the925",
  projects: [
    {
      id: "project-the925",
      name: "The925",
      productType: "AI-powered workflow and employee operations platform",
      productDescription:
        "A lightweight operational workflow platform for teams that are too big for spreadsheets but not ready for heavy ERP systems.",
      primaryObjective:
        "Discover conversations where growing teams struggle with internal workflows, onboarding, approvals, HR operations, and spreadsheet-based processes.",
      engagementGoal:
        "Provide helpful advice, identify potential leads, and mention The925 only when context allows.",
      brandAccountName: "the925_io",
      websiteUrl: "https://the925.ai",
      targetAudience: "Founders, operations managers, HR leads, startup teams, and growing businesses.",
      defaultTone: "Helpful, practical, calm, founder-led when disclosure is useful.",
      productMentionPolicy:
        "Default to helpful-only guidance. Mention The925 only when the user is explicitly evaluating workflow software or asks for tool recommendations.",
      riskTolerance: "medium",
      status: "active",
      connectedAccount: "u/the925_io",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "project-suits",
      name: "SUITS",
      productType: "Professional services workflow and document intelligence suite",
      productDescription:
        "A knowledge-backed workspace for service teams handling client work, proposals, contracts, and delivery operations.",
      primaryObjective:
        "Find operational conversations about proposal bottlenecks, client handoffs, and professional-services delivery visibility.",
      engagementGoal: "Share structured advice and capture market language around services workflows.",
      brandAccountName: "suits_ops",
      websiteUrl: "https://suits.build",
      targetAudience: "Consultants, boutique agencies, implementation partners, and operations leads.",
      defaultTone: "Precise, understated, operational.",
      productMentionPolicy: "Mention only with disclosure when the thread requests tools for services operations.",
      riskTolerance: "medium",
      status: "active",
      connectedAccount: "u/suits_ops",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "project-polaris",
      name: "Polaris by BUOST",
      productType: "AI decision support and operational intelligence product",
      productDescription:
        "A BUOST product for turning scattered operational data into direction, prioritization, and decision support.",
      primaryObjective:
        "Identify teams discussing operational fog, poor prioritization, and fragmented reporting.",
      engagementGoal: "Learn from pain points and respond with non-promotional frameworks first.",
      brandAccountName: "buost_ai",
      websiteUrl: "https://buost.ai/polaris",
      targetAudience: "Founders, operators, strategy leads, and transformation teams.",
      defaultTone: "Strategic but grounded.",
      productMentionPolicy: "Keep product mentions rare. Prefer insight capture unless the user asks about decision systems.",
      riskTolerance: "low",
      status: "active",
      connectedAccount: "u/buost_ai",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "project-readiness",
      name: "BUOST AI Readiness",
      productType: "AI readiness assessment and advisory service",
      productDescription:
        "A readiness diagnostic for organizations deciding where AI can be adopted safely and practically.",
      primaryObjective:
        "Find conversations about AI adoption confusion, tool sprawl, governance questions, and workflow readiness.",
      engagementGoal: "Offer practical readiness advice and capture concerns by role and industry.",
      brandAccountName: "buost_ai",
      websiteUrl: "https://buost.ai/readiness",
      targetAudience: "Executives, department heads, transformation teams, and operations leaders.",
      defaultTone: "Advisory, sober, non-hype.",
      productMentionPolicy: "Avoid service pitches unless the user directly asks how to assess readiness.",
      riskTolerance: "low",
      status: "active",
      connectedAccount: "u/buost_ai",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "project-reydaros",
      name: "ReydarOS",
      productType: "Engagement intelligence operating system",
      productDescription:
        "An AI-powered engagement operating system for discovering conversations, deciding whether to engage, drafting safe responses, and preserving market intelligence.",
      primaryObjective:
        "Learn how founders, marketers, and operators discuss community engagement, Reddit risk, and market intelligence workflows.",
      engagementGoal: "Build a careful internal loop for judgment, restraint, and learning.",
      brandAccountName: "reydaros",
      websiteUrl: "https://reydaros.local",
      targetAudience: "Internal operators, founders, and product teams.",
      defaultTone: "Measured, transparent, knowledge-backed.",
      productMentionPolicy: "Never imply automation or mass posting. Emphasize human review and safety.",
      riskTolerance: "low",
      status: "active",
      connectedAccount: "u/reydaros",
      createdAt: now,
      updatedAt: now
    }
  ],
  productKnowledge: [
    {
      id: "pk-the925-overview",
      projectId: "project-the925",
      category: "Product overview",
      title: "The925 positioning",
      content:
        "The925 helps growing teams move internal operations out of spreadsheets and chat threads into lightweight workflows across onboarding, leave, expense claims, approvals, and ownership.",
      source: "Seed brief",
      status: "approved",
      health: "strong",
      approved: true,
      restricted: false,
      confidence: 0.92,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "pk-the925-flow",
      projectId: "project-the925",
      category: "Core features",
      title: "Flow Engine",
      content:
        "Flow Engine supports structured internal request and approval workflows with ownership, visibility, and repeatable steps.",
      source: "Seed brief",
      status: "approved",
      health: "strong",
      approved: true,
      restricted: false,
      confidence: 0.9,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "pk-the925-restricted",
      projectId: "project-the925",
      category: "Restricted claims",
      title: "Avoid guaranteed ROI claims",
      content:
        "Do not claim The925 guarantees cost savings, compliance outcomes, or replacement of enterprise ERP without approved proof.",
      source: "Internal guardrail",
      status: "restricted",
      health: "strong",
      approved: false,
      restricted: true,
      confidence: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "pk-suits-overview",
      projectId: "project-suits",
      category: "Product overview",
      title: "Services operations workspace",
      content: "SUITS helps professional services teams organize client delivery, documents, proposals, and operational knowledge.",
      source: "Seed brief",
      status: "draft",
      health: "needs_review",
      approved: false,
      restricted: false,
      confidence: 0.7,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "pk-reydaros-overview",
      projectId: "project-reydaros",
      category: "Product overview",
      title: "Know where to engage",
      content:
        "ReydarOS decides where to engage, what to say, and when to stay silent. It is not a mass-commenting bot and requires human review.",
      source: "Product philosophy",
      status: "approved",
      health: "strong",
      approved: true,
      restricted: false,
      confidence: 0.95,
      createdAt: now,
      updatedAt: now
    }
  ],
  marketKnowledge: [
    {
      id: "mk-the925-spreadsheets",
      projectId: "project-the925",
      category: "Common pain points",
      title: "Teams outgrowing spreadsheets",
      content:
        "Growing teams often keep onboarding, leave, expenses, and approvals in spreadsheets until ownership and visibility break down.",
      source: "Seed brief",
      status: "approved",
      health: "strong",
      approved: true,
      confidence: 0.9,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "mk-the925-slack",
      projectId: "project-the925",
      category: "Audience language",
      title: "Requests buried in Slack",
      content:
        "Audience phrases include 'lost in Slack', 'approval bottleneck', 'no one owns it', 'spreadsheet chaos', and 'too small for ERP'.",
      source: "Seed brief",
      status: "approved",
      health: "strong",
      approved: true,
      confidence: 0.85,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "mk-readiness-governance",
      projectId: "project-readiness",
      category: "Decision-maker concerns",
      title: "AI governance before tooling",
      content:
        "Leaders often need clarity on process readiness, data ownership, and governance before selecting AI tools.",
      source: "Seed brief",
      status: "draft",
      health: "sparse",
      approved: false,
      confidence: 0.68,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "mk-reydaros-reddit-risk",
      projectId: "project-reydaros",
      category: "Community behavior patterns",
      title: "Reddit distrusts vendor drive-bys",
      content:
        "Reddit communities tend to punish drive-by vendor comments. Helpful context, disclosure, and restraint matter more than volume.",
      source: "Seed brief",
      status: "approved",
      health: "strong",
      approved: true,
      confidence: 0.9,
      createdAt: now,
      updatedAt: now
    }
  ],
  communityRules: [
    {
      id: "cr-startups",
      projectId: "project-the925",
      communityName: "r/startups",
      platform: "Reddit",
      topic: "Startup operations, hiring, founder questions",
      allowedContentTypes: "Founder experience, practical advice, frameworks, clarifying questions.",
      selfPromotionPolicy: "Self-promotion is sensitive and should only appear when explicitly requested.",
      linkPolicy: "Links are discouraged unless directly asked for.",
      vendorParticipationRules: "Vendors should disclose affiliation and avoid lead capture.",
      disclosureExpectations: "Disclosure required for product or company mentions.",
      tonePreference: "Direct, specific, low-hype.",
      riskLevel: "medium",
      moderatorSensitivity: "Moderate",
      productMentionTolerance: "low",
      previousSuccessfulComments: "Helpful checklist-style comments without links.",
      previousRemovals: "One comment removed for including a product link too early.",
      previousNegativeReactions: "Pushback when the comment sounded like a pitch.",
      recommendedReplyStyle: "Practical steps first. Product mention only if asked for tools.",
      minimumAccountAgeOrKarma: "Unknown",
      engagementFrequencyHistory: "Keep to no more than two high-quality replies per week.",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "cr-humanresources",
      projectId: "project-the925",
      communityName: "r/humanresources",
      platform: "Reddit",
      topic: "HR operations and employee processes",
      allowedContentTypes: "Operational advice, policy considerations, peer discussion.",
      selfPromotionPolicy: "Vendor content is high risk.",
      linkPolicy: "No links unless requested.",
      vendorParticipationRules: "Disclosure required. Avoid acting like a neutral practitioner.",
      disclosureExpectations: "Required for affiliation or product mentions.",
      tonePreference: "Professional and careful.",
      riskLevel: "high",
      moderatorSensitivity: "High",
      productMentionTolerance: "low",
      previousSuccessfulComments: "General process advice with no product mention.",
      previousRemovals: "None recorded.",
      previousNegativeReactions: "None recorded.",
      recommendedReplyStyle: "Helpful-only or clarifying question.",
      minimumAccountAgeOrKarma: "Unknown",
      engagementFrequencyHistory: "Very low frequency.",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "cr-saas",
      projectId: "project-reydaros",
      communityName: "r/SaaS",
      platform: "Reddit",
      topic: "SaaS growth, GTM, product, and operations",
      allowedContentTypes: "Founder lessons, tool comparisons, tactical advice.",
      selfPromotionPolicy: "Moderate risk. Disclosure expected.",
      linkPolicy: "Links should be avoided unless requested.",
      vendorParticipationRules: "Founder-led disclosure is acceptable when relevant.",
      disclosureExpectations: "Required for own-product recommendations.",
      tonePreference: "Specific, not theatrical.",
      riskLevel: "medium",
      moderatorSensitivity: "Moderate",
      productMentionTolerance: "medium",
      previousSuccessfulComments: "Founder-disclosed comments that explain tradeoffs.",
      previousRemovals: "None recorded.",
      previousNegativeReactions: "Skepticism when comments overstate automation.",
      recommendedReplyStyle: "Lead with judgment and risk, not tooling.",
      minimumAccountAgeOrKarma: "Unknown",
      engagementFrequencyHistory: "Two comments per week maximum until trust improves.",
      createdAt: now,
      updatedAt: now
    }
  ],
  signalSources: [
    {
      id: "source-the925-startups",
      projectId: "project-the925",
      platform: "Reddit",
      sourceType: "mock",
      communityName: "r/startups",
      sourceUrl: "https://reddit.com/r/startups",
      keywords: ["onboarding", "approvals", "workflow", "operations"],
      competitorTerms: ["spreadsheet", "Google Sheets", "Airtable"],
      painPointTerms: ["ownership", "approval bottlenecks", "lost in Slack"],
      excludedTerms: ["job posting", "fundraising announcement"],
      scanFrequency: "Daily",
      riskTolerance: "medium",
      isActive: true,
      lastScannedAt: now,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "source-reydaros-saas",
      projectId: "project-reydaros",
      platform: "Reddit",
      sourceType: "mock",
      communityName: "r/SaaS",
      sourceUrl: "https://reddit.com/r/SaaS",
      keywords: ["reddit marketing", "community engagement", "founder-led growth"],
      competitorTerms: ["manual monitoring", "social listening", "alerts"],
      painPointTerms: ["self-promotion risk", "where to reply", "market intelligence"],
      excludedTerms: ["growth hack", "mass commenting"],
      scanFrequency: "Twice weekly",
      riskTolerance: "low",
      isActive: true,
      lastScannedAt: now,
      createdAt: now,
      updatedAt: now
    }
  ],
  discoveryRuns: [
    {
      id: "run-the925-startups-001",
      projectId: "project-the925",
      signalSourceId: "source-the925-startups",
      status: "completed",
      startedAt: now,
      completedAt: now,
      itemsFound: 2,
      candidatesCreated: 2,
      errors: [],
      createdAt: now,
      updatedAt: now
    }
  ],
  discoveredItems: [
    {
      id: "discovered-the925-approval-thread",
      projectId: "project-the925",
      discoveryRunId: "run-the925-startups-001",
      platform: "Reddit",
      community: "r/startups",
      sourceType: "mock",
      externalId: "reddit-thread-approval-001",
      authorHandle: "u/ops_overload",
      title: "Approval requests are disappearing after employee 30",
      body:
        "We grew past 30 people and approvals are still Slack messages plus a sheet. People miss handoffs, nobody knows who owns the next step, and we need a lightweight process before buying a huge suite.",
      url: "https://reddit.com/r/startups/comments/mock-approval-001",
      score: 142,
      replyCount: 28,
      publishedAt: now,
      rawJson: { provider: "mock", source: "seed" },
      createdAt: now,
      updatedAt: now
    },
    {
      id: "discovered-the925-nested-question",
      projectId: "project-the925",
      discoveryRunId: "run-the925-startups-001",
      platform: "Reddit",
      community: "r/startups",
      sourceType: "mock",
      externalId: "reddit-comment-owner-002",
      parentExternalId: "reddit-thread-approval-001",
      authorHandle: "u/founder_asking",
      title: "Nested question about ownership",
      body:
        "Has anyone solved ownership tracking without asking every manager to live inside Jira? I want the lightest version that still makes blocked approvals visible.",
      url: "https://reddit.com/r/startups/comments/mock-approval-001/comment/mock-owner-002",
      score: 64,
      replyCount: 0,
      publishedAt: now,
      rawJson: { provider: "mock", source: "seed" },
      createdAt: now,
      updatedAt: now
    }
  ],
  conversationCandidates: [
    {
      id: "candidate-the925-approval-thread",
      projectId: "project-the925",
      discoveredItemId: "discovered-the925-approval-thread",
      platform: "Reddit",
      community: "r/startups",
      sourceType: "mock",
      externalId: "reddit-thread-approval-001",
      authorHandle: "u/ops_overload",
      title: "Approval requests are disappearing after employee 30",
      body:
        "We grew past 30 people and approvals are still Slack messages plus a sheet. People miss handoffs, nobody knows who owns the next step, and we need a lightweight process before buying a huge suite.",
      url: "https://reddit.com/r/startups/comments/mock-approval-001",
      candidateType: "tool_request",
      detectedIntent: "Tool evaluation",
      detectedPainPoint: "Approval bottlenecks",
      competitorMentioned: "spreadsheet",
      productCategoryMentioned: "workflow",
      candidateSummary: "Founder asks how to fix approvals and ownership before selecting software.",
      initialRelevanceScore: 91,
      initialIntentScore: 82,
      initialRiskScore: 48,
      status: "queued_for_approval",
      whyWorthAnalyzing:
        "The thread contains explicit operational pain and tool intent, but community self-promotion risk requires deliberation.",
      recommendedNextStep: "Review deliberation and approve a helpful-only or low-mention response.",
      createdAt: now,
      updatedAt: now
    },
    {
      id: "candidate-the925-owner-question",
      projectId: "project-the925",
      discoveredItemId: "discovered-the925-nested-question",
      platform: "Reddit",
      community: "r/startups",
      sourceType: "mock",
      externalId: "reddit-comment-owner-002",
      parentExternalId: "reddit-thread-approval-001",
      authorHandle: "u/founder_asking",
      title: "Nested question about ownership",
      body:
        "Has anyone solved ownership tracking without asking every manager to live inside Jira? I want the lightest version that still makes blocked approvals visible.",
      url: "https://reddit.com/r/startups/comments/mock-approval-001/comment/mock-owner-002",
      candidateType: "unanswered_question",
      detectedIntent: "Implementation help",
      detectedPainPoint: "Unclear ownership and handoffs",
      competitorMentioned: "Jira",
      productCategoryMentioned: "workflow",
      candidateSummary: "Unanswered nested question asks for a lightweight way to track ownership and blocked approvals.",
      initialRelevanceScore: 88,
      initialIntentScore: 79,
      initialRiskScore: 42,
      status: "mapped",
      whyWorthAnalyzing: "This is a better entry point than the original post because it asks a specific implementation question.",
      recommendedNextStep: "Run deliberation before drafting.",
      createdAt: now,
      updatedAt: now
    }
  ],
  deliberationRuns: [
    {
      id: "delib-the925-approval-thread",
      projectId: "project-the925",
      candidateId: "candidate-the925-approval-thread",
      status: "completed",
      finalDecision: "helpful_only_reply",
      finalConfidence: 82,
      autonomyStatus: "needs_human_approval",
      createdAt: now,
      updatedAt: now
    }
  ],
  deliberationAgentResults: [
    {
      id: "agent-the925-scout",
      deliberationRunId: "delib-the925-approval-thread",
      agentName: "Opportunity Scout",
      recommendation: "Analyze for engagement",
      score: 91,
      argumentFor: "The post describes urgent approval and ownership pain in a growing team.",
      argumentAgainst: "The thread is not explicitly asking vendors to respond.",
      riskFlags: [],
      reasoning: "Engagement could help if the reply stays practical and avoids a product pitch.",
      createdAt: now
    },
    {
      id: "agent-the925-market",
      deliberationRunId: "delib-the925-approval-thread",
      agentName: "Market Analyst",
      recommendation: "Capture market learning",
      score: 86,
      argumentFor: "The phrasing around hidden handoffs is strong market language.",
      argumentAgainst: "The pain point is known and may not require a reply.",
      riskFlags: [],
      reasoning: "Save the language even if no engagement happens.",
      createdAt: now
    },
    {
      id: "agent-the925-fit",
      deliberationRunId: "delib-the925-approval-thread",
      agentName: "Product Fit Analyst",
      recommendation: "Product fit is plausible",
      score: 84,
      argumentFor: "The925 maps to ownership, approvals, and lightweight workflows.",
      argumentAgainst: "A product mention would be premature unless the user asks for recommendations.",
      riskFlags: ["Keep product mention at Level 0 or Level 1"],
      reasoning: "Product fit is real, but product insertion is not needed.",
      createdAt: now
    },
    {
      id: "agent-the925-risk",
      deliberationRunId: "delib-the925-approval-thread",
      agentName: "Community Risk Officer",
      recommendation: "Approval gate required",
      score: 56,
      argumentFor: "A no-link helpful reply can respect r/startups norms.",
      argumentAgainst: "r/startups is sensitive to self-promotion and links.",
      riskFlags: ["Disclosure required if affiliation appears", "No links"],
      reasoning: "Community policy should keep this out of auto-engagement.",
      createdAt: now
    },
    {
      id: "agent-the925-skeptic",
      deliberationRunId: "delib-the925-approval-thread",
      agentName: "Skeptic",
      recommendation: "Do not assume a reply is welcome",
      score: 52,
      argumentFor: "Silence may be better than a vendor-shaped answer.",
      argumentAgainst: "A process-only answer could still help the founder.",
      riskFlags: ["Promotion risk", "Context risk"],
      reasoning: "The strongest objection is that vendors often overestimate relevance in startup forums.",
      createdAt: now
    },
    {
      id: "agent-the925-strategy",
      deliberationRunId: "delib-the925-approval-thread",
      agentName: "Engagement Strategist",
      recommendation: "Helpful-only reply",
      score: 78,
      argumentFor: "A practical framework answers the question while protecting trust.",
      argumentAgainst: "Do not include The925 unless asked.",
      riskFlags: [],
      reasoning: "Best move is a helpful-only reply routed through review.",
      createdAt: now
    },
    {
      id: "agent-the925-brand",
      deliberationRunId: "delib-the925-approval-thread",
      agentName: "Brand Guardian",
      recommendation: "Draft tone approved",
      score: 82,
      argumentFor: "The draft avoids links, hype, and fake personal experience.",
      argumentAgainst: "A product name would make the comment feel less natural.",
      riskFlags: [],
      reasoning: "Brand Guardian approves only the Level 0 draft.",
      createdAt: now
    },
    {
      id: "agent-the925-judge",
      deliberationRunId: "delib-the925-approval-thread",
      agentName: "Final Judge",
      recommendation: "Helpful-only reply",
      score: 82,
      argumentFor: "Engagement has value if it stays process-led.",
      argumentAgainst: "Policy blocks auto-engagement because risk thresholds are not all satisfied.",
      riskFlags: ["Human approval required"],
      reasoning: "Final decision is queue for approval, not automatic posting.",
      createdAt: now
    }
  ],
  candidateScores: [
    {
      id: "score-the925-approval-thread",
      projectId: "project-the925",
      candidateId: "candidate-the925-approval-thread",
      deliberationRunId: "delib-the925-approval-thread",
      relevanceScore: 91,
      intentScore: 82,
      productFitScore: 84,
      engagementValueScore: 78,
      promotionRiskScore: 42,
      communityRiskScore: 48,
      accountSafetyScore: 78,
      responseConfidenceScore: 82,
      skepticObjectionStrength: 52,
      marketInsightValueScore: 86,
      createdAt: now
    }
  ],
  finalDecisions: [
    {
      id: "decision-the925-approval-thread",
      deliberationRunId: "delib-the925-approval-thread",
      candidateId: "candidate-the925-approval-thread",
      selectedAction: "helpful_only_reply",
      selectedResponseType: "detailed_practical",
      productMentionLevel: 0,
      requiresDisclosure: false,
      autoEngageAllowed: false,
      humanApprovalRequired: true,
      finalReasoning:
        "Helpful engagement is justified, but r/startups risk, promotion risk, account safety, and Skeptic strength prevent autonomous action.",
      approvedDraft:
        "I would separate this into three things: who owns each approval, where the request is visible when it is blocked, and what escalation happens when the owner is waiting on someone else. If those are fuzzy, a bigger tool usually just moves the confusion somewhere more expensive.\n\nA practical first pass is to map five recent requests, mark the exact step where each one stalled, and assign one owner per state before changing software.",
      policyResult:
        "The925 default autonomy policy requires restraint: Autonomy policy disables auto-engagement by default. Promotion risk exceeds policy threshold. Community risk exceeds policy threshold. Account safety score is below policy threshold. Skeptic objection strength exceeds policy threshold.",
      createdAt: now
    }
  ],
  autonomyPolicies: [defaultThe925Policy, reydarosPolicy],
  autonomousActionLogs: [
    {
      id: "action-the925-approval-thread",
      projectId: "project-the925",
      candidateId: "candidate-the925-approval-thread",
      deliberationRunId: "delib-the925-approval-thread",
      finalDecisionId: "decision-the925-approval-thread",
      actionType: "queue_for_approval",
      actionStatus: "pending",
      platform: "Reddit",
      community: "r/startups",
      responseText:
        "I would separate this into three things: who owns each approval, where the request is visible when it is blocked, and what escalation happens when the owner is waiting on someone else. If those are fuzzy, a bigger tool usually just moves the confusion somewhere more expensive.\n\nA practical first pass is to map five recent requests, mark the exact step where each one stalled, and assign one owner per state before changing software.",
      policySnapshot: defaultThe925Policy,
      reason: "Queued for human approval because the default autonomy policy blocks auto-engagement.",
      createdAt: now,
      updatedAt: now
    }
  ],
  opportunities: [
    {
      id: "opp-onboarding-spreadsheet",
      projectId: "project-the925",
      platform: "Reddit",
      community: "r/startups",
      threadTitle: "How are you managing onboarding after hiring employee 25?",
      threadUrl: "https://reddit.com/r/startups/example-onboarding",
      sourceText:
        "We just crossed 25 employees and onboarding is still a Google Sheet plus Slack reminders. People miss steps, managers ask HR the same things, and approvals take days.",
      conversationSummary:
        "A founder is looking for a practical way to replace spreadsheet-based onboarding and scattered Slack reminders.",
      userProblem:
        "The team has outgrown manual onboarding coordination and needs clearer ownership, repeatable steps, and visibility.",
      painPoint: "Employee onboarding managed through spreadsheets",
      audienceMatch:
        "Strong match: founder of a growing team with internal workflow pain and HR operations complexity.",
      productFitExplanation:
        "The925 fits because onboarding workflows, approvals, and ownership are core product areas. A product mention is possible, but the community has low tolerance for promotion.",
      intentLevel: "high",
      riskLevel: "medium",
      recommendedAction: "helpful_with_soft_disclosure",
      responseType: "detailed_practical",
      productMentionLevel: 2,
      reasoning:
        "The thread asks for operational advice and likely tool/process options. Start with a checklist and disclose affiliation only if mentioning The925.",
      status: "draft_ready",
      scores: {
        relevanceScore: 94,
        intentScore: 88,
        productFitScore: 91,
        engagementValueScore: 86,
        promotionRiskScore: 54,
        communityRiskScore: 48,
        accountSafetyScore: 76,
        responseConfidenceScore: 84
      },
      createdAt: now,
      updatedAt: now
    },
    {
      id: "opp-ai-readiness",
      projectId: "project-readiness",
      platform: "Reddit",
      community: "r/operations",
      threadTitle: "Everyone wants AI but our processes are a mess",
      threadUrl: "https://reddit.com/r/operations/example-ai-readiness",
      sourceText:
        "Leadership is pushing AI tools but every team has different data, no clear process owners, and no one agrees what should be automated first.",
      conversationSummary:
        "An operator is worried that AI tooling is being adopted before process ownership and data readiness are clear.",
      userProblem:
        "The organization needs an AI readiness sequence before choosing tools.",
      painPoint: "AI adoption confusion",
      audienceMatch: "Strong match with transformation and operations leaders.",
      productFitExplanation:
        "BUOST AI Readiness can help, but a service mention would be risky unless the user asks for assessment help.",
      intentLevel: "medium",
      riskLevel: "low",
      recommendedAction: "helpful_answer_only",
      responseType: "helpful_only",
      productMentionLevel: 0,
      reasoning:
        "The best engagement is a helpful readiness checklist. Product or service mention is unnecessary.",
      status: "analyzed",
      scores: {
        relevanceScore: 86,
        intentScore: 72,
        productFitScore: 78,
        engagementValueScore: 80,
        promotionRiskScore: 28,
        communityRiskScore: 30,
        accountSafetyScore: 88,
        responseConfidenceScore: 82
      },
      createdAt: now,
      updatedAt: now
    }
  ],
  responseDrafts: [
    {
      id: "draft-onboarding-practical",
      opportunityId: "opp-onboarding-spreadsheet",
      responseText:
        "A good first move is to separate the onboarding sheet into three things: a reusable workflow, role-specific checklists, and a visible owner for each step. The failure mode is usually not the sheet itself, but that nobody can tell what is blocked, who owns the next step, or whether approvals are waiting on HR, IT, finance, or the manager.\n\nI would map the current sheet into stages, assign a single owner to each stage, add due dates for the handoffs, and review the first five hires after the change to see where it still breaks. If you later look at tools, prioritize lightweight workflow ownership over a heavy HR suite.\n\nDisclosure: I work on The925, which is in this workflow/employee-ops space, so I am biased toward fixing ownership and handoffs before buying a big system.",
      responseType: "detailed_practical",
      productMentionLevel: 2,
      disclosureIncluded: true,
      riskLevel: "medium",
      reasoning:
        "The draft leads with practical advice, includes disclosure, avoids links, and keeps the product mention soft.",
      status: "draft",
      editedByUser: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "draft-ai-readiness",
      opportunityId: "opp-ai-readiness",
      responseText:
        "I would pause tool selection and make a simple readiness map first: which process is painful, who owns it, what data it needs, what can go wrong, and what a safe human review step looks like. The best first AI workflow is usually narrow, repetitive, and already understood by the team. If ownership is unclear before automation, AI usually just makes the confusion faster.",
      responseType: "helpful_only",
      productMentionLevel: 0,
      disclosureIncluded: false,
      riskLevel: "low",
      reasoning: "Helpful-only response with no service mention keeps trust high while capturing the insight.",
      status: "draft",
      editedByUser: false,
      createdAt: now,
      updatedAt: now
    }
  ],
  guardrailChecks: [
    {
      id: "guard-onboarding-disclosure",
      opportunityId: "opp-onboarding-spreadsheet",
      responseDraftId: "draft-onboarding-practical",
      checkType: "Disclosure requirements",
      description: "Soft affiliation mention includes disclosure, satisfying the community rule.",
      severity: "medium",
      action: "require_disclosure",
      passed: true,
      createdAt: now
    },
    {
      id: "guard-onboarding-link",
      opportunityId: "opp-onboarding-spreadsheet",
      responseDraftId: "draft-onboarding-practical",
      checkType: "Link usage",
      description: "No product link included. This matches the restricted link policy.",
      severity: "low",
      action: "remove_link",
      passed: true,
      createdAt: now
    }
  ],
  marketInsights: [
    {
      id: "insight-onboarding-ownership",
      projectId: "project-the925",
      opportunityId: "opp-onboarding-spreadsheet",
      category: "Recurring pain points",
      title: "Onboarding breaks at ownership handoffs",
      insight:
        "Founders describe onboarding pain less as missing documentation and more as unclear ownership between HR, IT, finance, and managers.",
      source: "https://reddit.com/r/startups/example-onboarding",
      confidence: 0.86,
      approved: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "insight-ai-process-first",
      projectId: "project-readiness",
      opportunityId: "opp-ai-readiness",
      category: "Buying triggers",
      title: "AI readiness starts with process ownership",
      insight:
        "Operators resist AI adoption when leadership starts with tools before identifying process owners, data readiness, and human review points.",
      source: "https://reddit.com/r/operations/example-ai-readiness",
      confidence: 0.79,
      approved: false,
      createdAt: now,
      updatedAt: now
    }
  ],
  engagementOutcomes: [
    {
      id: "outcome-onboarding-saved",
      opportunityId: "opp-onboarding-spreadsheet",
      responseDraftId: "draft-onboarding-practical",
      outcomeType: "saved_as_insight",
      notes: "Saved pain point for messaging; reply still awaiting review.",
      createdAt: now
    }
  ],
  activityLogs: [
    {
      id: "activity-seed",
      projectId: "project-the925",
      entityType: "Opportunity",
      entityId: "opp-onboarding-spreadsheet",
      action: "analysis.created",
      message: "DARM analysis created a high-priority onboarding opportunity.",
      createdAt: now
    }
  ]
};
