import {
  apiSuccess,
  handleDeliberationError
} from "@/lib/deliberation/api-response";
import { listOpportunities } from "@/lib/deliberation/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: { projectId: string };
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    return apiSuccess(await listOpportunities(params.projectId));
  } catch (error) {
    return handleDeliberationError(error);
  }
}
