import { NextResponse } from "next/server";
import { runHeuristicDarmAnalysis } from "@/lib/darm";
import type { AnalysisInput } from "@/lib/types";

const systemPrompt = `You are ReydarOS, an engagement intelligence system. Decide whether a brand should engage with a public online conversation. Prioritize helpfulness, community trust, accuracy, and safety over promotion. Return compact JSON with conversationSummary, userProblem, relevantPainPoints, audienceMatch, productFitExplanation, scores, recommendedAction, responseType, productMentionLevel, guardrailWarnings, suggestedResponses, reasoning, insightCandidates, and doNotReplyReason if applicable.`;

export async function POST(request: Request) {
  const input = (await request.json()) as AnalysisInput;
  const heuristic = runHeuristicDarmAnalysis(input);

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      mode: "heuristic",
      ...heuristic
    });
  }

  try {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";
    const response = await client.responses.create({
      model,
      input: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: JSON.stringify({
            project: input.project,
            productKnowledge: input.productKnowledge,
            marketKnowledge: input.marketKnowledge,
            communityRules: input.communityRules,
            conversation: {
              platform: input.platform,
              community: input.community,
              threadTitle: input.threadTitle,
              threadUrl: input.threadUrl,
              sourceText: input.sourceText,
              notes: input.notes
            }
          })
        }
      ],
      text: {
        format: {
          type: "json_object"
        }
      }
    } as never);

    const outputText =
      (response as { output_text?: string }).output_text ??
      JSON.stringify({ reasoning: heuristic.opportunity.reasoning });
    const parsed = JSON.parse(outputText) as { reasoning?: string };

    return NextResponse.json({
      mode: "openai",
      ...heuristic,
      opportunity: {
        ...heuristic.opportunity,
        reasoning: parsed.reasoning ?? heuristic.opportunity.reasoning
      },
      model
    });
  } catch (error) {
    return NextResponse.json(
      {
        mode: "heuristic_fallback",
        error: error instanceof Error ? error.message : "OpenAI analysis failed",
        ...heuristic
      },
      { status: 200 }
    );
  }
}
