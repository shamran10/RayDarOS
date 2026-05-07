export const agentOutputJsonShape = `{
  "agentName": string,
  "recommendation": string,
  "score": number,
  "argumentFor": string,
  "argumentAgainst": string,
  "riskFlags": string[],
  "reasoning": string
}`;

export const finalJudgeJsonShape = `{
  "selectedAction": string,
  "selectedResponseType": string,
  "productMentionLevel": string,
  "requiresDisclosure": boolean,
  "autoEngageAllowed": boolean,
  "humanApprovalRequired": boolean,
  "finalReasoning": string,
  "approvedDraft": string,
  "blockedReason": string | null
}`;

export const candidateScoreJsonShape = `{
  "relevanceScore": number,
  "intentScore": number,
  "productFitScore": number,
  "engagementValueScore": number,
  "promotionRiskScore": number,
  "communityRiskScore": number,
  "accountSafetyScore": number,
  "responseConfidenceScore": number,
  "skepticObjectionStrength": number,
  "marketInsightValueScore": number
}`;

export const deliberationAgentPrompts = {
  "Opportunity Scout":
    "Argue for engagement. Find relevance, urgency, pain, intent, and why a helpful reply could create value. Return only JSON.",
  "Market Analyst":
    "Assess market intelligence value, audience match, recurring pain, objections, and useful language patterns. Return only JSON.",
  "Product Fit Analyst":
    "Check whether the product genuinely fits. Flag forced mentions, unsupported claims, or missing product knowledge. Return only JSON.",
  "Community Risk Officer":
    "Check community rules, self-promotion risk, link policy, disclosure, tone, thread age, hostility, and account safety. Return only JSON.",
  Skeptic:
    "Argue against engagement with the strongest possible objection. Identify context, fit, trust, promotional, and silence-is-better risks. Return only JSON.",
  "Engagement Strategist":
    "Choose the safest useful posture: helpful-only, clarifying question, soft mention, disclosure, monitor, save as insight, or do not reply. Return only JSON.",
  "Brand Guardian":
    "Review the proposed draft for tone, claims, disclosure, product mention, link usage, authenticity, and repetition. Return only JSON.",
  "Final Judge":
    "Compare all arguments. Decide whether to reply, monitor, save as insight, or block. Explain policy impact and return only JSON."
};

export const aiSafetyRules = [
  "Never generate spam.",
  "Never hide affiliation when recommending the user's own product.",
  "Never make unsupported claims.",
  "Never create fake personal experience.",
  "Never auto-engage with Level 3 or Level 4 product mention.",
  "Never include links in autonomous replies unless explicitly permitted by policy.",
  "Never auto-engage in blocked or high-risk communities.",
  "Never ignore the Skeptic agent.",
  "Never skip Brand Guardian review.",
  "Never skip action logging.",
  "Prefer helpful-only replies when uncertain.",
  "Prefer saving as insight when the thread is useful but engagement is risky.",
  "Prefer do not engage when the context is hostile, sensitive, or promotional risk is high."
];
