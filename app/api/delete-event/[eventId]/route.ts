import dbConnect from "@/lib/dbconnect";
import {EventModel, userModel} from "@/model/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/option";

export async function DELETE(request: Request, { params }: { params: Promise<{ eventId: string }> }) {
  await dbConnect;

  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!session || !user) {
    return Response.json(
      { success: false, message: "Not authenticated" },
      { status: 401 }
    );
  }

  try {
    const { eventId } = await params;

    if (!eventId) {
      return Response.json(
        { success: false, message: "Event ID is required" },
        { status: 400 }
      );
    }

    const deletedEvent = await EventModel.findOneAndDelete({
      _id: eventId,
      userId: user._id,
    });

    if (!deletedEvent) {
      return Response.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    await userModel.findByIdAndUpdate(user._id, {
      $pull: { events: eventId },
    });

    return Response.json(
      {
        success: true,
        message: "Event deleted successfully",
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error("Error deleting event:", error);
    return Response.json(
      { success: false, message: "Error deleting event" },
      { status: 500 }
    );
  }
}
