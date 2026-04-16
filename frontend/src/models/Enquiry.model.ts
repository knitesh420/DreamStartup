import mongoose, { Document, Model } from 'mongoose';

export interface IEnquiry extends Document {
  type: 'bulk_order' | 'startup' | 'general';
  name: string;
  phone: string;
  email?: string;
  message: string;
  product?: mongoose.Types.ObjectId;
  startupKit?: mongoose.Types.ObjectId;
  isResolved: boolean;
}

const enquirySchema = new mongoose.Schema<IEnquiry>(
  {
    type: { type: String, required: true, enum: ['bulk_order', 'startup', 'general'] },
    name: { type: String, required: [true, 'Name is required'] },
    phone: { type: String, required: [true, 'Phone is required'] },
    email: { type: String },
    message: { type: String, required: [true, 'Message is required'] },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    startupKit: { type: mongoose.Schema.Types.ObjectId, ref: 'StartupKit' },
    isResolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Enquiry: Model<IEnquiry> =
  mongoose.models.Enquiry || mongoose.model<IEnquiry>('Enquiry', enquirySchema);
export default Enquiry;
