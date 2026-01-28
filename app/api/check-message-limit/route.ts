import { NextResponse } from 'next/server';
import { getClientIP } from '@/lib/ExtractIP';
import { checkAnonymousUserLimit } from '@/lib/rateLimiter';

export async function POST(request: Request) {
  try {
    const { fingerprint, eventId } = await request.json();

    if (!eventId) {
      return NextResponse.json(
        { success: false, error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const clientIP = getClientIP(request);
    const identifier = fingerprint || clientIP;

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Unable to identify client' },
        { status: 403 }
      );
    }

    const scope = `msg:${eventId}`;
    const rateLimitResult = await checkAnonymousUserLimit(identifier, scope);

    return NextResponse.json({
      success: true,
      ...rateLimitResult,
    });
  } catch (error) {
    console.error('Error checking message limit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check message limit' },
      { status: 500 }
    );
  }
}
