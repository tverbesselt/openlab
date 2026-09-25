/** @type {import('next').NextConfig} */

// Nodig zolang authDomain niet naar het eigen domein geflipt is: signInWithRedirect
// (de terugval op mobiel) stuurt de gebruiker langs /__/auth/*.
const firebaseProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!firebaseProject) return [];
    return [
      {
        source: "/__/auth/:path*",
        destination: `https://${firebaseProject}.firebaseapp.com/__/auth/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
