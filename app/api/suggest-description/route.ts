import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Question templates for event descriptions
    const descriptionSuggestions = [
      // Original casual questions
      "What's the best book you've read recently?||If you could travel anywhere tomorrow, where would you go?||What's a skill you'd love to learn?",
      "What's your favorite way to spend a weekend?||If you could have any superpower, what would it be?||What's the most interesting thing you've learned this week?",
      "What's a movie that changed your perspective?||What's your go-to comfort food?||If you could meet anyone, dead or alive, who would it be?",
      "What's your biggest accomplishment this year?||What makes you laugh the most?||If you could relive one day, which would it be?",
      "What's a hidden talent you have?||What's the best advice you've ever received?||What's your favorite memory from childhood?",
      
      // Feedback-seeking questions
      "What's one thing you think could be improved?||How would you rate your overall experience?||What did you appreciate the most?",
      "What's something you'd like to see done differently?||What exceeded your expectations?||Is there anything that could have been better?",
      "What's one area where you see room for growth?||What's working really well in your opinion?||What constructive feedback would you share?",
      
      // Event-specific questions
      "What was the highlight of this event?||What could have made it better?||Would you recommend this to others?",
      "What did you enjoy the most?||What was missing?||How would you rate the organization?",
      "What made this memorable?||What would you change next time?||What exceeded your expectations?",
      
      // Professional questions
      "What skills do you think are most valuable here?||How would you describe the overall environment?||What's one suggestion for improvement?",
      "What's something you learned recently?||What challenges have you observed?||What opportunities do you see?",
    ];

    const randomSuggestion = descriptionSuggestions[Math.floor(Math.random() * descriptionSuggestions.length)];

    return NextResponse.json({ 
      success: true,
      message: randomSuggestion 
    });
  } catch (error) {
    console.error('Error in suggest-description API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}