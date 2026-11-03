import { type NextRequest, NextResponse } from "next/server";

/**
 * The Backend for Frontend. Every `/api/v1/*` call the browser makes lands here,
 * on our own Node server, and is forwarded to the real backend. The browser
 * never sees the backend URL, and the session cookie stays first party: this
 * handler carries the incoming cookie upstream and passes any `Set-Cookie` from
 * the backend straight back, so login and logout work without CORS or
 * `SameSite=None`.
 *
 * It is a plain forwarder today because the only credential is that cookie. This
 * is the one place to add request validation, shaping, or a server held secret
 * later, without touching the client.
 */
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN?.replace(/\/+$/, "");

/* Host and length belong to this hop, not the upstream one; fetch sets its own. */
const STRIP = new Set(["host", "connection", "content-length"]);

function configError() {
  return NextResponse.json(
    { success: false, message: "The server is not configured." },
    { status: 502 },
  );
}

async function forward(request: NextRequest, path: string[]) {
  if (!BACKEND_ORIGIN) return configError();

  const target = `${BACKEND_ORIGIN}/api/v1/${path.join("/")}${request.nextUrl.search}`;
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!STRIP.has(key)) headers.set(key, value);
  });

  const method = request.method;
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  let upstream: Response;
  try {
    upstream = await fetch(target, { method, headers, body, redirect: "manual" });
  } catch {
    return NextResponse.json(
      { success: false, message: "Could not reach the server." },
      { status: 502 },
    );
  }

  // Rebuild the response from the upstream status and body. Only the headers the
  // browser needs are copied: the content type, and the cookies that are the
  // session. Transfer encodings are dropped because fetch already decoded them.
  const response = new NextResponse(await upstream.arrayBuffer(), { status: upstream.status });
  const contentType = upstream.headers.get("content-type");
  if (contentType) response.headers.set("content-type", contentType);
  for (const cookie of upstream.headers.getSetCookie()) {
    response.headers.append("set-cookie", cookie);
  }
  return response;
}

type Context = { params: Promise<{ path: string[] }> };
const handle = async (request: NextRequest, { params }: Context) =>
  forward(request, (await params).path);

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
