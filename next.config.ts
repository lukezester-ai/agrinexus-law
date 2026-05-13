import type { NextConfig } from "next";

const appRev =
	process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ||
	process.env.npm_package_version ||
	"local";

const nextConfig: NextConfig = {
	reactStrictMode: true,
	env: {
		NEXT_PUBLIC_APP_REV: appRev,
	},
};

export default nextConfig;
