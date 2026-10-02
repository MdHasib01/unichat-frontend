import type { MetadataRoute } from 'next';

/**
 * robots.txt for production. The internal testing domain never reaches this:
 * middleware.ts answers it there with "Disallow: /".
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' } };
}
