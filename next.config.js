/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React strict mode for better development experience
    reactStrictMode: true,

    // GitHub Pages configuration
    output: 'export',
    trailingSlash: true,
    images: {
        unoptimized: true
    },

    // Base path for GitHub Pages
    basePath: process.env.NODE_ENV === 'production' ? '/chess-game' : '',
    assetPrefix: process.env.NODE_ENV === 'production' ? '/chess-game/' : '',

    // Disable ESLint during build for deployment
    eslint: {
        ignoreDuringBuilds: true,
    },

    // Disable TypeScript type checking during build for deployment
    typescript: {
        ignoreBuildErrors: true,
    },

    // Experimental features
    experimental: {
        // Helps with hydration issues
        esmExternals: true,
    },

    // Webpack configuration for better handling of external libraries
    webpack: (config, { isServer }) => {
        // Fixes for chess.js and stockfish
        config.resolve.fallback = {
            ...config.resolve.fallback,
            fs: false,
            net: false,
            tls: false,
        };

        return config;
    },
};

module.exports = nextConfig;