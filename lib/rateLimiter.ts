import dbConnect from './dbconnect';
import UserModel from '@/model/User';
import AnonymousUsageModel from '@/model/AnonymousUsage';

const DAILY_LIMIT = 5;

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
  today.setHours(0, 0, 0, 0);

  try {
    const user = await UserModel.findById(userId);
    
    if (!user) {
      return {
        allowed: false,
        remaining: 0,
        isAuthenticated: true,
      };
    }

    // Find today's usage
    const todayUsage = user.aiUsage?.find((usage) => {
      const usageDate = new Date(usage.date);
      usageDate.setHours(0, 0, 0, 0);
      return usageDate.getTime() === today.getTime();
    });

    const currentCount = todayUsage?.count || 0;
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
  identifier: string
): Promise<RateLimitResult> {
  await dbConnect();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const usage = await AnonymousUsageModel.findOne({
      identifier,
      date: today,
    });

    const currentCount = usage?.count || 0;
    const remaining = Math.max(0, DAILY_LIMIT - currentCount);

    return {
      allowed: currentCount < DAILY_LIMIT,
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
  today.setHours(0, 0, 0, 0);

  await UserModel.findByIdAndUpdate(
    userId,
    {
      $inc: {
        'aiUsage.$[elem].count': 1,
      },
    },
    {
      arrayFilters: [{ 'elem.date': today }],
    }
  );

  // If no entry exists for today, create one
  await UserModel.findByIdAndUpdate(
    userId,
    {
      $push: {
        aiUsage: {
          $each: [{ date: today, count: 1 }],
          $position: 0,
        },
      },
    },
    {
      upsert: false,
    }
  );
}

export async function incrementAnonymousUsage(
  identifier: string
): Promise<void> {
  await dbConnect();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await AnonymousUsageModel.findOneAndUpdate(
    {
      identifier,
      date: today,
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