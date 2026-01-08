import dbConnect from "@/lib/dbconnect";
import userModel from "@/model/User";
import { sendVerificationEmail } from "@/helpers/sendVerificationEmails";
import bcrypt from "bcryptjs";
import { success } from "zod";
import { use } from "react";

export async function POST(request: Request) {
    await dbConnect();
  try{
    const { username, email, password } = await request.json();

    const existingUserVerifiedByUsername = await userModel.findOne({ username, isVerified: true });

    if(existingUserVerifiedByUsername){
        return Response.json(
            {
                success: false,
                message: "Username is already taken"
            },
            { status: 400 }
        );
    }

    const existingUserVerifiedByEmail = await userModel.findOne({ email });
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

    if(existingUserVerifiedByEmail){
        if(existingUserVerifiedByEmail.isVerified){
            return Response.json(
                {
                    success: false,
                    message: "Email is already registered and verified"
                },
                { status: 400 }
            );
        }else{
            existingUserVerifiedByEmail.username = username;
            const hashedPassword = await bcrypt.hash(password, 10);
            existingUserVerifiedByEmail.password = hashedPassword;
            existingUserVerifiedByEmail.verificationToken = verificationToken;
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 1); // Token valid for 1 hour
            existingUserVerifiedByEmail.TokenExpiry = expiryDate;

            await existingUserVerifiedByEmail.save();
        }       
    }else{
        const hashedPassword = await bcrypt.hash(password, 10);
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1); // Token valid for 1 hour

        const newUser = new userModel({
            username,
            email,
            password: hashedPassword,
            verificationToken,
            TokenExpiry: expiryDate,
            isVerified: false,
            isAcceptingMessages: true,
            messages: []
        });

        await newUser.save();
    }

    const emailResponse =  await sendVerificationEmail(username, email, verificationToken);

    if(emailResponse.success){
        return Response.json(
            {
                success: true,
                message: "User registered successfully. Please check your email for the verification code."
            },
            { status: 201 }
        );
    }else{
        return Response.json(
            {
                success: false,
                message: emailResponse.message
            },
            { status: 500 }
        );
    }


  } catch (error) {
    console.error("Error in sign-up route:", error);
    return  Response.json( 
        {
            success:false,
            message: "Internal Server Error"
        },
        { status: 500 });
  }                                     
}