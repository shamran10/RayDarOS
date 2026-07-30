import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import type { ApiFailure, ApiSuccess } from "@/lib/discovery/contracts";

export class DiscoveryNotFoundError extends Error {}
export class DiscoveryConflictError extends Error {}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, { status });
}

export function apiFailure(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string[]>
) {
  return NextResponse.json<ApiFailure>(
    {
      ok: false,
      error: {
        code,
        message,
        ...(fieldErrors ? { fieldErrors } : {})
      }
    },
    { status }
  );
}

export async function parseMutation<T>(request: Request, schema: z.ZodType<T>) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return {
      success: false as const,
      response: apiFailure(400, "INVALID_JSON", "The request body must be valid JSON.")
    };
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error);
    const fieldErrors = Object.fromEntries(
      Object.entries(flattened.fieldErrors).filter(
        (entry): entry is [string, string[]] => Array.isArray(entry[1])
      )
    );
    return {
      success: false as const,
      response: apiFailure(
        400,
        "VALIDATION_ERROR",
        "Review the highlighted fields and try again.",
        fieldErrors
      )
    };
  }

  return { success: true as const, data: parsed.data };
}

export function handleDiscoveryError(error: unknown) {
  if (error instanceof DiscoveryNotFoundError) {
    return apiFailure(404, "NOT_FOUND", error.message);
  }

  if (error instanceof DiscoveryConflictError) {
    return apiFailure(409, "CONFLICT", error.message);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return apiFailure(409, "CONFLICT", "A record with those unique values already exists.");
    }
    if (error.code === "P2003") {
      return apiFailure(409, "RELATION_CONFLICT", "This record is still referenced by other data.");
    }
    if (error.code === "P2025") {
      return apiFailure(404, "NOT_FOUND", "The requested discovery record was not found.");
    }
  }

  console.error("Discovery API error", error);
  return apiFailure(500, "INTERNAL_ERROR", "Discovery could not complete the request.");
}
