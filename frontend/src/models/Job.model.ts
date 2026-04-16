import mongoose, { Document, Model } from 'mongoose';

export interface IJob extends Document {
  provider: mongoose.Types.ObjectId;
  customer?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  serviceType: 'carpenter' | 'electrician' | 'plumber';
  location?: string;
  scheduledDate?: Date;
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  commissionAmount: number;
  earningsAmount: number;
}

const jobSchema = new mongoose.Schema<IJob>(
  {
    provider: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProviderProfile', required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: [true, 'Job title is required'] },
    description: { type: String },
    serviceType: { type: String, required: true, enum: ['carpenter', 'electrician', 'plumber'] },
    location: { type: String },
    scheduledDate: { type: Date },
    status: {
      type: String,
      enum: ['open', 'assigned', 'in_progress', 'completed', 'cancelled'],
      default: 'open',
    },
    commissionAmount: { type: Number, default: 0 },
    earningsAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>('Job', jobSchema);
export default Job;
