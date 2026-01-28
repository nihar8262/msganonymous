import dbConnect from "@/lib/dbconnect";
import { EventModel } from "@/model/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/option";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!session || !user) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  const { eventId } = await params;

  try {
    const { name, description, eventEndDate, eventEndTime, responsesLimit } = await request.json();

    if (!name || name.trim() === "") {
      return Response.json(
        { success: false, message: "Event name is required" },
        { status: 400 }
      );
    }

    // Create new slug from updated name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists for this user (excluding current event)
    const existingEvent = await EventModel.findOne({
      userId: user._id,
      slug: slug,
      _id: { $ne: eventId }, // Exclude current event from check
    });

    if (existingEvent) {
      return Response.json(
        { success: false, message: "An event with this name already exists" },
        { status: 400 }
      );
    }

    // Find and update event (ensure it belongs to the user)
    const updatedEvent = await EventModel.findOneAndUpdate(
      {
        _id: eventId,
        userId: user._id,
      },
      {
        name,
        slug,
        description: description || "",
        responsesLimit: responsesLimit ?? undefined,
        eventEndDate: eventEndDate ? new Date(eventEndDate) : undefined,
        eventEndTime: eventEndTime ?? undefined,
      },
      { new: true } // Return the updated document
    );

    if (!updatedEvent) {
      return Response.json(
        { success: false, message: "Event not found or unauthorized" },
        { status: 404 }
      );
    }

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

    const endAt = getEventEndAt(updatedEvent.eventEndDate, updatedEvent.eventEndTime);
    const limitReached = updatedEvent.responsesLimit
      ? updatedEvent.messages.length >= updatedEvent.responsesLimit
      : false;
    const timeExpired = endAt ? endAt.getTime() <= Date.now() : false;
    const shouldBeActive = !limitReached && !timeExpired;

    if (updatedEvent.isActive !== shouldBeActive) {
      updatedEvent.isActive = shouldBeActive;
      await updatedEvent.save();
    }

    return Response.json(
      {
        success: true,
        message: "Event updated successfully",
        event: updatedEvent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating event:", error);
    return Response.json(
      { success: false, message: "Error updating event" },
      { status: 500 }
    );
  }
}