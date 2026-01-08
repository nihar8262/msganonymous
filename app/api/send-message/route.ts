import dbConnect from "@/lib/dbconnect";
import { userModel, EventModel, Message } from "@/model/User";
import mongoose from "mongoose";

export async function POST(request: Request) {
  await dbConnect();

  try {
    const { username, content, eventId } = await request.json();

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

    // Push plain object - Mongoose will convert it to a Message document
   event.messages.push({
  content,
  createdAt: new Date(),
});

    await event.save();

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
