import {
  apiSuccess,
  handleDeliberationError,
  parseMutation
} from "@/lib/deliberation/api-response";
import { startDeliberationSchema } from "@/lib/deliberation/contracts";
import { startCandidate } from "@/lib/deliberation/service";

export const runtime = "nodejs";

interface RouteContext {
  params: { projectId: string; candidateId: string };
}

export async function POST(request: Request, { params }: RouteContext) {
  const parsed = await parseMutation(request, startDeliberationSchema);
  if (!parsed.success) return parsed.response;

  try {
    const result = await startCandidate(
      params.projectId,
      params.candidateId,
      parsed.data
    );
    return apiSuccess(result, result.reused ? 200 : 201);
  } catch (error) {
    return handleDeliberationError(error);
  }
}
