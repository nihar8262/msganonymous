import dbConnect from "@/lib/dbconnect";
import UserModel from "@/model/User";
import z from "zod";
import { userNameValidation } from "@/schema/signUpSchema";

const UsernameQuerySchema = z.object({
  username: userNameValidation,
});

export async function GET(request: Request) {
  await dbConnect();

  try {
    const {searchParams} = new URL(request.url);
    const querySchema = { 
        username : searchParams.get("username")
    };
    const result =  UsernameQuerySchema.safeParse(querySchema);
    console.log("Parsed result:", result); //Remove this line after debugging

    if(!result.success){
        const errors = result.error.format().username?._errors || [];
        return Response.json(
            {
                success: false,
                message: errors && errors.length > 0 ? errors[0] : "Invalid username format.",
            },
            {status: 400}
        ); 
    }

    const { username } = result.data;
    
    const existingVerifiedUser = await UserModel.findOne({ username: username, isVerified: true });
    console.log("Existing verified user:", existingVerifiedUser); //Remove this line after debugging

    if (existingVerifiedUser) {
      return Response.json(
        {
          success: false,
          message: "Username is already taken.",
        },
        {status:400}
      );
    } 
      return Response.json(
        {
          success: true,
          message: "Username is available.",
        },
        {status: 200}
      );

  } catch (error) {
    console.error("Error checking username uniqueness:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to check username uniqueness.",
      },
      {}
    );
  }
}
