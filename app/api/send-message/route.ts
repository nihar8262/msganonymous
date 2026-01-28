import dbConnect from "@/lib/dbconnect";
import { getClientIP } from "@/lib/ExtractIP";
import AnonymousUsageModel from "@/model/AnonymousUsage";
import { userModel, EventModel, Message } from "@/model/User";
import mongoose from "mongoose";

const getEventEndAt = (eventEndDate?: Date, eventEndTime?: string) => {
  if (!eventEndDate && !eventEndTime) return null;

  const baseDate = eventEndDate ? new Date(eventEndDate) : new Date();
  if (Number.isNaN(baseDate.getTime())) return null;

  if (eventEndTime) {
    const [hours, minutes] = eventEndTime.split(":").map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
    const combined = new Date(baseDate);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }

  const endOfDay = new Date(baseDate);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { username, content, eventId, fingerprint } = await request.json();

    if (!content || content.trim() === "") {
      return Response.json(
        { success: false, message: "Message content is required" },
        { status: 400 }
      );
    }

    if (!eventId) {
      return Response.json(
        { success: false, message: "Event ID is required" },
        { status: 400 }
      );
    }

    const user = await userModel.findOne({ username });

    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (!user.isVerified) {
      return Response.json(
        { success: false, message: "User is not verified" },
        { status: 403 }
      );
    }

    if (!user.isAcceptingMessages) {
      return Response.json(
        { success: false, message: "User is not accepting messages" },
        { status: 403 }
      );
    }

    const event = await EventModel.findOne({
      _id: eventId,
      userId: user._id,
      isActive: true,
    });

    if (!event) {
      return Response.json(
        { success: false, message: "Event not found or inactive" },
        { status: 404 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const ip = getClientIP(request);
    const identifier = fingerprint || ip || 'unknown';
    const scope = `msg:${eventId}`;

    const existingUsage = await AnonymousUsageModel.findOne({
      identifier,
      date: today,
      scope,
    });

    if (existingUsage && existingUsage.count >= 1) {
      return Response.json(
        {
          success: false,
          message: "You can only send one message per day for this event. Try again in 24 hours.",
        },
        { status: 429 }
      );
    }

    const endAt = getEventEndAt(event.eventEndDate, event.eventEndTime);
    if (endAt && endAt.getTime() <= Date.now()) {
      event.isActive = false;
      await event.save();
      return Response.json(
        { success: false, message: "Event is no longer accepting messages" },
        { status: 403 }
      );
    }

    if (event.responsesLimit && event.messages.length >= event.responsesLimit) {
      event.isActive = false;
      await event.save();
      return Response.json(
        { success: false, message: "Response limit reached" },
        { status: 403 }
      );
    }

    // Push plain object - Mongoose will convert it to a Message document
    event.messages.push({
      content,
      createdAt: new Date(),
    });

    if (event.responsesLimit && event.messages.length >= event.responsesLimit) {
      event.isActive = false;
    }

    await event.save();

    await AnonymousUsageModel.findOneAndUpdate(
      {
        identifier,
        date: today,
        scope,
      },
      {
        $inc: { count: 1 },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true, new: true }
    );

    return Response.json(
      { success: true, message: "Message sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending message:", error);
    return Response.json(
      { success: false, message: "Failed to send message" },
      { status: 500 }
    );
  }
}
