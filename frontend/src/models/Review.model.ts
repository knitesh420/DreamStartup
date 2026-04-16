import mongoose, { Document, Model } from 'mongoose';

export interface IReview extends Document {
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
}

interface IReviewModel extends Model<IReview> {
  calcAverageRating(productId: mongoose.Types.ObjectId): Promise<void>;
}

const reviewSchema = new mongoose.Schema<IReview>(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: [true, 'Rating is required'], min: 1, max: 5 },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

reviewSchema.statics.calcAverageRating = async function (productId: mongoose.Types.ObjectId) {
  const result = await this.aggregate([
    { $match: { product: productId } },
    { $group: { _id: '$product', avgRating: { $avg: '$rating' }, numReviews: { $sum: 1 } } },
  ]);
  const Product = mongoose.model('Product');
  if (result.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      avgRating: Math.round(result[0].avgRating * 10) / 10,
      numReviews: result[0].numReviews,
    });
  } else {
    await Product.findByIdAndUpdate(productId, { avgRating: 0, numReviews: 0 });
  }
};

reviewSchema.post('save', function () {
  (this.constructor as IReviewModel).calcAverageRating(this.product as mongoose.Types.ObjectId);
});

reviewSchema.post('findOneAndDelete', function (doc: IReview) {
  if (doc) (doc.constructor as IReviewModel).calcAverageRating(doc.product as mongoose.Types.ObjectId);
});

const Review: IReviewModel =
  (mongoose.models.Review as IReviewModel) ||
  mongoose.model<IReview, IReviewModel>('Review', reviewSchema);
export default Review;
