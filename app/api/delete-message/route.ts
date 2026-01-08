import dbConnect from "@/lib/dbconnect";
import { EventModel } from "@/model/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/option";

export async function DELETE(request: Request) {
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
    const { eventId, messageId } = await request.json();

    if (!eventId || !messageId) {
      return Response.json(
        { success: false, message: "Event ID and Message ID are required" },
        { status: 400 }
      );
    }

    // Find event and verify ownership
    const event = await EventModel.findOne({
      _id: eventId,
      userId: user._id,
    });

    if (!event) {
      return Response.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    const messageExists = event.messages.some(
      (msg) => msg._id?.toString() === messageId
    );

    if (!messageExists) {
      return Response.json(
        { success: false, message: "Message not found" },
        { status: 404 }
      );
    }

    // Remove message using Mongoose pull() method
    event.messages.pull({ _id: messageId });

    await event.save();

    return Response.json(
      {
        success: true,
        message: "Message deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting message:", error);
    return Response.json(
      { success: false, message: "Error deleting message" },
      { status: 500 }
    );
  }
}