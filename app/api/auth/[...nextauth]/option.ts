import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbconnect";
import UserModel from "@/model/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any): Promise<any> {
        await dbConnect();

        try {
          const user = await UserModel.findOne({
            $or: [
              { email: credentials.identifier },
              { username: credentials.identifier },
            ],
          });
          if (!user) {
            throw new Error("No user found with the given email or username");
          }
          if (!user.password) {
            throw new Error(
              "This account uses OAuth sign-in. Please sign in with your OAuth provider."
            );
          }
          if (!user.isVerified) {
            throw new Error(
              "User email is not verified. Please verify your email before logging in."
            );
          }
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );
          if (isPasswordValid) {
            return user;
          } else {
            throw new Error("Invalid password");
          }
        } catch (error) {
          throw new Error("Error fetching user from database");
        }
      },
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle OAuth sign in
      if (account?.provider !== "credentials") {
        await dbConnect();

        try {
          // Check if user already exists
          let existingUser = await UserModel.findOne({ email: user.email });

          if (!existingUser) {
            if (!account) {
              return false; // Reject sign-in if no account info
            }
            // Create new user for OAuth
            // Generate unique username from email or name
            const baseUsername =
              user.email?.split("@")[0] ||
              user.name?.replace(/\s+/g, "").toLowerCase();
            let username = baseUsername;
            let counter = 1;

            // Ensure username is unique
            while (await UserModel.findOne({ username })) {
              username = `${baseUsername}${counter}`;
              counter++;
            }

            existingUser = new UserModel({
              username,
              email: user.email,
              isVerified: true, // OAuth users are pre-verified
              isAcceptingMessages: true,
              provider: account.provider,
              providerId: account.providerAccountId,
              image: user.image,
              messages: [],
            });

            await existingUser.save();
          } else {
            // Update existing user with OAuth info if not already set
            if (
              (!existingUser.provider ||
                existingUser.provider === "credentials") &&
              account
            ) {
              existingUser.provider = account.provider;
              existingUser.providerId = account.providerAccountId;
              existingUser.isVerified = true; // Mark as verified
              if (user.image) existingUser.image = user.image;
              await existingUser.save();
            }
          }

          // Attach database user to the session user
          user._id = existingUser._id.toString();
          user.username = existingUser.username;
          user.isVerified = existingUser.isVerified;
          user.isAcceptingMessages = existingUser.isAcceptingMessages;
          return true;
        } catch (error) {
          console.error("Error in OAuth signIn callback:", error);
          return false;
        }
      }

      return true; // Allow credentials sign in
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user._id?.toString();
        token.username = user.username;
        token.isVerified = user.isVerified;
        token.isAcceptingMessages = user.isAcceptingMessages;
        token.provider = account?.provider;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user._id = token.id;
        session.user.username = token.username;
        session.user.isVerified = token.isVerified;
        session.user.isAcceptingMessages = token.isAcceptingMessages;
        session.user.image = token.image; 
      }
      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
