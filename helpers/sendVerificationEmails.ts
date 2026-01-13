import { resend } from "../lib/resend";
import VerificationEmail from "../emails/verificationEmails";
import { ApiResponse } from "../types/ApiResponse";

export async function sendVerificationEmail(
  username: string,
  email: string,
  verifyCode: string
): Promise<ApiResponse> {
  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "Verification Code",
      react: VerificationEmail({ username, otp: verifyCode }),
    });

    return {
      success: true,
      message: "Verification email sent successfully.",
    };
  } catch (error) {
    console.error("Error sending verification email:", error);
    console.error("Error details:", JSON.stringify(error, null, 2));
    return {
      success: false,
      message: "Failed to send verification email.",
    };
  }
}
