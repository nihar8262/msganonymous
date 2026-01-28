import mongoose, { Schema, Document } from 'mongoose';

export interface IAnonymousUsage extends Document {
  identifier: string; // IP address or fingerprint
  scope?: string; // e.g., 'ai' or 'msg:<eventId>'
  date: Date;
  count: number;
  createdAt: Date;
}

const AnonymousUsageSchema: Schema<IAnonymousUsage> = new Schema({
  identifier: {
    type: String,
    required: true,
    index: true,
  },
  scope: {
    type: String,
    default: 'ai',
    index: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  count: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // Auto-delete after 24 hours (1 day in seconds)
  },
});

// Compound index for efficient lookups
AnonymousUsageSchema.index({ identifier: 1, date: 1, scope: 1 });

const AnonymousUsageModel =
  (mongoose.models.AnonymousUsage as mongoose.Model<IAnonymousUsage>) ||
  mongoose.model<IAnonymousUsage>('AnonymousUsage', AnonymousUsageSchema);

export default AnonymousUsageModel;