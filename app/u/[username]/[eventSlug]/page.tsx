'use client'
import { Button } from "@/components/ui/button"
import { useParams } from "next/navigation"
import { messageSchema } from "@/schema/messageSchema"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useForm } from "react-hook-form"
import axios, { AxiosError } from "axios"
import { ApiResponse } from "@/types/ApiResponse"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useEffect, useState } from "react"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getFingerprint } from '@/lib/fingerprint';
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

const specialChar = '||';

const parseStringMessages = (messageString: string): string[] => {
  return messageString.split(specialChar);
};

const initialMessageString =
  "What's your favorite movie?||Do you have any pets?||What's your dream job?";

interface Event {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  responsesLimit?: number;
  eventEndDate?: string;
  eventEndTime?: string;
  messagesCount?: number;
}

const UsernamePage = () => {
  const params = useParams<{ username: string; eventSlug?: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiIsGenerating, setAIIsGenerating] = useState(false);
  const [suggestedMessages, setSuggestedMessages] = useState<string[]>(parseStringMessages(initialMessageString));
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [userExists, setUserExists] = useState(true);
  const [aiRemaining, setAIRemaining] = useState<number>(2);
  const [fingerprint, setFingerprint] = useState('');
  const [isCheckingLimit, setIsCheckingLimit] = useState(true);
  const [expiresIn, setExpiresIn] = useState<string>('');
  const [submittedToday, setSubmittedToday] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [isCheckingMessageLimit, setIsCheckingMessageLimit] = useState(false);

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: ''
    }
  });

  // Fetch event details if eventSlug is provided
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!params.username) {
        setIsLoadingEvent(false);
        return;
      }

      // If no eventSlug in URL, it's a general profile page - no event needed
      if (!params.eventSlug) {
        setIsLoadingEvent(false);
        setUserExists(true);
        return;
      }

      try {
        const response = await axios.get(`/api/create-event/public/${params.username}/${params.eventSlug}`);

        if (response.data.success) {
          setEvent(response.data.event);
          setUserExists(true);
        } else {
          toast.error("Event not found or inactive");
          setUserExists(false);
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        const axiosError = error as AxiosError<ApiResponse>;
        toast.error(axiosError.response?.data.message || "Failed to load event");
        setUserExists(false);
      } finally {
        setIsLoadingEvent(false);
      }
    };

    fetchEventDetails();
  }, [params.username, params.eventSlug]);

  useEffect(() => {
    const initFingerprint = async () => {
      try {
        const fp = await getFingerprint();
        setFingerprint(fp);
        await checkAILimit(fp);
      } catch (error) {
        console.error('Error initializing fingerprint:', error);
        setIsCheckingLimit(false);
      }
    };
    initFingerprint();
  }, []);

  useEffect(() => {
    const checkMessageLimit = async () => {
      if (!event?._id) return;
      setIsCheckingMessageLimit(true);
      try {
        const response = await axios.post('/api/check-message-limit', {
          fingerprint: fingerprint,
          eventId: event._id,
        });

        if (response.data?.allowed === false) {
          setSubmittedToday(true);
          setSubmissionMessage('You can only send one message per day for this event. Try again in 24 hours.');
        }
      } catch (error) {
        console.error('Error checking message limit:', error);
      } finally {
        setIsCheckingMessageLimit(false);
      }
    };

    checkMessageLimit();
  }, [event?._id, fingerprint]);

  const computeEndAt = (eventData?: Event | null) => {
    if (!eventData?.eventEndDate && !eventData?.eventEndTime) return null;
    const baseDate = eventData?.eventEndDate ? new Date(eventData.eventEndDate) : new Date();
    if (Number.isNaN(baseDate.getTime())) return null;
    if (eventData?.eventEndTime) {
      const [hours, minutes] = eventData.eventEndTime.split(':').map(Number);
      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
      const combined = new Date(baseDate);
      combined.setHours(hours, minutes, 0, 0);
      return combined;
    }
    const endOfDay = new Date(baseDate);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  };

  const endAt = computeEndAt(event);
  const limitReached = !!event?.responsesLimit && (event?.messagesCount ?? 0) >= event.responsesLimit;
  const expired = !!endAt && endAt.getTime() <= Date.now();
  const canSendMessages = !limitReached && !expired && event?.isActive && !submittedToday;

  useEffect(() => {
    if (!endAt) {
      setExpiresIn('');
      return;
    }

    const updateCountdown = () => {
      const diff = endAt.getTime() - Date.now();
      if (diff <= 0) {
        setExpiresIn('Expired');
        return;
      }

      const totalMinutes = Math.floor(diff / 60000);
      const days = Math.floor(totalMinutes / (60 * 24));
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
      const minutes = totalMinutes % 60;

      const parts = [] as string[];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      parts.push(`${minutes}m`);

      setExpiresIn(parts.join(' '));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [endAt?.getTime()]);

  const checkAILimit = async (fp?: string) => {
    setIsCheckingLimit(true);
    try {
      const response = await axios.post('/api/check-ai-limit', {
        fingerprint: fp || fingerprint,
        forceAnonymous: true,
      });
      setAIRemaining(response.data.remaining ?? 2); // Use nullish coalescing
    } catch (error) {
      console.error('Error checking AI limit:', error);
      setAIRemaining(2); // Fallback to 2 on error
    } finally {
      setIsCheckingLimit(false);
    }
  };

  const handleSuggestMessages = async (useAI: boolean = false) => {

    if (useAI) {
      setAIIsGenerating(true);
    } else {
      setIsGenerating(true);
    }

    try {
      const response = await axios.post('/api/ai-message', {
        type: 'feedback',
        useAI: useAI,
        eventName: event?.name || '',
        fingerprint: fingerprint,
        forceAnonymous: true,
      });

      const suggestions = response.data.message;

      if (response.data.remaining !== undefined && response.data.remaining !== null) {
        setAIRemaining(response.data.remaining);
      }


      if (typeof suggestions === 'string') {
        setSuggestedMessages(parseStringMessages(suggestions));
      }

      if (response.data.rateLimited) {
        toast.info('Daily AI limit reached. Using curated suggestions.', {
          description: 'Limit resets tomorrow',
        });
      } else if (response.data.isAI) {
        toast.success(`AI suggestions generated! ${response.data.remaining} left today`);
      } else {
        toast.success('Curated suggestions loaded!');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast.error('Failed to generate suggestions. Please try again.');
    } finally {
      if (useAI) {
        setAIIsGenerating(false);
      } else {
        setIsGenerating(false);
      }
    }
  };

  // Add debug logging to see state changes
  useEffect(() => {
  }, [isGenerating, aiIsGenerating, aiRemaining]);

  const handleMessageClick = (message: string) => {
    form.setValue('content', message);
  };

  const onSubmit = async (data: z.infer<typeof messageSchema>) => {
    if (!event) {
      toast.error("Please select an event to send a message");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post<ApiResponse>('/api/send-message', {
        username: params.username,
        content: data.content,
        eventId: event._id,
        fingerprint: fingerprint
      });
      toast.success(response.data.message);
      form.reset();
      setSubmittedToday(true);
      setSubmissionMessage('Response submitted. You can send another message after 24 hours.');
    } catch (error) {
      console.error('Error sending message:', error);
      const axiosError = error as AxiosError<ApiResponse>;
      const errorMessage = axiosError.response?.data.message ?? "Unable to send message. Please try again.";
      if (axiosError.response?.status === 429) {
        setSubmittedToday(true);
        setSubmissionMessage(errorMessage);
      }
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="flex flex-col justify-center w-full max-w-5xl  mx-auto gap-10 items-center min-h-screen">
        <div>
          <div className="flex flex-col space-y-3">
              <Skeleton className="h-[15vh] w-[55vw] md:h-[15vh] md:w-[50vw] rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
        </div>
          <div className="flex flex-col md:flex-row items-center  gap-20 justify-center">
            <div className="flex flex-col space-y-3">
              <Skeleton className="h-[25vh] w-[55vw] md:h-[35vh] md:w-[25vw] rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
            <div className="flex flex-col space-y-3">
              <Skeleton className="h-[25vh] w-[55vw] md:h-[35vh] md:w-[25vw] rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </div>
      </div>
    );
  }

  if (!userExists || (params.eventSlug && !event)) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <h1 className="text-2xl font-bold">Event Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400">
              The event you're looking for doesn't exist or is no longer active.
            </p>
            <Link href="/sign-up">
              <Button className="cursor-pointer">Create Your Own Events</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="w-full max-w-5xl space-y-6">
          {/* Header */}
          <div className="text-center bg-white dark:bg-neutral-800 rounded-lg border shadow-sm p-6">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              Send Anonymous Message
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              to @{params.username}
            </p>
            {event && (
              <div className="mt-3 inline-block bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-full">
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                  Event: {event.name}
                </p>
                {event.description && (
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    {event.description}
                  </p>
                )}
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                {expiresIn || 'No expiry set'}
              </span>
              <span className={`px-2 py-0.5 rounded-full border ${expired ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                {expired ? 'Expired' : 'Active'}
              </span>
            </div>
          </div>

          {submittedToday ? (
            <Card className="w-full">
              <CardContent className="pt-6">
                <div className="text-sm text-amber-700 bg-amber-100 border border-amber-200 rounded-md p-4 text-center">
                  {submissionMessage || 'You have submitted your response previously. You can only send one message per day for this event. Try again in 24 hours.'}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="w-full flex flex-col lg:flex-row justify-between gap-5">
              {/* Message Form */}
              <Card className="w-full">
                <CardContent className="pt-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Message</FormLabel>
                            <FormControl>
                              <textarea
                                placeholder="Write your anonymous message here..."
                                className="resize-none w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-900 dark:border-neutral-700"
                                rows={6}
                                {...field}
                                disabled={!canSendMessages}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {!submittedToday && isCheckingMessageLimit && (
                        <div className="text-xs text-muted-foreground">
                          Checking message limit...
                        </div>
                      )}
                      <Button
                        type="submit"
                        disabled={isLoading || !event || !canSendMessages}
                        className="w-full cursor-pointer"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          canSendMessages ? 'Send Message' : 'Event Closed'
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Suggested Messages */}
              <Card className="w-full">
                <CardHeader>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => handleSuggestMessages(false)}
                      disabled={isGenerating}
                      variant="outline"
                      className="cursor-pointer flex-1"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Quick Suggestions'
                      )}
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-block">
                          <Button
                            type="button"
                            onClick={() => handleSuggestMessages(true)}
                            disabled={aiIsGenerating || (aiRemaining !== null && aiRemaining <= 0) || isCheckingLimit}
                            variant="default"
                            className="cursor-pointer flex-1"
                          >
                            {aiIsGenerating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : isCheckingLimit ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Checking...
                              </>
                            ) : (
                              `✨ AI Suggestions ${aiRemaining !== null ? `(${aiRemaining})` : ''}`
                            )}
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {aiRemaining !== null
                            ? `${aiRemaining} AI suggestions left for today`
                            : 'Checking AI limit...'}
                        </p>
                        {aiRemaining === 0 && (
                          <p className="text-xs text-muted-foreground mt-1">Resets tomorrow</p>
                        )}
                      </TooltipContent>
                    </Tooltip>

                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Click on any message below to use it
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {suggestedMessages.length > 0 ? (
                      suggestedMessages.map((message, index) => (
                        <Card
                          key={index}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors border-2 hover:border-blue-500"
                          onClick={() => handleMessageClick(message)}
                        >
                          <CardContent className="p-4">
                            <p className="text-sm">{message}</p>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                        Click "Suggest Messages" to generate ideas
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Separator className="my-6" />
          <div className="text-center">
            <div className="mb-4 dark:text-white">Get Your Message Board</div>
            <Link href={'/sign-up'}>
              <Button className="cursor-pointer">Create Your Account</Button>
            </Link>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default UsernamePage;