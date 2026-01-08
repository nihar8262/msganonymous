import dbConnect from "@/lib/dbconnect";
import {EventModel} from "@/model/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/option";

export async function GET(
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
    // Find event and verify ownership
    const event = await EventModel.findOne({
      _id: eventId,
      userId: user._id,
    }).select('messages');

    if (!event) {
      return Response.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        messages: event.messages ,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching messages:", error);
    return Response.json(
      { success: false, message: "Error fetching messages" },
      { status: 500 }
    );
  }
}