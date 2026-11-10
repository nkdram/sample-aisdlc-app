import { formatErrorLogLine } from "@/lib/report-error";

/**
 * The seam a real error collector can replace later: log one JSON line, always
 * answer 204 so a client reporter never sees a failure it has to handle.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  console.error(formatErrorLogLine(body));
  return new Response(null, { status: 204 });
}
