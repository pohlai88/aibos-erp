/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@aibos/accounting',
    '@aibos/accounting-contracts',
    '@aibos/accounting-web',
    '@aibos/contracts',
    '@aibos/ui',
    '@aibos/utils',
  ],
};

export default nextConfig;
