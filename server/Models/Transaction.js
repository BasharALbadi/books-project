import mongoose from "mongoose";

const TransactionSchema = mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'books',
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'userinfos',
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'userinfos',
      required: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    isExchange: {
      type: Boolean,
      default: false,
    },
    exchangeBookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'books',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'rejected'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'paypal', 'exchange', 'other'],
      default: 'credit_card',
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    removedFromLibrary: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true
  }
);

const TransactionModel = mongoose.model("transactions", TransactionSchema);
export default TransactionModel; 