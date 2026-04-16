import mongoose, { Document, Model } from 'mongoose';
import slugify from 'slugify';

export interface IStartupKit extends Document {
  title: string;
  slug: string;
  description: string;
  category: string;
  startingPrice: number;
  includedServices: string[];
  image: string;
  isActive: boolean;
}

const startupKitSchema = new mongoose.Schema<IStartupKit>(
  {
    title: { type: String, required: [true, 'Kit title is required'], trim: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    startingPrice: { type: Number, required: true },
    includedServices: [{ type: String }],
    image: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

startupKitSchema.pre('save', function (next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

const StartupKit: Model<IStartupKit> =
  mongoose.models.StartupKit || mongoose.model<IStartupKit>('StartupKit', startupKitSchema);
export default StartupKit;
