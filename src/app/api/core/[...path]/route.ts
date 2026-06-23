import { NextRequest, NextResponse } from "next/server";

const CORE_API_BASE_URL =
  process.env.CORE_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyCoreRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyCoreRequest(request, context);
}

async function proxyCoreRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const url = new URL(request.url);
  const targetUrl = `${CORE_API_BASE_URL}/${path.join("/")}${url.search}`;
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text();

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        accept: request.headers.get("accept") ?? "application/json",
        "content-type": request.headers.get("content-type") ?? "application/json",
      },
      body,
      cache: "no-store",
    });

    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "content-type":
          response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to reach vibequest-core." },
      { status: 502 },
    );
  }
}
