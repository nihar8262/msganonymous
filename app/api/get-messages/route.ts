import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/option";
import dbConnect from "@/lib/dbconnect";
import userModel from "@/model/User";
import { User } from "next-auth";
import mongoose from "mongoose";

export async function GET(request: Request) {
    await dbConnect();
        
        const session = await getServerSession(authOptions);
        const user: User = session?.user as User;
    
        if(!session || !session?.user){
            return Response.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }
    
        const userId = new mongoose.Types.ObjectId(user?._id);

        try {
            const user = await userModel.aggregate([
                { $match: { _id: userId } },
                { $unwind: "$messages" },
                { $sort: { "messages.createdAt": -1 } },
                { $group: {
                    _id: "$_id",
                    messages: { $push: "$messages" }
                }},
            ])

            if(!user || user.length === 0){
                return Response.json(
                    { success: false, message: "User not found" },
                    { status: 404 }
                );
            }

            return Response.json(
                {
                    success: true,
                    message: "Messages fetched successfully",
                    messages: user[0].messages
                },
                { status: 200 }
            );
        } catch (error) {
            console.error("Error fetching messages:", error);
        return Response.json(
            { success: false, message: "Failed to fetch messages" },
            { status: 500 }
        );
        }
}