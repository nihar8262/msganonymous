import dbConnect from "@/lib/dbconnect";
import { EventModel, userModel } from "@/model/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/option";

export async function POST(request: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!session || !user) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const { name, description, responsesLimit, eventEndDate, eventEndTime } = await request.json();

    if (!name || name.trim() === "") {
      return Response.json(
        { success: false, message: "Event name is required" },
        { status: 400 }
      );
    }

    // Create slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists for this user
    const existingEvent = await EventModel.findOne({
      userId: user._id,
      slug: slug,
    });

    if (existingEvent) {
      return Response.json(
        { success: false, message: "An event with this name already exists" },
        { status: 400 }
      );
    }

    // Create event
    const newEvent = await EventModel.create({
      name,
      slug,
      description: description || "",
      userId: user._id,
      messages: [],
      isActive: true,
      responsesLimit: responsesLimit ?? undefined,
      eventEndDate: eventEndDate ? new Date(eventEndDate) : undefined,
      eventEndTime: eventEndTime ?? undefined,
    });

    // Add event reference to user
    await userModel.findByIdAndUpdate(user._id, {
      $push: { events: newEvent._id },
    });

    return Response.json(
      {
        success: true,
        message: "Event created successfully",
        event: newEvent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating event:", error);
    return Response.json(
      { success: false, message: "Error creating event" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!session || !user) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const events = await EventModel.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .select("-messages"); // Don't load all messages, just event info

    return Response.json(
      {
        success: true,
        events,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching events:", error);
    return Response.json(
      { success: false, message: "Error fetching events" },
      { status: 500 }
    );
  }
}