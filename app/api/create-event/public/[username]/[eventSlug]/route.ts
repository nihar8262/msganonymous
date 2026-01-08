import dbConnect from "@/lib/dbconnect";
import { EventModel, userModel } from "@/model/User";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string; eventSlug: string }> }
) {
  await dbConnect();

  const { username, eventSlug } = await params;

  try {
    // Find user first
    const user = await userModel.findOne({ username });

    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Find event by slug and userId
    const event = await EventModel.findOne({
      userId: user._id,
      slug: eventSlug,
      isActive: true,
    }).select("-messages"); // Don't send messages in public API

    if (!event) {
      return Response.json(
        { success: false, message: "Event not found or inactive" },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        event: {
          _id: event._id,
          name: event.name,
          slug: event.slug,
          description: event.description,
          isActive: event.isActive,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching event:", error);
    return Response.json(
      { success: false, message: "Error fetching event" },
      { status: 500 }
    );
  }
}