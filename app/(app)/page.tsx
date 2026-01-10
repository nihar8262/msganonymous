'use client';

import { Mail, Shield, Users, Sparkles, MessageSquare, Lock, Zap, CheckCircle2, ArrowRight } from 'lucide-react'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Autoplay from 'embla-carousel-autoplay';
import messages from '../message.json';
import Link from 'next/link';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-20 px-4 md:px-24 text-center dark:bg-neutral-900 overflow-hidden">
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="inline-block mb-4 px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                🎉 Anonymous Feedback Made Simple
              </p>
            </div>
            
            <h1 className="text-4xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dive into the World of Anonymous Feedback
            </h1>

            <Separator className="my-8" />
            
            <p className="mt-6 text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Create custom events, share a unique link, and receive honest, anonymous feedback from anyone. 
              Perfect for birthdays, team reviews, Q&A sessions, and more.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/sign-up">
                <Button size="lg" className="cursor-pointer text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="cursor-pointer text-lg px-8 py-6 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950">
                  Sign In
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
              No credit card required • Free forever • 100% Anonymous
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4 md:px-24 bg-gray-50 dark:bg-neutral-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                How It Works
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Three simple steps to start receiving anonymous feedback
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-2 hover:border-blue-600 transition-colors">
                <CardContent className="pt-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-center">1. Create an Event</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center">
                    Sign up and create a custom event like "Birthday Messages", "Team Feedback", or "Anonymous Q&A"
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-purple-600 transition-colors">
                <CardContent className="pt-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-center">2. Share Your Link</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center">
                    Get a unique shareable link for your event and send it to friends, colleagues, or anyone
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-blue-600 transition-colors">
                <CardContent className="pt-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <MessageSquare className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-center">3. Receive Messages</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-center">
                    People send you anonymous messages. View them all in your dashboard—completely private
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 md:px-24">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Why Choose True Feedback?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Built with privacy, simplicity, and honesty in mind
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">100% Anonymous</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Senders remain completely anonymous. No tracking, no IP logging, no way to identify who sent what.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                    <Lock className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Secure & Private</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Your data is encrypted and secure. Only you can see the messages sent to your events.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Quick Setup</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Create an event in seconds. No complicated setup, no technical knowledge required.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Custom Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Create unlimited events for different occasions—birthdays, feedback sessions, team reviews, and more.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">AI Suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    Get smart message suggestions to help both you and your message senders craft meaningful feedback.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">Easy Sharing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300">
                    One click to copy your unique event link and share it anywhere—social media, email, or messaging apps.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Sample Messages Carousel */}
        <section className="py-20 px-4 md:px-24 bg-gray-50 dark:bg-neutral-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Real Anonymous Messages
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                See what kind of feedback people are receiving
              </p>
            </div>

            <Carousel
              plugins={[Autoplay({ delay: 3000 })]}
              className="w-full max-w-4xl mx-auto"
            >
              <CarouselContent>
                {messages.map((message, index) => (
                  <CarouselItem key={index} className="p-4 md:basis-1/2">
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <Mail className="h-4 w-4 text-white" />
                          </div>
                          {message.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 dark:text-gray-300 mb-2">{message.content}</p>
                        <p className="text-xs text-muted-foreground">
                          {message.received}
                        </p>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20 px-4 md:px-24 ">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Perfect For Any Occasion
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Countless ways to use anonymous feedback
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "🎂", title: "Birthday Wishes", desc: "Collect anonymous birthday messages" },
                { icon: "💼", title: "Team Feedback", desc: "Get honest workplace feedback" },
                { icon: "🎓", title: "Teacher Reviews", desc: "Anonymous course evaluations" },
                { icon: "❓", title: "Q&A Sessions", desc: "Anonymous questions for events" },
                { icon: "💡", title: "Idea Collection", desc: "Gather anonymous suggestions" },
                { icon: "🏆", title: "Performance Reviews", desc: "Honest peer evaluations" },
                { icon: "🎤", title: "Event Feedback", desc: "Post-event anonymous surveys" },
                { icon: "💬", title: "Confessions", desc: "Safe space for sharing thoughts" },
              ].map((useCase, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow border-2 hover:border-blue-600">
                  <CardContent className="pt-6">
                    <div className="text-4xl mb-3">{useCase.icon}</div>
                    <h3 className="font-semibold text-lg mb-2">{useCase.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{useCase.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 px-4 md:px-24 bg-gray-50 dark:bg-neutral-900">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                Why Anonymous Feedback Matters
              </h2>
            </div>

            <div className="space-y-6">
              {[
                "People share more honest opinions when their identity is protected",
                "Reduces bias and fear of judgment in professional settings",
                "Encourages constructive criticism without personal conflict",
                "Creates a safe space for difficult conversations",
                "Helps you understand what people really think",
                "Improves communication in teams and relationships",
              ].map((benefit, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-lg text-gray-700 dark:text-gray-300">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 md:px-24 bg-blue-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to Get Honest Feedback?
            </h2>
            <p className="text-xl mb-10 text-blue-100">
              Join thousands of users who trust True Feedback for anonymous messaging
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/sign-up">
                <Button size="lg" variant="secondary" className="cursor-pointer text-lg px-8 py-6 bg-white text-blue-600 hover:bg-gray-100">
                  Create Your First Event
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="cursor-pointer text-lg px-8 py-6 bg-transparent text-white border-white hover:bg-white hover:text-blue-600">
                  View Dashboard
                </Button>
              </Link>
            </div>
            <p className="mt-8 text-sm text-blue-100">
              ✨ Free forever • ⚡ No credit card needed • 🔒 Completely anonymous
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 md:px-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold text-white mb-4">True Feedback</h3>
              <p className="text-gray-400 mb-4">
                The most trusted platform for anonymous feedback and messaging. 
                Create events, share links, and receive honest opinions.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link href="/sign-up" className="hover:text-blue-400 transition-colors">Get Started</Link></li>
                <li><Link href="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</Link></li>
                <li><Link href="#features" className="hover:text-blue-400 transition-colors">Features</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-blue-400 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © 2024 True Feedback. All rights reserved. Built with privacy and honesty in mind.
          </div>
        </div>
      </footer>
    </div>
  );
}