import mongoose, { Document, Model } from "mongoose";
import Product from "@/models/Product.model";

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  moqApplied: boolean;
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  totalAmount: number;
  calculateTotal(): number;
}

const cartItemSchema = new mongoose.Schema<ICartItem>(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    moqApplied: { type: Boolean, default: false },
  },
  { _id: false },
);

const cartSchema = new mongoose.Schema<ICart>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    totalAmount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

cartSchema.methods.calculateTotal = function (): number {
  this.totalAmount = this.items.reduce(
    (sum: number, item: ICartItem) => sum + item.price * item.quantity,
    0,
  );
  return this.totalAmount;
};

const Cart: Model<ICart> =
  mongoose.models.Cart || mongoose.model<ICart>("Cart", cartSchema);
export default Cart;
