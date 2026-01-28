'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
} from "@/components/ui/alert-dialog"
import { Button } from "./ui/button"
import { X } from "lucide-react"
import { Message } from "@/model/User"
import { toast } from "sonner"
import axios, { AxiosError } from "axios"
import { ApiResponse } from "@/types/ApiResponse"
import dayjs from "dayjs"

type MessageCardProps = {
  message: Message;
  onMessageDelete: (messageId: string) => void;
  eventId: string | null; // Add eventId prop
  isSelected?: boolean;
  onSelectChange?: (messageId: string, checked: boolean) => void;
}

export function MessageCard({ message, onMessageDelete, eventId, isSelected = false, onSelectChange }: MessageCardProps) {

  const handleDeleteConfirm = async () => {
    try {
      const response = await axios.delete<ApiResponse>('/api/delete-message', {
        data: { 
          messageId: message._id,
          eventId: eventId 
        }
      });
      toast.success(response.data.message);
      onMessageDelete(message._id.toString());
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>;
      toast.error(axiosError.response?.data.message ?? 'Failed to delete message');
    }
  };

  return (
    <Card className="border-muted/60 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="space-y-2">
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {onSelectChange && (
              <input
                type="checkbox"
                aria-label="Select message"
                checked={isSelected}
                onChange={(e) => onSelectChange(message._id.toString(), e.target.checked)}
                className="mt-1 accent-primary"
              />
            )}
            <CardTitle className="text-base leading-relaxed break-words">
              {message.content}
            </CardTitle>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant='destructive' size="icon" className="cursor-pointer">
                <X className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  this message.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm} className="cursor-pointer">
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          {dayjs(message.createdAt).format('MMM D, YYYY h:mm A')}
        </CardDescription>
      </CardHeader>
      {/* <CardContent className="pt-0" /> */}
    </Card>
  );
}