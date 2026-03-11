/** @type {import('next').NextConfig} */
const nextConfig = {
	devIndicators: false,
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "cdn.fragella.com",
			},
		],
		unoptimized: true,
	},
}

export default nextConfig
