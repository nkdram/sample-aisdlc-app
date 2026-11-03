import type { NextConfig } from "next";
import { readFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  version: string;
};

const shortCommit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    NEXT_PUBLIC_COMMIT: shortCommit,
  },
};

export default nextConfig;
