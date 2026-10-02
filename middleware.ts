import { timingSafeEqual, createHash } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { INTERNAL_HOST } from '@/lib/brand-server';

/**
 * Keeps the two domains isolated:
 *
 * - The internal testing domain is behind HTTP Basic Auth
 *   (INTERNAL_AUTH_USER / INTERNAL_AUTH_PASS), sends X-Robots-Tag on every
 *   response and serves a Disallow-all robots.txt. Without both variables it
 *   refuses everyone.
 * - Each domain refuses the other brand's logo and icon files, so neither
 *   serves the other's assets.
 *
 * Nginx sends /api, /socket.io and /uploads straight to the backend, which
 * applies the same rules (backend/src/middleware/internalDomain.ts).
 */

const PRODUCTION_ONLY_ASSETS = ['/repliva-logo.png', '/repliva-favicon.png', '/app-icon-1024.png'];
const INTERNAL_ONLY_ASSETS = ['/unichat-icon.svg', '/unichat-icon-1024.png', '/favicon.svg'];

function hostnameOf(request: NextRequest): string {
  const raw = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '';
  return raw.split(',')[0].trim().toLowerCase().replace(/:\d+$/, '');
}

/** The asset a request is for, including through the image optimizer (/_next/image?url=…). */
function requestedAsset(request: NextRequest): string {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname === '/_next/image') return searchParams.get('url')?.split('?')[0] ?? '';
  return pathname;
}

function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

function hasInternalAccess(request: NextRequest): boolean {
  const user = process.env.INTERNAL_AUTH_USER;
  const pass = process.env.INTERNAL_AUTH_PASS;
  if (!user || !pass) return false;

  const auth = request.headers.get('authorization') ?? '';
  if (!auth.startsWith('Basic ')) return false;
  const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
  const sep = decoded.indexOf(':');
  if (sep < 0) return false;
  // Compare both parts every time so timing does not reveal which one failed.
  const userOk = timingSafeEqual(sha256(decoded.slice(0, sep)), sha256(user));
  const passOk = timingSafeEqual(sha256(decoded.slice(sep + 1)), sha256(pass));
  return userOk && passOk;
}

const NO_INDEX = 'noindex, nofollow';

export function middleware(request: NextRequest) {
  const internal = hostnameOf(request) === INTERNAL_HOST;
  const asset = requestedAsset(request);

  if ((internal ? PRODUCTION_ONLY_ASSETS : INTERNAL_ONLY_ASSETS).includes(asset)) {
    return new NextResponse('Not found', { status: 404, headers: internal ? { 'X-Robots-Tag': NO_INDEX } : {} });
  }

  if (!internal) return NextResponse.next();

  if (request.nextUrl.pathname === '/robots.txt') {
    return new NextResponse('User-agent: *\nDisallow: /\n', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': NO_INDEX },
    });
  }

  if (!hasInternalAccess(request)) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Internal", charset="UTF-8"',
        'X-Robots-Tag': NO_INDEX,
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', NO_INDEX);
  return response;
}

export const config = {
  // Node.js runtime: the credentials are read from the environment at request
  // time, not baked in at build time.
  runtime: 'nodejs',
};
