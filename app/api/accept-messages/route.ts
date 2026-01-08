import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/option";
import dbConnect from "@/lib/dbconnect";
import userModel from "@/model/User";
import { User } from "next-auth";

export async function POST(request: Request) {
    await dbConnect();
    
    const session = await getServerSession(authOptions);
    const user: User = session?.user as User;

    if(!session || !session?.user){
        return Response.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    }

    const userId = user?._id;
    const {acceptingMessages} = await request.json();

    try {
        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            { isAcceptingMessages: acceptingMessages },
            { new: true }
        );

        if (!updatedUser) {
            return Response.json(
                { success: false, message: "User not found" },
                { status: 401 }
            );
        }

        return Response.json(
            {
                success: true,
                message: "Accepting messages updated successfully",
                isAcceptingMessages: updatedUser.isAcceptingMessages,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error updating accepting messages:", error);
        return Response.json(
            { success: false, message: "failed to update accepting messages" },
            { status: 500 }
        );
    }
}

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

    const userId = user?._id;

    try {
        const foundUser = await userModel.findById(userId);
    
        if (!foundUser) {
                return Response.json(
                    { success: false, message: "User not found" },
                    { status: 404 }
                );
            }
    
        return Response.json(
                    { success: true, isAcceptingMessages: foundUser.isAcceptingMessages },
                    { status: 200 }
                );
    } catch (error) {
        console.error("error in accepting messages status", error);
        return Response.json(
            { success: false, message: "error in accepting messages status" },
            { status: 500 }
        );
    }
}