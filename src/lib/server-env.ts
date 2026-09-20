type CloudflareBindings = Record<string, unknown>;

function getCloudflareBindings(): CloudflareBindings | undefined {
  return (globalThis as typeof globalThis & { __env__?: CloudflareBindings })
    .__env__;
}

/**
 * Reads a server-only setting at request time.
 * Nitro's Cloudflare adapter stores Worker bindings on `globalThis.__env__`.
 */
export function getServerEnv(name: string): string | undefined {
  const binding = getCloudflareBindings()?.[name];

  if (typeof binding === "string" && binding.length > 0) {
    return binding;
  }

  return process.env[name];
}
