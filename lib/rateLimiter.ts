import dbConnect from './dbconnect';
import UserModel from '@/model/User';
import AnonymousUsageModel from '@/model/AnonymousUsage';

const DAILY_LIMIT = 5;
const ANONYMOUS_DAILY_LIMIT = 2;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt?: Date;
  isAuthenticated: boolean;
}

// For authenticated users
export async function checkAuthenticatedUserLimit(
  userId: string
): Promise<RateLimitResult> {
  await dbConnect();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  try {
    const user = await UserModel.findById(userId);
    
    if (!user) {
      return {
        allowed: false,
        remaining: 0,
        isAuthenticated: true,
      };
    }

    // Check if aiUsage exists and if it's today
    const usageDate = user.aiUsage?.date ? new Date(user.aiUsage.date) : null;
    if (usageDate) {
      usageDate.setUTCHours(0, 0, 0, 0);
    }

    let currentCount = 0;

    // If usage is from today, use current count
    if (usageDate && usageDate.getTime() === today.getTime()) {
      currentCount = user.aiUsage.count || 0;
    }

    // If usage is from a previous day, it's reset (count = 0)
    // We'll update it on next increment

    const remaining = Math.max(0, DAILY_LIMIT - currentCount);

    return {
      allowed: currentCount < DAILY_LIMIT,
      remaining,
      resetAt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      isAuthenticated: true,
    };
  } catch (error) {
    console.error('Error checking authenticated user limit:', error);
    return {
      allowed: false,
      remaining: 0,
      isAuthenticated: true,
    };
  }
}

// For anonymous users (IP-based)
export async function checkAnonymousUserLimit(
  identifier: string,
  scope: string = 'ai'
): Promise<RateLimitResult> {
  await dbConnect();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  try {
    const usage = await AnonymousUsageModel.findOne({
      identifier,
      date: today,
      scope,
    });

    const currentCount = usage?.count || 0;
    const remaining = Math.max(0, ANONYMOUS_DAILY_LIMIT - currentCount);

    return {
      allowed: currentCount < ANONYMOUS_DAILY_LIMIT,
      remaining,
      resetAt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      isAuthenticated: false,
    };
  } catch (error) {
    console.error('Error checking anonymous user limit:', error);
    return {
      allowed: false,
      remaining: 0,
      isAuthenticated: false,
    };
  }
}

// Increment usage count
export async function incrementAuthenticatedUsage(
  userId: string
): Promise<void> {
  await dbConnect();

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  try {
    const user = await UserModel.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check if aiUsage is from today
    const usageDate = user.aiUsage?.date ? new Date(user.aiUsage.date) : null;
    if (usageDate) {
      usageDate.setUTCHours(0, 0, 0, 0);
    }

    if (usageDate && usageDate.getTime() === today.getTime()) {
      // Same day - increment count
      user.aiUsage.count += 1;
    } else {
      // New day or no usage - reset to 1
      user.aiUsage = {
        date: today,
        count: 1,
      };
    }

    await user.save();
  } catch (error) {
    console.error('Error incrementing authenticated usage:', error);
    throw error;
  }
}

export async function incrementAnonymousUsage(
  identifier: string,
  scope: string = 'ai'
): Promise<void> {
  await dbConnect();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await AnonymousUsageModel.findOneAndUpdate(
    {
      identifier,
      date: today,
      scope,
    },
    {
      $inc: { count: 1 },
    },
    {
      upsert: true,
      new: true,
    }
  );
}