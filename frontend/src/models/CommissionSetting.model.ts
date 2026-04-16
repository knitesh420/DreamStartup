import mongoose, { Document, Model } from 'mongoose';

export interface ICommissionSetting extends Document {
  profession: 'carpenter' | 'electrician' | 'plumber';
  defaultCommissionRate: number;
  active: boolean;
}

const commissionSettingSchema = new mongoose.Schema<ICommissionSetting>(
  {
    profession: { type: String, required: true, unique: true, enum: ['carpenter', 'electrician', 'plumber'] },
    defaultCommissionRate: { type: Number, required: true, default: 10 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const CommissionSetting: Model<ICommissionSetting> =
  mongoose.models.CommissionSetting ||
  mongoose.model<ICommissionSetting>('CommissionSetting', commissionSettingSchema);
export default CommissionSetting;
