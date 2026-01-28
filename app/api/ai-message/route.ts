import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/option";
import { getClientIP } from "@/lib/ExtractIP";
import {
  checkAuthenticatedUserLimit,
  checkAnonymousUserLimit,
  incrementAuthenticatedUsage,
  incrementAnonymousUsage,
} from "@/lib/rateLimiter";

const GEMINI_API_KEY = process.env.GOOGLE_API_KEY || "";
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

// Comprehensive fallback suggestions
const FALLBACKS = {
  description: {
    generic: [
      "What's one thing you appreciate?||What could be improved?||Any suggestions?",
      "How was your experience?||What stood out?||What would you change?",
      "What did you enjoy?||What was challenging?||Any feedback?",
    ],
    birthday: [
      "What's your favorite memory with them?||What makes them special?||What do you wish for them?",
      "How have they impacted your life?||What's one thing you admire?||Any birthday wishes?",
    ],
    team: [
      "How would you rate team collaboration?||What's one area for improvement?||What does leadership do well?",
      "What's working well?||What needs attention?||Any suggestions for the team?",
    ],
    event: [
      "What was the highlight?||What could be better?||Would you attend again?",
      "How was the organization?||What did you learn?||Any improvement ideas?",
    ],
  },
  feedback: {
    generic: [
      "I appreciate your effort||You're doing great||Keep it up!",
      "Your dedication shows||Well done||Thank you!",
      "You make a difference||Great job||You're valued",
    ],
    birthday: [
      "Happy birthday! You're amazing||Wishing you the best year ahead||Hope all your wishes come true!",
      "You deserve all the happiness||Cheers to another great year||May this year bring you joy!",
    ],
    team: [
      "Your leadership inspires us||You make work enjoyable||Your guidance is invaluable",
      "Team morale is great because of you||Collaboration has improved||Communication could be clearer",
    ],
    event: [
      "Great event organization||Loved the content||Networking was valuable",
      "Speakers were engaging||Venue was perfect||Time management was good",
    ],
    positive: [
      "I really appreciate your hard work||You're doing an amazing job||Keep up the great work!",
      "Your dedication is inspiring||I'm impressed by your commitment||You make a real difference",
    ],
    constructive: [
      "I think communication could be improved||More transparency would help||Consider being more proactive",
      "The process could be streamlined||There's room for better organization||Efficiency could be enhanced",
    ],
  },
};

// Get contextual fallback based on event name
function getContextualFallback(
  type: "description" | "feedback",
  eventName: string
) {
  const lowerName = eventName.toLowerCase();
  const fallbackSet = FALLBACKS[type];

  if (lowerName.includes("birthday") || lowerName.includes("bday")) {
    return fallbackSet.birthday || fallbackSet.generic;
  }
  if (
    lowerName.includes("team") ||
    lowerName.includes("work") ||
    lowerName.includes("feedback")
  ) {
    return fallbackSet.team || fallbackSet.generic;
  }
  if (
    lowerName.includes("event") ||
    lowerName.includes("conference") ||
    lowerName.includes("workshop")
  ) {
    return fallbackSet.event || fallbackSet.generic;
  }

  return fallbackSet.generic;
}

export async function POST(request: Request) {
  let type: "description" | "feedback" = "feedback";
  let eventName: string = "";
  try {
    const body = await request.json();
    type = body.type; // Assign to outer variable
    eventName = body.eventName ?? "";
    const useAI = body.useAI ?? false;
    const fingerprint = body.fingerprint || '';
    const forceAnonymous = body.forceAnonymous ?? false;

    // Validate type
    if (!["description", "feedback"].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid type. Use "description" or "feedback"',
        },
        { status: 400 }
      );
    }

    // If AI is not enabled or API key missing, use fallback
    if (!useAI || !ai) {
      const fallbacks = getContextualFallback(type, eventName);
      const random = fallbacks[Math.floor(Math.random() * fallbacks.length)];

      return NextResponse.json({
        success: true,
        message: random,
        type,
        isAI: false,
        contextual: eventName ? true : false,
        remaining: null,
      });
    }

    // Check rate limit
    const session = await getServerSession(authOptions);
let rateLimitResult;
let userId: string | null = null;

  if (!forceAnonymous && session?.user) {
  // Authenticated user
  userId = (session.user as any)._id;
  
  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        message: 'User ID not found in session',
      },
      { status: 401 }
    );
  }
  
  rateLimitResult = await checkAuthenticatedUserLimit(userId);
} else {
  // Anonymous user - use IP or fingerprint
  const clientIP = getClientIP(request);
  const identifier = fingerprint || clientIP;
  
  if (identifier === 'unknown') {
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to identify client for rate limiting',
      },
      { status: 403 }
    );
  }

  rateLimitResult = await checkAnonymousUserLimit(identifier, 'ai');
}

    // Check if rate limit exceeded
    if (!rateLimitResult.allowed) {
      const fallbacks = getContextualFallback(type, eventName);
      const random = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      
      return NextResponse.json({
        success: true,
        message: random,
        type,
        isAI: false,
        contextual: eventName ? true : false,
        rateLimited: true,
        remaining: 0,
        resetAt: rateLimitResult.resetAt,
        aimessage: 'Daily AI limit reached. Using curated suggestions.',
      });
    }

    // Generate AI suggestions
    let prompt = "";

    if (type === "description") {
      prompt = eventName
        ? `Event: "${eventName}". Generate 3 relevant feedback questions. Format: Q1||Q2||Q3. No numbering.`
        : "Generate 3 feedback questions. Format: Q1||Q2||Q3. No numbering.";
    } else {
      prompt = eventName
        ? `Event: "${eventName}". Generate 3 contextual anonymous feedback statements (first-person, 1-2 sentences). Format: S1||S2||S3. No numbering.`
        : "Generate 3 anonymous feedback statements (first-person). Format: S1||S2||S3. No numbering.";
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: prompt,
    });

    // Check if response has text content
    if (!response || !response.text) {
      throw new Error("AI response is empty or invalid");
    }

    const generatedText = response.text.trim();

    // Additional validation: ensure we got content
    if (!generatedText) {
      throw new Error("AI generated empty content");
    }

     // Increment usage count
    if (userId) {
      await incrementAuthenticatedUsage(userId);
    } else {
      const clientIP = getClientIP(request);
      const identifier = fingerprint || clientIP;
      await incrementAnonymousUsage(identifier, 'ai');
    }

    return NextResponse.json({
      success: true,
      message: generatedText,
      type,
      isAI: true,
      contextual: eventName ? true : false,
      remaining: rateLimitResult.remaining - 1,
      resetAt: rateLimitResult.resetAt,
    });
  } catch (error: any) {
    console.error('AI Error:', error);
    
    const isRateLimit = error?.status === 429 || 
                       error?.message?.includes('quota') || 
                       error?.message?.includes('RESOURCE_EXHAUSTED');
    
    const fallbacks = getContextualFallback(type, eventName);
    const random = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    
    return NextResponse.json({
      success: true,
      message: random,
      type,
      isAI: false,
      contextual: eventName ? true : false,
      rateLimited: isRateLimit,
      fallbackReason: isRateLimit ? 'API rate limit exceeded' : 'AI generation failed',
    });
  }
}
