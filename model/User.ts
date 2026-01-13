import mongoose, { Schema, Document } from "mongoose";

export interface Message  {
  _id: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

const MessageSchema: Schema<Message> = new Schema({
  content: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
});

export interface Event extends Document {
  name: string;
  slug: string; // URL-friendly version
  description?: string;
  userId: mongoose.Types.ObjectId; // Reference to User
  createdAt: Date;
  isActive: boolean;
  messages: mongoose.Types.DocumentArray<Message & Document>; // Embedded messages
}

const EventSchema: Schema<Event> = new Schema({
  name: {
    type: String,
    required: [true, "Event name is required"],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  messages: [MessageSchema], // Messages embedded in event
});

// Compound index for user + slug uniqueness
EventSchema.index({ userId: 1, slug: 1 }, { unique: true });

export interface AIUsage {
  date: Date;
  count: number;
}

export interface User extends Document {
  username: string;
  email: string;
  password?: string;
  verificationToken?: string;
  TokenExpiry?: Date;
  isVerified: boolean;
  isAcceptingMessages: boolean;
  provider?: string; // 'credentials', 'github', 'google'
  providerId?: string; // OAuth provider's user ID
  image?: string; // Profile image from OAuth
  events: mongoose.Types.ObjectId[];
  aiUsage: {
    date: Date | null;
    count: number;
  };
}

const UserSchema: Schema<User> = new Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, "Please use a valid email address"],
  },
  password: { type: String, required: [false, "Password is required"] },
  verificationToken: {
    type: String,
    required: [false, "Verification token is required"],
  },
  TokenExpiry: { type: Date, required: false },
  isVerified: { type: Boolean, default: false },
  isAcceptingMessages: { type: Boolean, default: true },
  provider: {
    type: String,
    enum: ["credentials", "github", "google"],
    default: "credentials",
  },
  providerId: {
    type: String,
  },
  image: {
    type: String,
  },
  events: [{
    type: Schema.Types.ObjectId,
    ref: "Event",
  }],
  aiUsage: {
    date: {
      type: Date,
      default: null,
      required: false,  // ← Explicitly set to false
    },
    count: {
      type: Number,
      default: 0,
    },
  },
});

export const userModel =
  (mongoose.models.User as mongoose.Model<User>) ||
  mongoose.model<User>("User", UserSchema);

export const EventModel =
  (mongoose.models.Event as mongoose.Model<Event>) ||
  mongoose.model<Event>("Event", EventSchema);  

export default userModel;
