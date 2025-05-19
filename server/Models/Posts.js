import mongoose from "mongoose";

const BookSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'userinfos',
      required: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    isExchangeOnly: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      required: true,
    },
    pdfUrl: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['available', 'sold', 'reserved', 'deleted'],
      default: 'available',
    },
    isAvailableForBrowse: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true
  }
);

const BookModel = mongoose.model("books", BookSchema);
export default BookModel;
