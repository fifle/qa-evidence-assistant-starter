/// <reference types="vitest/config" />
import { defineConfig, type HmrOptions } from "vite";
import react from "@vitejs/plugin-react";

const DEV_PORT = 5173;

/** Coder port subdomain for HMR over TLS (e.g. 5173--main--challenge-xxx--chcloud.cloud.challeng.ee). */
function resolveCoderHmr(port: number): HmrOptions | undefined {
  const explicit = process.env.CODER_VITE_HMR_HOST?.trim();
  if (explicit) {
    return { protocol: "wss", host: explicit, clientPort: 443 };
  }

  const workspace = process.env.CODER_WORKSPACE_NAME?.trim();
  if (!workspace) return undefined;

  const agent = process.env.CODER_AGENT_NAME?.trim() || "main";
  const subdomainUser =
    process.env.CODER_VNC_SUBDOMAIN_USER?.trim() || "chcloud";

  let baseHost: string | undefined;
  const access = process.env.CODER_ACCESS_URL?.trim();
  if (access) {
    try {
      baseHost = new URL(access).hostname;
    } catch {
      /* ignore */
    }
  }
  if (!baseHost) {
    const wildcard = process.env.CODER_WILDCARD_ACCESS_URL?.trim();
    if (wildcard?.startsWith("*.")) baseHost = wildcard.slice(2);
  }
  if (!baseHost) return undefined;

  const host = `${port}--${agent}--${workspace}--${subdomainUser}.${baseHost}`;
  return { protocol: "wss", host, clientPort: 443 };
}

const coderHmr = resolveCoderHmr(DEV_PORT);

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: DEV_PORT,
    strictPort: true,
    allowedHosts: true,
    ...(coderHmr ? { hmr: coderHmr } : {}),
    ...(process.env.VITE_USE_POLLING === "true"
      ? { watch: { usePolling: true, interval: 1000 } }
      : {}),
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
