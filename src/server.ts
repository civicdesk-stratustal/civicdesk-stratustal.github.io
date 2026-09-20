import "./lib/error-capture";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (
    request: Request,
    env: unknown,
    ctx: unknown,
  ) => Promise<Response> | Response;
};

type CloudflareEnv = {
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  OPENROUTER_API_KEY?: string;
  SUPABASE_PROJECT_ID?: string;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }

  return serverEntryPromise;
}

function populateProcessEnv(env: unknown) {
  const cloudflareEnv = env as CloudflareEnv;

  if (cloudflareEnv.SUPABASE_URL) {
    process.env.SUPABASE_URL = cloudflareEnv.SUPABASE_URL;
  }

  if (cloudflareEnv.SUPABASE_PUBLISHABLE_KEY) {
    process.env.SUPABASE_PUBLISHABLE_KEY =
      cloudflareEnv.SUPABASE_PUBLISHABLE_KEY;
  }

  if (cloudflareEnv.OPENROUTER_API_KEY) {
    process.env.OPENROUTER_API_KEY = cloudflareEnv.OPENROUTER_API_KEY;
  }

  if (cloudflareEnv.SUPABASE_PROJECT_ID) {
    process.env.SUPABASE_PROJECT_ID = cloudflareEnv.SUPABASE_PROJECT_ID;
  }
}

async function normalizeCatastrophicSsrResponse(
  response: Response,
): Promise<Response> {
  if (response.status < 500) return response;

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    return response;
  }

  const body = await response.clone().text();

  if (!isH3SwallowedErrorBody(body)) {
    return response;
  }

  console.error(
    consumeLastCapturedError() ??
      new Error(`h3 swallowed SSR error: ${body}`),
  );

  return new Response(renderErrorPage(), {
    status: 500,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as {
      unhandled?: unknown;
      message?: unknown;
    };

    return (
      payload.unhandled === true &&
      payload.message === "HTTPError"
    );
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // Cloudflare provides bindings through `env`.
      // The generated Supabase/TanStack server code expects
      // them through process.env, so bridge the two here.
      populateProcessEnv(env);

      const handler = await getServerEntry();

      const response = await handler.fetch(request, env, ctx);

      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);

      return new Response(renderErrorPage(), {
        status: 500,
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      });
    }
  },
};