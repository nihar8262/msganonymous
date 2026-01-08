import dbConnect from "@/lib/dbconnect";
import UserModel from "@/model/User";

export async function POST(request: Request) {
  await dbConnect();

  try{
    const {username, verificationToken} = await request.json();

    const decodedUsername = decodeURIComponent(username);
    const user = await UserModel.findOne({ username: decodedUsername });

    if(!user){
        return Response.json(
            {
                success: false,
                message: "User not found",
            },
            {status:404}
        );
    }

    if(!user.verificationToken || !user.TokenExpiry){
        return Response.json(
            {
                success: false,
                message: "No verification token found for this user",
            },
            {status:400}
        );
    }

    const isCodeValid = user.verificationToken === verificationToken;
    const isCodeNotExpired = new Date(user.TokenExpiry) > new Date() ;

    if(isCodeValid && isCodeNotExpired){
        user.isVerified = true;
        await user.save();

        return Response.json(
            {
                success: true,
                message: "User verified successfully",
            },
            {status:200}
        );
    }else if(!isCodeNotExpired){
        return Response.json(
            {
                success: false,
                message: "Verification code has expired, please sign up again to get a new code",
            },
            {status:400}
        );
    }else {
        return Response.json(
            {
                success: false,
                message: "Invalid verification code",
            },
            {status:400}
        );
    }
  }
  catch (error) {
        console.error("Error verifying code:", error);
    return  Response.json(
        {
        success: false,
        message: "Error verifying code",
      },
      { status: 500 }
    );
  }
}