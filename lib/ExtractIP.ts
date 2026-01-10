import { NextRequest } from 'next/server';

export function getClientIP(request: Request | NextRequest): string {
  // Try to get IP from various headers (in order of reliability)
  const headers = request.headers;
  
  // Vercel/Cloudflare specific
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  // Other common headers
  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback
  return 'unknown';
}