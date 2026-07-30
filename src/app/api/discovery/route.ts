import { apiSuccess, handleDiscoveryError } from "@/lib/discovery/api-response";
import { getDiscoverySnapshot } from "@/lib/discovery/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return apiSuccess(await getDiscoverySnapshot());
  } catch (error) {
    return handleDiscoveryError(error);
  }
}
