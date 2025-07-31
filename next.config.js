/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React strict mode for better development experience
    reactStrictMode: true,

    // GitHub Pages configuration - only for production
    ...(process.env.NODE_ENV === 'production' && {
        output: 'export',
        trailingSlash: true,
        basePath: '/chess-game',
        assetPrefix: '/chess-game/',
    }),

    images: {
        unoptimized: true
    },

    // Disable ESLint during build for deployment
    eslint: {
        ignoreDuringBuilds: true,
    },

    // Disable TypeScript type checking during build for deployment
    typescript: {
        ignoreBuildErrors: true,
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