import mongoose from "mongoose";

const ExchangeRequestSchema = mongoose.Schema(
  {
    requestedBookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'books',
      required: true,
    },
    offeredBookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'books',
      required: true,
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'userinfos',
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'userinfos',
      required: true,
    },
    message: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed'],
      default: 'pending',
    }
  },
  {
    timestamps: true
  }
);

const ExchangeRequestModel = mongoose.model("exchangeRequests", ExchangeRequestSchema);
export default ExchangeRequestModel; 