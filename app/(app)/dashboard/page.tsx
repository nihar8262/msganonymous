"use client";

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getFingerprint } from '@/lib/fingerprint';
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
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
  const [newEventName, setNewEventName] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [editEventId, setEditEventId] = useState<string>('');
  const [editEventName, setEditEventName] = useState('');
  const [editEventDescription, setEditEventDescription] = useState('');
  const [isCopied, setIsCopied] = useState(false);
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
        eventName: newEventName, // Pass the event name being created
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
    const currentDescription = newEventDescription;
    const newDescription = currentDescription
      ? `${currentDescription}\n• ${suggestion}`
      : `• ${suggestion}`;
    setNewEventDescription(newDescription);
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
  };

  const { data: session } = useSession();
  const form = useForm({
    resolver: zodResolver(acceptMessageSchema),
    defaultValues: {
      acceptMessages: true
    }
  });

  const { setValue, watch, register } = form;
  const acceptMessages = watch('acceptMessages');

  const handleEditEvent = (eventId: string) => {
    const eventToEdit = events.find(e => e._id.toString() === eventId);
    if (eventToEdit) {
      setEditEventId(eventId);
      setEditEventName(eventToEdit.name);
      setEditEventDescription(eventToEdit.description || '');
    }
  };

  const handleUpdateEvent = async () => {
    if (!editEventName.trim()) {
      toast.error("Please enter an event name");
      return;
    }

    setIsEditingEvent(true);
    try {
      const response = await axios.put(`/api/update-event/${editEventId}`, {
        name: editEventName,
        description: editEventDescription
      });

      if (response.data.success) {
        toast.success("Event updated successfully!");
        setEditEventId('');
        setEditEventName('');
        setEditEventDescription('');

        // Refresh events list
        await fetchEvents();
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data.message || "Failed to update event");
    } finally {
      setIsEditingEvent(false);
    }
  };

  const handleCancelEdit = () => {
    setEditEventId('');
    setEditEventName('');
    setEditEventDescription('');
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

  const createEvent = async () => {
    if (!newEventName.trim()) {
      toast.error("Please enter an event name");
      return;
    }

    setIsCreatingEvent(true);
    try {
      const response = await axios.post('/api/create-event', {
        name: newEventName,
        description: newEventDescription
      });

      toast.success("Event created successfully!");
      setNewEventName('');
      setNewEventDescription('');

      await fetchEvents();
      setSelectedEventId(response.data.event._id);
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data.message || "Failed to create event");
    } finally {
      setIsCreatingEvent(false);
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

  const { username } = session?.user as User;
  const selectedEvent = events.find(e => e._id.toString() === selectedEventId);

  return (
    <TooltipProvider>
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6 pt-10">
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Event Name (e.g., Birthday Party, Anonymous Feedback)"
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                      className="w-full"
                    />
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
                                disabled={aiIsGenerating || isCheckingLimit || (aiRemaining !== null && aiRemaining <= 0)}
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
                      placeholder="Add questions or prompts to guide message senders..."
                      value={newEventDescription}
                      onChange={(e) => setNewEventDescription(e.target.value)}
                      className="w-full resize-none"
                      rows={4}
                    />

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

                  <Button
                    onClick={createEvent}
                    disabled={isCreatingEvent || !newEventName.trim()}
                    className="w-full md:w-auto cursor-pointer"
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
                </div>
              </CardContent>
            </Card>

            {events.length > 0 && (
              <Card className=" md:flex-1">
                <CardHeader>
                  <CardTitle>Event Settings</CardTitle>
                  <CardDescription>
                    Select an event to view its messages and get shareable link
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="cursor-pointer shrink-0"
                                  onClick={() => handleEditEvent(selectedEventId)}
                                >
                                  <Edit2Icon className="h-4 w-4" />
                                </Button>
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
                                                disabled={aiIsGenerating || (aiRemaining !== null && aiRemaining <= 0) || isCheckingLimit}
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
                        <div className="mt-4 flex justify-center p-4 border rounded-lg bg-muted/30">
                          <div className="text-center space-y-3">
                            <img
                              src={qrCodeSrc}
                              alt="QR code for event link"
                              className="mx-auto border-4 border-white rounded-lg shadow-lg"
                              id="qr-code-image"
                            />
                            <p className="text-xs text-muted-foreground">
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

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Accept Messages</label>
                      <p className="text-xs text-muted-foreground">
                        Allow people to send you anonymous messages
                      </p>
                    </div>
                    <Switch
                      {...register('acceptMessages')}
                      checked={acceptMessages}
                      onCheckedChange={handleAcceptMessagesChange}
                      disabled={isSwitching}
                      className="cursor-pointer"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {selectedEventId && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Messages</CardTitle>
                    <CardDescription>
                      {events.find(e => e._id.toString() === selectedEventId)?.name} - {messages.length} message(s)
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      fetchMessages(true, selectedEventId);
                    }}
                    disabled={isLoading}
                    className="cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {messages.length > 0 ? (
                    messages.map((message) => (
                      <MessageCard
                        key={message._id?.toString()}
                        message={message}
                        onMessageDelete={handleDeleteMessage}
                        eventId={selectedEventId}
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