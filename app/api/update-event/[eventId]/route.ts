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
    const { name, description } = await request.json();

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
      },
      { new: true } // Return the updated document
    );

    if (!updatedEvent) {
      return Response.json(
        { success: false, message: "Event not found or unauthorized" },
        { status: 404 }
      );
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