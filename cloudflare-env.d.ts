declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    GOOGLE_GA4_CLIENT_ID?: string;
    GOOGLE_GA4_CLIENT_SECRET?: string;
    GA4_TOKEN_ENCRYPTION_KEY?: string;
  }
}
