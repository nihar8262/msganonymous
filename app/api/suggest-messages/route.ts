import { NextResponse } from 'next/server';

// Lightweight contextual suggestions (no AI)
export async function POST(req: Request) {
  try {
    const { eventName = '', type = 'feedback' } = await req.json();
    
    const lowerName = eventName.toLowerCase();
    
    // Contextual suggestions based on event name
    let suggestions: string[] = [];
    
    if (type === 'description') {
      // Questions for event descriptions
      if (lowerName.includes('birthday')) {
        suggestions = [
          "What's your favorite memory with them?||What makes them special?||What do you wish for them?",
          "How have they impacted your life?||What's one thing you admire?||Any birthday wishes?",
        ];
      } else if (lowerName.includes('team') || lowerName.includes('work')) {
        suggestions = [
          "How would you rate collaboration?||What needs improvement?||What's working well?",
          "Any suggestions for the team?||What challenges exist?||What opportunities do you see?",
        ];
      } else {
        suggestions = [
          "What's one thing you appreciate?||What could be improved?||Any suggestions?",
          "How was your experience?||What stood out?||What would you change?",
        ];
      }
    } else {
      // Feedback statements
      if (lowerName.includes('birthday')) {
        suggestions = [
          "Happy birthday! You're amazing||Wishing you the best||Hope your wishes come true!",
          "You deserve all the happiness||Cheers to you||May this year bring joy!",
        ];
      } else if (lowerName.includes('team') || lowerName.includes('work')) {
        suggestions = [
          "Your leadership inspires us||You make work enjoyable||Great guidance",
          "Team collaboration is strong||Communication is clear||You empower others",
        ];
      } else {
        suggestions = [
          "I appreciate your effort||You're doing great||Keep it up!",
          "Your dedication shows||Well done||Thank you!",
        ];
      }
    }

    const random = suggestions[Math.floor(Math.random() * suggestions.length)];

    return NextResponse.json({ 
      success: true,
      message: random,
      contextual: !!eventName,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}