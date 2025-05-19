import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import * as ENV from "../config";

const initialState = {
  transactions: [],
  userTransactions: {
    purchases: [],
    sales: []
  },
  exchangeRequests: {
    received: [],
    sent: []
  },
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
};

// Create a purchase transaction
export const purchaseBook = createAsyncThunk(
  "transactions/purchase",
  async ({ bookId, paymentMethod }, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const userId = state.users.user._id;
      
      const response = await axios.post(
        `${ENV.SERVER_URL}/transactions/purchase`,
        { bookId, paymentMethod },
        {
          headers: {
            'userid': userId,
          },
        }
      );
      
      return response.data.transaction;
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create an exchange request
export const requestExchange = createAsyncThunk(
  "transactions/requestExchange",
  async ({ requestedBookId, offeredBookId, message }, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const userId = state.users.user._id;
      
      const response = await axios.post(
        `${ENV.SERVER_URL}/exchange-requests`,
        { requestedBookId, offeredBookId, message },
        {
          headers: {
            'userid': userId,
          },
        }
      );
      
      return response.data.exchangeRequest;
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get user exchange requests (both sent and received)
export const getUserExchangeRequests = createAsyncThunk(
  "transactions/getUserExchangeRequests",
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const userId = state.users.user._id;
      
      const response = await axios.get(
        `${ENV.SERVER_URL}/exchange-requests/user`,
        {
          headers: {
            'userid': userId,
          },
        }
      );
      
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Respond to exchange request (accept/reject)
export const respondToExchangeRequest = createAsyncThunk(
  "transactions/respondToExchangeRequest",
  async ({ requestId, status }, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const userId = state.users.user._id;
      
      const response = await axios.put(
        `${ENV.SERVER_URL}/exchange-requests/${requestId}`,
        { status },
        {
          headers: {
            'userid': userId,
          },
        }
      );
      
      return response.data.exchangeRequest;
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get all transactions (admin only)
export const getAllTransactions = createAsyncThunk(
  "transactions/getAll",
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const userId = state.users.user._id;
      
      const response = await axios.get(
        `${ENV.SERVER_URL}/admin/transactions`,
        {
          headers: {
            'userid': userId,
          },
        }
      );
      
      return response.data.transactions;
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update transaction status (admin only)
export const updateTransactionStatus = createAsyncThunk(
  "transactions/updateStatus",
  async ({ transactionId, status }, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const userId = state.users.user._id;
      
      const response = await axios.put(
        `${ENV.SERVER_URL}/admin/transactions/${transactionId}`,
        { status },
        {
          headers: {
            'userid': userId,
          },
        }
      );
      
      return response.data.transaction;
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const transactionSlice = createSlice({
  name: "transactions",
  initialState,
  reducers: {
    resetTransactionState: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // Purchase book
      .addCase(purchaseBook.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(purchaseBook.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.userTransactions.purchases.push(action.payload);
      })
      .addCase(purchaseBook.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Request exchange
      .addCase(requestExchange.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(requestExchange.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.exchangeRequests.sent.push(action.payload);
      })
      .addCase(requestExchange.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Get user exchange requests
      .addCase(getUserExchangeRequests.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUserExchangeRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.exchangeRequests.received = action.payload.receivedRequests;
        state.exchangeRequests.sent = action.payload.sentRequests;
      })
      .addCase(getUserExchangeRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Respond to exchange request
      .addCase(respondToExchangeRequest.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(respondToExchangeRequest.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Update the received exchange request in the state
        state.exchangeRequests.received = state.exchangeRequests.received.map(req => 
          req._id === action.payload._id ? action.payload : req
        );
      })
      .addCase(respondToExchangeRequest.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Get all transactions (admin)
      .addCase(getAllTransactions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.transactions = action.payload;
      })
      .addCase(getAllTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Update transaction status (admin)
      .addCase(updateTransactionStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateTransactionStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.transactions = state.transactions.map(transaction => 
          transaction._id === action.payload._id ? action.payload : transaction
        );
      })
      .addCase(updateTransactionStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetTransactionState } = transactionSlice.actions;
export default transactionSlice.reducer; 