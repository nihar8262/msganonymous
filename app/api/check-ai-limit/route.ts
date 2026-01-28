import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/option';
import { getClientIP } from '@/lib/ExtractIP';
import {
  checkAuthenticatedUserLimit,
  checkAnonymousUserLimit,
} from '@/lib/rateLimiter';

export async function POST(request: Request) {
  try {
    const { fingerprint, forceAnonymous } = await request.json();
    
    const session = await getServerSession(authOptions);
    let rateLimitResult;

    if (!forceAnonymous && session?.user) {
      const userId = (session.user as any)._id;
      rateLimitResult = await checkAuthenticatedUserLimit(userId);
    } else {
      const clientIP = getClientIP(request);
      const identifier = fingerprint || clientIP;
      rateLimitResult = await checkAnonymousUserLimit(identifier, 'ai');
    }

    return NextResponse.json({
      success: true,
      ...rateLimitResult,
    });
  } catch (error) {
    console.error('Error checking AI limit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check limit' },
      { status: 500 }
    );
  }
}