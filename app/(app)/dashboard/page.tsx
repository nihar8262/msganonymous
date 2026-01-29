"use client";

import * as React from "react"
import { MessageCard } from "@/components/MessageCard";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Message, Event } from "@/model/User";
import { acceptMessageSchema } from "@/schema/acceptingMessageSchema";
import { ApiResponse } from "@/types/ApiResponse";
import { zodResolver } from "@hookform/resolvers/zod";
import axios, { AxiosError } from "axios";
import { Loader2, RefreshCcw, LayoutDashboardIcon, Plus, Copy, Check, Trash2, Edit2Icon, Sparkles, EyeOff, Eye, QrCode } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { User } from 'next-auth';
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getFingerprint } from '@/lib/fingerprint';
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { ChevronDownIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { eventSchema } from "@/schema/eventSchema";

const Dashboard = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [profileUrl, setProfileUrl] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  // Remove local state for event name/description, use eventForm instead
  const [editEventId, setEditEventId] = useState<string>('');
  const [editEventName, setEditEventName] = useState('');
  const [editEventDescription, setEditEventDescription] = useState('');
  const [editResponsesLimit, setEditResponsesLimit] = useState<string>('');
  const [editEventEndDate, setEditEventEndDate] = useState<string>('');
  const [editEventEndTime, setEditEventEndTime] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isMessagesLinkCopied, setIsMessagesLinkCopied] = useState(false);
  const [isFetchingSuggestion, setIsFetchingSuggestion] = useState(false);
  const [aiIsGenerating, setAIIsGenerating] = useState(false);
  const [descriptionSuggestions, setDescriptionSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiRemaining, setAIRemaining] = useState<number>(5);
  const [fingerprint, setFingerprint] = useState('');
  const [isCheckingLimit, setIsCheckingLimit] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeGenerated, setQRCodeGenerated] = useState(false);
  const [isGeneratingQRCode, setIsGeneratingQRCode] = useState(false);
  const [qrCodeSrc, setQRCodeSrc] = useState('');
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [isDeletingMessages, setIsDeletingMessages] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [expiresIn, setExpiresIn] = useState<string>('');
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(undefined)
  const [selectedResponsesNumber, setSelectedResponsesNumber] = React.useState<string | undefined>(undefined)
  const [messagesTimeLimit, setMessagesTimeLimit] = React.useState<string | undefined>(undefined)
  const Responses = [
    { label: "10", value: "10" },
    { label: "50", value: "50" },
    { label: "100", value: "100" },
    { label: "200", value: "200" },
    { label: "500", value: "500" },
  ]
  const ReceiveMessageTime = [
    { label: "All ", value: "All" },
    { label: "15 minutes ago", value: "15 minutes ago" },
    { label: "30 minutes ago", value: "30 minutes ago" },
    { label: "1 hour ago", value: "1 hour ago" },
    { label: "1 Day ago", value: "1 Day ago" },
    { label: "1 Week ago", value: "1 Week ago" },
  ]

  const getMessageCutoff = (limit?: string) => {
    if (!limit || limit === "All") return null;
    const now = new Date();
    switch (limit) {
      case "15 minutes ago":
        return new Date(now.getTime() - 15 * 60 * 1000);
      case "30 minutes ago":
        return new Date(now.getTime() - 30 * 60 * 1000);
      case "1 hour ago":
        return new Date(now.getTime() - 60 * 60 * 1000);
      case "1 Day ago":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case "1 Week ago":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      default:
        return null;
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const formatDateForInput = (value?: Date | string) => {
    if (!value) return '';
    const dateObj = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(dateObj.getTime())) return '';
    return dateObj.toISOString().split('T')[0];
  };

  const eventForm = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  });

  const handleGenerateQRCode = async () => {
    if (qrCodeGenerated) {
      // If already generated, just toggle visibility
      setShowQRCode(!showQRCode);
      return;
    }

    // Generate QR code for the first time
    setIsGeneratingQRCode(true);
    try {
      const qrUrl = `/api/qr-generator?text=${encodeURIComponent(profileUrl)}`;
      setQRCodeSrc(qrUrl);
      setQRCodeGenerated(true);
      setShowQRCode(true);
      toast.success('QR Code generated successfully!');
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    } finally {
      setIsGeneratingQRCode(false);
    }
  };

  useEffect(() => {
    setQRCodeGenerated(false);
    setShowQRCode(false);
    setQRCodeSrc('');
  }, [selectedEventId]);

  // Fetch fingerprint on mount
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

  const checkAILimit = async (fp?: string) => {
    setIsCheckingLimit(true);
    try {
      const response = await axios.post('/api/check-ai-limit', {
        fingerprint: fp || fingerprint,
      });
      setAIRemaining(response.data.remaining ?? 5); // Use nullish coalescing
    } catch (error) {
      console.error('Error checking AI limit:', error);
      setAIRemaining(5); // Fallback to 5 on error
    } finally {
      setIsCheckingLimit(false);
    }
  };

  const handleGetDescriptionSuggestions = async (useAI: boolean = false) => {
    if (useAI) setAIIsGenerating(true);
    else setIsFetchingSuggestion(true);
    try {
      const response = await axios.post('/api/ai-message', {
        type: 'description',
        useAI: useAI,
        eventName: eventForm.getValues('name'), // Pass the event name being created
        fingerprint: fingerprint
      });
      const suggestions = response.data.message;

      // Update remaining count from response
      if (response.data.remaining !== undefined && response.data.remaining !== null) {
        setAIRemaining(response.data.remaining);
      }

      let parsedSuggestions: string[] = [];
      if (typeof suggestions === 'string') {
        parsedSuggestions = suggestions.split('||').map((s: string) => s.trim());
      } else {
        parsedSuggestions = (suggestions.message || suggestions).split('||').map((s: string) => s.trim());
      }

      setDescriptionSuggestions(parsedSuggestions);
      setShowSuggestions(true);


      // Show appropriate toast
      if (response.data.rateLimited) {
        toast.info('Daily AI limit reached. Using curated questions.', {
          description: 'Limit resets tomorrow',
        });
      } else if (response.data.isAI) {
        toast.success(`AI questions generated! ${response.data.remaining} left today`);
      } else {
        toast.success('Curated questions loaded!');
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      if (useAI) setAIIsGenerating(false);
      else setIsFetchingSuggestion(false);
    }
  };

  // For edit mode, pass editEventName
  const handleGetDescriptionSuggestionsForEdit = async (useAI: boolean = false) => {
    if (useAI) setAIIsGenerating(true);
    else setIsFetchingSuggestion(true);
    try {
      const response = await axios.post('/api/ai-message', {
        type: 'description',
        useAI: useAI,
        eventName: editEventName, // Pass the event name being edited
        fingerprint: fingerprint
      });

      const suggestions = response.data.message;

      // Update remaining count from response
      if (response.data.remaining !== undefined) {
        setAIRemaining(response.data.remaining);
      }

      let parsedSuggestions: string[] = [];

      if (typeof suggestions === 'string') {
        parsedSuggestions = suggestions.split('||').map((s: string) => s.trim());
      }

      setDescriptionSuggestions(parsedSuggestions);
      setShowSuggestions(true);

      // Show appropriate toast
      if (response.data.rateLimited) {
        toast.info('Daily AI limit reached. Using curated questions.', {
          description: 'Limit resets tomorrow',
        });
      } else if (response.data.isAI) {
        toast.success(`AI questions generated! ${response.data.remaining} left today`);
      } else {
        toast.success('Curated questions loaded!');
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast.error('Failed to generate suggestions');
    } finally {
      if (useAI) setAIIsGenerating(false);
      else setIsFetchingSuggestion(false);
    }
  };

  // Add this function to insert suggestion into description
  const handleInsertSuggestion = (suggestion: string) => {
    const currentDescription = eventForm.getValues('description');
    const newDescription = currentDescription
      ? `${currentDescription}\n• ${suggestion}`
      : `• ${suggestion}`;
    eventForm.setValue('description', newDescription);
    toast.success('Suggestion added to description');
  };

  // Add similar functions for edit mode
  const handleInsertSuggestionToEdit = (suggestion: string) => {
    const currentDescription = editEventDescription;
    const newDescription = currentDescription
      ? `${currentDescription}\n• ${suggestion}`
      : `• ${suggestion}`;
    setEditEventDescription(newDescription);
    toast.success('Suggestion added to description');
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(messages.filter((msg) => msg?._id?.toString() !== messageId));
    setSelectedMessageIds((prev) => prev.filter((id) => id !== messageId));
  };

  const handleSelectMessage = (messageId: string, checked: boolean) => {
    setSelectedMessageIds((prev) =>
      checked ? Array.from(new Set([...prev, messageId])) : prev.filter((id) => id !== messageId)
    );
  };

  const handleSelectAllVisible = () => {
    const visibleIds = paginatedMessages.map((message) => message._id.toString());
    setSelectedMessageIds(visibleIds);
  };

  const handleClearSelection = () => {
    setSelectedMessageIds([]);
  };

  const handleDeleteSelectedMessages = async () => {
    if (!selectedEventId || selectedMessageIds.length === 0) return;
    setIsDeletingMessages(true);
    try {
      for (const messageId of selectedMessageIds) {
        await axios.delete<ApiResponse>('/api/delete-message', {
          data: { messageId, eventId: selectedEventId },
        });
      }
      setMessages((prev) => prev.filter((msg) => !selectedMessageIds.includes(msg._id.toString())));
      setSelectedMessageIds([]);
      toast.success('Selected messages deleted');
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data.message || 'Failed to delete selected messages');
    } finally {
      setIsDeletingMessages(false);
    }
  };

  const { data: session } = useSession();
  const acceptMessageForm = useForm({
    resolver: zodResolver(acceptMessageSchema),
    defaultValues: {
      acceptMessages: true
    }
  });

  const { setValue, watch, register } = acceptMessageForm;
  const acceptMessages = watch('acceptMessages');

  const handleEditEvent = (eventId: string) => {
    const eventToEdit = events.find(e => e._id.toString() === eventId);
    if (eventToEdit) {
      setEditEventId(eventId);
      setEditEventName(eventToEdit.name);
      setEditEventDescription(eventToEdit.description || '');
      setEditResponsesLimit(eventToEdit.responsesLimit ? String(eventToEdit.responsesLimit) : '');
      setEditEventEndDate(formatDateForInput(eventToEdit.eventEndDate));
      setEditEventEndTime(eventToEdit.eventEndTime || '');
    }
  };

  const handleUpdateEvent = async () => {
    if (!editEventName.trim()) {
      toast.error("Please enter an event name");
      return;
    }

    setIsEditingEvent(true);
    try {
      const updatePayload = {
        name: editEventName,
        description: editEventDescription,
        responsesLimit: editResponsesLimit ? Number(editResponsesLimit) : undefined,
        eventEndDate: editEventEndDate || undefined,
        eventEndTime: editEventEndTime || undefined,
      };

      const parsed = eventSchema.safeParse(updatePayload);
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message || 'Invalid event data');
        return;
      }

      const response = await axios.put(`/api/update-event/${editEventId}`, parsed.data);

      if (response.data.success) {
        toast.success("Event updated successfully!");
        setEditEventId('');
        setEditEventName('');
        setEditEventDescription('');
        setEditResponsesLimit('');
        setEditEventEndDate('');
        setEditEventEndTime('');

        // Refresh events list
        await fetchEvents();
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data.message || "Failed to update event");
    } finally {
      setIsEditingEvent(false);
      setShowSuggestions(false);
    }
  };

  const handleCancelEdit = () => {
    setEditEventId('');
    setEditEventName('');
    setEditEventDescription('');
    setEditResponsesLimit('');
    setEditEventEndDate('');
    setEditEventEndTime('');
  };

  const handleDeleteEventConfirm = async (eventId: string) => {
    setIsDeletingEvent(true);
    try {
      const response = await axios.delete<ApiResponse>(`/api/delete-event/${eventId}`);
      if (response.data.success) {
        toast.success("Event deleted successfully");

        if (selectedEventId === eventId) {
          setSelectedEventId('');
          setMessages([]);
        }

        await fetchEvents();
      } else {
        toast.error(response.data.message || "Failed to delete event");
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data.message || "Failed to delete event");
    } finally {
      setIsDeletingEvent(false);
    }
  };

  const fetchEvents = useCallback(async () => {
    try {
      const response = await axios.get('/api/create-event');
      const fetchedEvents = response.data.events || [];
      setEvents(fetchedEvents);

      if (fetchedEvents.length > 0 && !selectedEventId) {
        setSelectedEventId(fetchedEvents[0]._id);
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data.message || "Could not fetch events");
    }
  }, [selectedEventId]);

  const createEvent = async (data: z.infer<typeof eventSchema>) => {
    setIsCreatingEvent(true);
    try {
      const eventEndDate = date ? date.toISOString().split('T')[0] : undefined;
      const eventEndTime = (document.getElementById('time-picker-optional') as HTMLInputElement)?.value || undefined;
      const responsesLimit = selectedResponsesNumber ? parseInt(selectedResponsesNumber) : undefined;

      const createPayload = {
        name: data.name,
        description: data.description,
        eventEndDate,
        eventEndTime,
        responsesLimit,
      };

      const parsed = eventSchema.safeParse(createPayload);
      if (!parsed.success) {
        parsed.error.issues.forEach((issue) => {
          const field = issue.path[0];
          if (field === 'name' || field === 'description') {
            eventForm.setError(field as 'name' | 'description', { message: issue.message });
          } else {
            toast.error(issue.message);
          }
        });
        return;
      }

      const response = await axios.post('/api/create-event', parsed.data);
      toast.success("Event created successfully!");
      eventForm.reset();
      setSelectedResponsesNumber(undefined);
      setDate(undefined);
      const timeInput = document.getElementById('time-picker-optional') as HTMLInputElement | null;
      if (timeInput) timeInput.value = '';
      await fetchEvents();
      setSelectedEventId(response.data.event._id);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data.message || "Failed to create event");
    } finally {
      setIsCreatingEvent(false);
      setShowSuggestions(false);
    }
  };

  const fetchAcceptMessages = useCallback(async () => {
    setIsSwitching(true);
    try {
      const response = await axios.get<ApiResponse>('/api/accept-messages');
      setValue('acceptMessages', response.data.isAcceptingMessages ?? false);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data.message || "Could not fetch message settings");
    } finally {
      setIsSwitching(false);
    }
  }, [setValue]);

  const fetchMessages = useCallback(async (refresh: boolean = false, eventId?: string) => {
    if (!eventId) return;

    setIsLoading(true);
    try {
      const response = await axios.get<ApiResponse>(`/api/create-event/${eventId}/messages`);
      setMessages(response.data.messages || []);
      if (refresh) {
        toast.success("Messages refreshed");
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data.message || "Could not fetch messages");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!session || !session.user) return;
    fetchEvents();
    fetchAcceptMessages();
  }, [session?.user?.email, fetchEvents, fetchAcceptMessages]);

  useEffect(() => {
    if (selectedEventId) {
      fetchMessages(false, selectedEventId);
    }
  }, [selectedEventId, fetchMessages]);

  useEffect(() => {
    setMessagesTimeLimit(undefined);
    setSelectedMessageIds([]);
    setCurrentPage(1);
  }, [selectedEventId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [messagesTimeLimit]);

  useEffect(() => {
    setIsMounted(true);
    if (session?.user && selectedEventId) {
      const { username } = session.user as User;
      const selectedEvent = events.find(e => e._id.toString() === selectedEventId);
      const eventSlug = selectedEvent?.slug || selectedEventId;
      setProfileUrl(`${window.location.protocol}//${window.location.host}/u/${username}/${eventSlug}`);
    }
  }, [session, selectedEventId, events]);

  const handleAcceptMessagesChange = async () => {
    try {
      const response = await axios.post<ApiResponse>('/api/accept-messages', {
        acceptingMessages: !acceptMessages
      });
      setValue('acceptMessages', !acceptMessages);
      toast.success(response.data.message);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data.message || "Could not update message settings");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileUrl);
    setIsCopied(true);
    toast.success("Event link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const copyMessagesLinkToClipboard = () => {
    const messagesLink = `${profileUrl}/messages`;
    navigator.clipboard.writeText(messagesLink);
    setIsMessagesLinkCopied(true);
    toast.success("Messages link copied to clipboard!");
    setTimeout(() => setIsMessagesLinkCopied(false), 2000);
  };

  const username = session?.user?.username ?? '';
  const selectedEvent = events.find(e => e._id.toString() === selectedEventId);
  const eventIsActive = selectedEvent?.isActive ?? true;
  const effectiveAcceptMessages = acceptMessages && eventIsActive;
  const messageCutoff = getMessageCutoff(messagesTimeLimit);
  const filteredMessages = messageCutoff
    ? messages.filter((message) => new Date(message.createdAt) >= messageCutoff)
    : messages;
  const totalPages = Math.max(1, Math.ceil(filteredMessages.length / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedMessages = filteredMessages.slice(startIndex, endIndex);
  const allVisibleSelected = paginatedMessages.length > 0 && paginatedMessages.every((message) => selectedMessageIds.includes(message._id.toString()));
  const endAt = selectedEvent?.eventEndDate
    ? new Date(selectedEvent.eventEndDate)
    : null;
  if (endAt && selectedEvent?.eventEndTime) {
    const [hours, minutes] = selectedEvent.eventEndTime.split(":").map(Number);
    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      endAt.setHours(hours, minutes, 0, 0);
    }
  }
  const limitReached = !!selectedEvent?.responsesLimit && messages.length >= selectedEvent.responsesLimit;
  const expired = !!endAt && endAt.getTime() <= Date.now();
  const statusLabel = limitReached
    ? "LIMIT REACHED"
    : expired
      ? "EXPIRED"
      : effectiveAcceptMessages
        ? "OPEN"
        : "CLOSED";

  useEffect(() => {
    if (!endAt) {
      setExpiresIn('');
      return;
    }

    const updateCountdown = () => {
      const now = Date.now();
      const diff = endAt.getTime() - now;
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

  useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(filteredMessages.length / pageSize));
    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    }
  }, [filteredMessages.length, currentPage, pageSize]);

  if (!isMounted || !session || !session.user) {
    return (
      <div className="flex flex-col items-center pt-30 gap-20 justify-center">
        <div className="flex flex-col space-y-3">
          <Skeleton className="h-[30vh] w-[50vw] rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <div className="flex flex-col space-y-3">
          <Skeleton className="h-[30vh] w-[50vw] rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }


  return (
    <TooltipProvider>
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6 pt-2">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {username}!</p>
          </div>

          <div className="lg:flex gap-5">
            {/* Create Event Card */}
            <Card className="md:flex-1 mb-6 lg:mb-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Event
                </CardTitle>
                <CardDescription>
                  Create an event to receive anonymous messages for specific occasions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={eventForm.handleSubmit(createEvent)} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Event Name (e.g., Birthday Party, Anonymous Feedback)"
                      {...eventForm.register('name')}
                      className="w-full"
                    />
                    {eventForm.formState.errors.name && (
                      <p className="text-red-500 text-xs mt-1">{eventForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                      <label className="text-sm font-medium">Description (optional)</label>
                      <div className="flex  gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGetDescriptionSuggestions(false)}
                          disabled={isFetchingSuggestion}
                          className="cursor-pointer text-xs flex-1"
                        >
                          {isFetchingSuggestion ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-1 h-3 w-3" />
                              Quick Questions
                            </>
                          )}
                        </Button>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-block">
                              <Button
                                type="button"
                                onClick={() => handleGetDescriptionSuggestions(true)}
                                disabled={
                                  aiIsGenerating ||
                                  isCheckingLimit ||
                                  (aiRemaining !== null && aiRemaining <= 0) ||
                                  (eventForm.watch('name')?.trim().length ?? 0) < 3
                                }
                                variant="default"
                                className="cursor-pointer flex-1"
                              >
                                {aiIsGenerating ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
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
                    </div>

                    <Textarea
                      placeholder="Add your event description less than 300 characters long..."
                      {...eventForm.register('description')}
                      className="w-full resize-none"
                      rows={4}
                    />
                    {eventForm.formState.errors.description && (
                      <p className="text-red-500 text-xs mt-1">{eventForm.formState.errors.description.message}</p>
                    )}

                    {/* Suggestion Pills */}
                    {showSuggestions && descriptionSuggestions.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">Click to add to description:</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setShowSuggestions(false);
                              setDescriptionSuggestions([]);
                            }}
                            className="h-6 px-2 text-xs"
                          >
                            Clear
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md bg-muted/50">
                          {descriptionSuggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleInsertSuggestion(suggestion)}
                              className="cursor-pointer text-xs h-auto py-1 px-2 whitespace-normal text-left"
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-5 items-center">
                    <div className=" flex flex-col items-center border text-center p-3 h-[14rem] w-full rounded-md gap-2">
                      <h3 className="text-sm">Responses Limit</h3>
                      <Separator />
                      <Select
                        value={selectedResponsesNumber}
                        onValueChange={setSelectedResponsesNumber}
                      >
                        <SelectTrigger className="w-full mt-10 max-w-64">
                          <SelectValue placeholder="Select number of responses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Responses</SelectLabel>
                            {Responses.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col border text-center p-3 w-full rounded-md gap-2">
                      <h3 className="text-sm">Accepting Responses Timing</h3>
                      <Separator />
                      <FieldGroup className="mx-auto max-w-xs flex-col">
                        <Field>
                          <FieldLabel htmlFor="date-picker-optional">End Date</FieldLabel>
                          <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                id="date-picker-optional"
                                className="w-32 justify-between font-normal"
                              >
                                {date ? format(date, "PPP") : "Select date"}
                                <ChevronDownIcon data-icon="inline-end" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={date}
                                captionLayout="dropdown"
                                defaultMonth={date}
                                onSelect={(date) => {
                                  setDate(date)
                                  setOpen(false)
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                        </Field>
                        <Field className="w-32">
                          <FieldLabel htmlFor="time-picker-optional">End Time</FieldLabel>
                          <Input
                            type="time"
                            id="time-picker-optional"
                            step="1"
                            defaultValue="10:30:00"
                            className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                          />
                        </Field>
                      </FieldGroup>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isCreatingEvent}
                    className="w-full md:w-auto mt-12 cursor-pointer"
                  >
                    {isCreatingEvent ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Event
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {events.length > 0 && (
              <Card className=" md:flex-1">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle>Event Settings</CardTitle>
                      <CardDescription>
                        Select an event to view its messages and get shareable link
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Expires in</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border bg-slate-50 text-slate-700 border-slate-200">
                        {expiresIn || 'Not set'}
                      </span>
                    </div>
                  </div>
                  <Separator />

                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between border border-gray-200 p-2 rounded-md">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Accept Messages</label>
                      <p className="text-xs text-muted-foreground">
                        {effectiveAcceptMessages
                          ? "Your event is currently open to receive anonymous messages."
                          : "Your event is currently closed to receiving messages."}
                      </p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide border ${
                          statusLabel === "OPEN"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : statusLabel === "CLOSED"
                              ? "bg-slate-100 text-slate-700 border-slate-200"
                              : statusLabel === "LIMIT REACHED"
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : "bg-rose-100 text-rose-700 border-rose-200"
                        }`}
                      >
                        {statusLabel}
                      </span>
                      <Switch
                        {...register('acceptMessages')}
                        checked={effectiveAcceptMessages}
                        onCheckedChange={handleAcceptMessagesChange}
                        disabled={isSwitching || !eventIsActive || limitReached || expired}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Event</label>
                    <div className="flex flex-col sm:flex-row  gap-2">
                      <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Choose an event" />
                        </SelectTrigger>
                        <SelectContent>
                          {events.map((event) => (
                            <SelectItem key={event._id.toString()} value={event._id.toString()}>
                              <div className="flex gap-3 items-center">
                                <span className="font-medium">{event.name}</span>
                                {event.description && (
                                  <span className="text-xs text-muted-foreground">
                                    {event.description.length > 20 ? event.description.substring(0, 20) + '...' : event.description}
                                  </span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex gap-2">
                        {/* Edit Event Dialog */}
                        {selectedEventId && (
                          <>
                            <Dialog open={editEventId === selectedEventId} onOpenChange={(open) => {
                              if (!open) handleCancelEdit();
                            }}>
                              <DialogTrigger asChild>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="cursor-pointer shrink-0"
                                      onClick={() => handleEditEvent(selectedEventId)}
                                    >
                                      <Edit2Icon className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit selected Event</TooltipContent>
                                </Tooltip>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                  <DialogTitle>Edit Event</DialogTitle>
                                  <DialogDescription>
                                    Update the event name and description below
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Event Name</label>
                                    <Input
                                      type="text"
                                      placeholder="Event Name"
                                      value={editEventName}
                                      onChange={(e) => setEditEventName(e.target.value)}
                                      className="w-full"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex flex-col sm:flex-row gap-2 items-center justify-between">
                                      <label className="text-sm font-medium">Description</label>
                                      <div className="flex gap-2">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleGetDescriptionSuggestionsForEdit(false)}
                                          disabled={isFetchingSuggestion}
                                          className="cursor-pointer text-xs flex-1"
                                        >
                                          {isFetchingSuggestion ? (
                                            <>
                                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                              Loading...
                                            </>
                                          ) : (
                                            <>
                                              <Plus className="mr-1 h-3 w-3" />
                                              Quick Questions
                                            </>
                                          )}
                                        </Button>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <span className="inline-block">
                                              <Button
                                                type="button"
                                                onClick={() => handleGetDescriptionSuggestionsForEdit(true)}
                                                disabled={aiIsGenerating || (aiRemaining !== null && aiRemaining <= 0) || isCheckingLimit }
                                                variant="default"
                                                className="cursor-pointer flex-1"
                                              >
                                                {aiIsGenerating ? (
                                                  <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Generating...
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
                                    </div>

                                    <Textarea
                                      placeholder="Description (optional)"
                                      value={editEventDescription}
                                      onChange={(e) => setEditEventDescription(e.target.value)}
                                      className="w-full resize-none"
                                      rows={4}
                                    />

                                    {/* Suggestion Pills for Edit */}
                                    {showSuggestions && descriptionSuggestions.length > 0 && (
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                          <p className="text-xs text-muted-foreground">Click to add to description:</p>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setShowSuggestions(false);
                                              setDescriptionSuggestions([]);
                                            }}
                                            className="h-6 px-2 text-xs"
                                          >
                                            Clear
                                          </Button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md bg-muted/50">
                                          {descriptionSuggestions.map((suggestion, index) => (
                                            <Button
                                              key={index}
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleInsertSuggestionToEdit(suggestion)}
                                              className="cursor-pointer text-xs h-auto py-1 px-2 whitespace-normal text-left"
                                            >
                                              {suggestion}
                                            </Button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Responses Limit (optional)</label>
                                    <Input
                                      type="number"
                                      min={1}
                                      max={10000}
                                      placeholder="e.g., 100"
                                      value={editResponsesLimit}
                                      onChange={(e) => setEditResponsesLimit(e.target.value)}
                                      className="w-full"
                                    />
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">End Date (optional)</label>
                                      <Input
                                        type="date"
                                        value={editEventEndDate}
                                        onChange={(e) => setEditEventEndDate(e.target.value)}
                                        className="w-full"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <label className="text-sm font-medium">End Time (optional)</label>
                                      <Input
                                        type="time"
                                        value={editEventEndTime}
                                        onChange={(e) => setEditEventEndTime(e.target.value)}
                                        className="w-full"
                                      />
                                    </div>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    className="cursor-pointer"
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleUpdateEvent}
                                    disabled={isEditingEvent || !editEventName.trim()}
                                    className="cursor-pointer"
                                  >
                                    {isEditingEvent ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                      </>
                                    ) : (
                                      'Update Event'
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {/* Delete Event Button */}
                            <AlertDialog>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      className="cursor-pointer shrink-0"
                                      disabled={isDeletingEvent}
                                    >
                                      {isDeletingEvent ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>Delete selected Event</TooltipContent>
                              </Tooltip>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Event?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{selectedEvent?.name}"? This will permanently delete the event and all its messages. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteEventConfirm(selectedEventId)}
                                    className="bg-destructive text-white hover:bg-destructive/90 cursor-pointer"
                                  >
                                    Delete Event
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>

                    </div>
                  </div>

                  {selectedEventId && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium pt-2">Public Messages Link</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          type="text"
                          value={isMounted ? `${profileUrl}/messages` : ''}
                          disabled
                          className="flex-1"
                          suppressHydrationWarning
                        />
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={copyMessagesLinkToClipboard}
                                variant="outline"
                                className="cursor-pointer w-[15vw] sm:w-auto"
                              >
                                {isMessagesLinkCopied ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isMessagesLinkCopied ? 'Copied!' : 'Copy public messages link'}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Share this link to let others view messages for this event
                      </p>
                      <label className="text-sm font-medium">Shareable Event Link</label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          type="text"
                          value={isMounted ? profileUrl : ''}
                          disabled
                          className="flex-1"
                          suppressHydrationWarning
                        />
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={copyToClipboard}
                                variant="outline"
                                className="cursor-pointer w-[15vw] sm:w-auto"
                              >
                                {isCopied ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isCopied ? 'Copied!' : 'Copy event link to clipboard'}
                            </TooltipContent>
                          </Tooltip>
                          <Button
                            onClick={handleGenerateQRCode}
                            variant="outline"
                            className="cursor-pointer w-[63vw] sm:w-auto"
                            disabled={isGeneratingQRCode}
                          >
                            {isGeneratingQRCode ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Generating...
                              </>
                            ) : qrCodeGenerated ? (
                              showQRCode ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Hide QR Code
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Show QR Code
                                </>
                              )
                            ) : (
                              <>
                                <QrCode className="h-4 w-4 mr-2" />
                                Generate QR Code
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Share this link to receive anonymous messages for this event
                      </p>
                      {showQRCode && qrCodeGenerated && (
                        <div className="mt-4 flex justify-center items-center gap-8 p-2 border rounded-lg bg-muted/30">
                          <div className="">
                            <img
                              src={qrCodeSrc}
                              alt="QR code for event link"
                              className="mx-auto w-32 border-4 border-white rounded-lg shadow-lg"
                              id="qr-code-image"
                            />
                          </div>
                          <div>
                            <p className="text-xs pb-2 text-muted-foreground">
                              Scan this QR code to send anonymous messages
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = qrCodeSrc;
                                link.download = `${selectedEvent?.name || 'event'}-qr-code.png`;
                                link.click();
                                toast.success('QR Code downloaded!');
                              }}
                              className="cursor-pointer"
                            >
                              Download QR Code
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {selectedEventId && (
            <Card className="border-muted/60 shadow-sm">
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle>Messages</CardTitle>
                    <CardDescription>
                      {events.find(e => e._id.toString() === selectedEventId)?.name} · {filteredMessages.length} message(s)
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      fetchMessages(true, selectedEventId);
                    }}
                    disabled={isLoading}
                    className="cursor-pointer w-full sm:w-auto"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">Refresh</span>
                  </Button>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap gap-2 items-center">
                    <Select
                      value={messagesTimeLimit}
                      onValueChange={setMessagesTimeLimit}
                    >
                      <SelectTrigger className="w-full sm:w-56">
                        <SelectValue placeholder="Filter by time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Filter Time</SelectLabel>
                          {ReceiveMessageTime.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={allVisibleSelected ? handleClearSelection : handleSelectAllVisible}
                      className="cursor-pointer"
                      disabled={filteredMessages.length === 0}
                    >
                      {allVisibleSelected ? 'Clear selection' : 'Select all'}
                    </Button>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="cursor-pointer w-full sm:w-auto"
                        disabled={selectedMessageIds.length === 0 || isDeletingMessages}
                      >
                        {isDeletingMessages ? 'Deleting...' : `Delete selected (${selectedMessageIds.length})`}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete selected messages?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the selected messages. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSelectedMessages} className="cursor-pointer">
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {paginatedMessages.length > 0 ? (
                    paginatedMessages.map((message) => (
                      <MessageCard
                        key={message._id?.toString()}
                        message={message}
                        onMessageDelete={handleDeleteMessage}
                        eventId={selectedEventId}
                        isSelected={selectedMessageIds.includes(message._id.toString())}
                        onSelectChange={handleSelectMessage}
                      />
                    ))
                  ) : (
                    <div className="col-span-2 text-center py-12">
                      <p className="text-muted-foreground">
                        No messages yet. Share your event link to start receiving messages!
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
                  <p className="text-xs text-muted-foreground">
                    Showing {paginatedMessages.length} of {filteredMessages.length} messages
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPageSafe <= 1}
                      className="cursor-pointer"
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      Page {currentPageSafe} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPageSafe >= totalPages}
                      className="cursor-pointer"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {events.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <LayoutDashboardIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first event to start receiving anonymous messages
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Dashboard;