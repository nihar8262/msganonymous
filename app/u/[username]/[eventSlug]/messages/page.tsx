'use client';

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import { ApiResponse } from "@/types/ApiResponse";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import dayjs from "dayjs";

interface PublicEvent {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  responsesLimit?: number;
  eventEndDate?: string;
  eventEndTime?: string;
}

interface PublicMessage {
  _id: string;
  content: string;
  createdAt: string;
}

const PublicMessagesPage = () => {
  const params = useParams<{ username: string; eventSlug: string }>();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [messages, setMessages] = useState<PublicMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!params.username || !params.eventSlug) return;
      try {
        const response = await axios.get(
          `/api/create-event/public/${params.username}/${params.eventSlug}/messages`
        );
        if (response.data.success) {
          setEvent(response.data.event);
          setMessages(response.data.messages || []);
        } else {
          setErrorMessage("Event not found");
        }
      } catch (error) {
        const axiosError = error as AxiosError<ApiResponse>;
        setErrorMessage(axiosError.response?.data.message || "Failed to load messages");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [params.username, params.eventSlug]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-80" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage || !event) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Event not available</CardTitle>
              <CardDescription>{errorMessage || "The event could not be found."}</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{event.name}</CardTitle>
            <CardDescription>
              {event.description || "Public message board"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {event.isActive ? "Open for new messages" : "Closed for new messages"}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {messages.length > 0 ? (
            messages.map((message) => (
              <Card key={message._id} className="border-muted/60 shadow-sm">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-base leading-relaxed break-words">
                    {message.content}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    {dayjs(message.createdAt).format("MMM D, YYYY h:mm A")}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>No messages yet</CardTitle>
                <CardDescription>There are no messages to display.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicMessagesPage;
