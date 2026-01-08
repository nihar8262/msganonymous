import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Feedback-style suggestions (statements, not questions)
    const feedbackSuggestions = [
      // Positive feedback
      "I really appreciate your hard work||You're doing an amazing job||Keep up the great work!",
      "Your dedication is inspiring||I'm impressed by your commitment||You make a real difference",
      "Thank you for always being reliable||Your support means a lot||You're an incredible person",
      "I admire your creativity||Your ideas are always innovative||You bring unique perspectives",
      "You're a great team player||Your positivity is contagious||You make things better",
      
      // Constructive feedback
      "I think communication could be improved||More transparency would help||Consider being more proactive",
      "The process could be streamlined||There's room for better organization||Efficiency could be enhanced",
      "I'd love to see more consistency||Following through is important||Reliability matters here",
      "Time management could be better||Meeting deadlines is crucial||Planning ahead would help",
      "More attention to detail needed||Quality over quantity matters||Double-checking would prevent issues",
      
      // Balanced feedback
      "You're strong at X, but Y needs work||Great effort, small improvements needed||Overall good, with room to grow",
      "Love your enthusiasm, refine execution||Your ideas are solid, implementation needs focus||Strong start, finish strong too",
      "Communication is great, follow-through needs work||You're creative but need more structure||Good foundation, build on it",
      
      // Professional feedback
      "Your technical skills are impressive||Leadership qualities are evident||Problem-solving abilities stand out",
      "You adapt well to changes||Your professionalism is notable||Collaboration skills are strong",
      "Initiative and ownership shine through||Strategic thinking is your strength||You mentor others effectively",
      
      // Event/Experience feedback
      "The event was well organized||Great atmosphere and energy||Excellent choice of venue",
      "Timing could have been better||More variety would be nice||Consider different formats next time",
      "Loved the networking opportunities||Content was highly relevant||Speakers were engaging",
      "Registration process was smooth||Food and refreshments were good||Setup was professional",
      
      // Anonymous appreciation
      "You inspire me to be better||Your kindness doesn't go unnoticed||You made a difficult situation easier",
      "I'm grateful for your patience||Your guidance helped me grow||You believe in people",
      "You create a welcoming environment||Your humor brightens the day||You listen without judgment",
      
      // Honest feedback
      "Sometimes you come across as dismissive||Your tone can be harsh||Consider others' perspectives more",
      "You interrupt people often||More empathy would help||Listen more, talk less",
      "You take credit too quickly||Share recognition with others||Acknowledge team contributions",
      
      // Growth-oriented
      "You've improved significantly||Your growth is noticeable||Progress is being made",
      "Keep pushing your boundaries||Challenge yourself more||Don't settle for comfort",
      "Learn from this experience||Mistakes are opportunities||Failure leads to success",
      
      // Supportive feedback
      "I believe in your potential||You're capable of more||Don't doubt yourself",
      "Keep going, you're on track||Progress takes time||Small steps matter",
      "You're not alone in this||Reach out when you need help||We're here to support you",
      
      // Specific improvements
      "Improve presentation skills||Develop better time management||Enhance technical knowledge",
      "Work on active listening||Build stronger relationships||Focus on strategic thinking",
      "Strengthen decision-making||Increase accountability||Develop emotional intelligence",
      
      // Gratitude and recognition
      "Your contribution made this successful||I notice your efforts||Thank you for going above and beyond",
      "You handled that situation well||Your solution was brilliant||You saved the day",
      "I respect your integrity||Your values are admirable||You stand up for what's right",
      
      // Action-oriented feedback
      "Let's discuss improvements together||I'd like to help you succeed||Can we work on this?",
      "Schedule a follow-up meeting||Let's create an action plan||Set clear goals moving forward",
      "Regular check-ins would help||Open communication is key||Feedback loops are important",
    ];

    const randomSuggestion = feedbackSuggestions[Math.floor(Math.random() * feedbackSuggestions.length)];

    return NextResponse.json({ 
      success: true,
      message: randomSuggestion 
    });
  } catch (error) {
    console.error('Error in suggest-messages API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}