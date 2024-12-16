/** @type {import('next').NextConfig} */



const { i18n } = import('./i18nConfig.js');

const nextConfig = {
  i18n,
  reactStrictMode: true
}

export default nextConfig;
