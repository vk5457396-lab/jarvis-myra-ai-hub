import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Auth.js's `NEXTAUTH_URL` (set to the bare apex domain) forces every internal
  // redirect_uri to `codeninjavik.in`, but the PKCE verifier cookie is bound by the
  // browser to whichever host actually served the response (no Domain= attribute is
  // set). Since both `codeninjavik.in` and `www.codeninjavik.in` were live with no
  // redirect between them, a user starting the Google OAuth flow on `www` got a PKCE
  // cookie scoped to `www`, then got bounced back by Google to the apex-forced
  // redirect_uri - which never sees that cookie, and the callback throws
  // InvalidCheck: pkceCodeVerifier value could not be parsed ("Configuration" error).
  // Forcing everything onto one canonical host keeps the whole OAuth round trip
  // (signin cookie-set + callback cookie-read) on the same origin.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.codeninjavik.in" }],
        destination: "https://codeninjavik.in/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
