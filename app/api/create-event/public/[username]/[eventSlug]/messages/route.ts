import dbConnect from "@/lib/dbconnect";
import { EventModel, userModel } from "@/model/User";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string; eventSlug: string }> }
) {
  await dbConnect();

  const { username, eventSlug } = await params;

  try {
    const user = await userModel.findOne({ username });

    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const event = await EventModel.findOne({
      userId: user._id,
      slug: eventSlug,
    }).select("name slug description isActive messages responsesLimit eventEndDate eventEndTime");

    if (!event) {
      return Response.json(
        { success: false, message: "Event not found" },
        { status: 404 }
      );
    }

    const messages = (event.messages || []).
      sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return Response.json(
      {
        success: true,
        event: {
          _id: event._id,
          name: event.name,
          slug: event.slug,
          description: event.description,
          isActive: event.isActive,
          responsesLimit: event.responsesLimit,
          eventEndDate: event.eventEndDate,
          eventEndTime: event.eventEndTime,
        },
        messages,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching public messages:", error);
    return Response.json(
      { success: false, message: "Error fetching messages" },
      { status: 500 }
    );
  }
}
