import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import * as ENV from "../config";

const initialState = {
  books: [],
  book: null,
  userBooks: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: "",
  totalBooks: 0,
};

// Get all books
export const getBooks = createAsyncThunk(
  "books/getBooks",
  async (filters = {}, thunkAPI) => {
    try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (filters.category) {
        queryParams.append('category', filters.category);
      }
      if (filters.minPrice) {
        queryParams.append('minPrice', filters.minPrice);
      }
      if (filters.maxPrice) {
        queryParams.append('maxPrice', filters.maxPrice);
      }
      if (filters.isExchangeOnly) {
        queryParams.append('isExchangeOnly', filters.isExchangeOnly);
      }
      if (filters.sellerId) {
        queryParams.append('sellerId', filters.sellerId);
      }
      if (filters.showAll) {
        queryParams.append('showAll', filters.showAll);
      }
      
      const url = queryParams.toString() 
        ? `${ENV.SERVER_URL}/books?${queryParams.toString()}`
        : `${ENV.SERVER_URL}/books`;
      
      const response = await axios.get(url);
      return response.data.books;
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get a single book by ID
export const getBookById = createAsyncThunk(
  "books/getById",
  async (bookId, thunkAPI) => {
    try {
      const response = await axios.get(`${ENV.SERVER_URL}/books/${bookId}`);
      return response.data.book;
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get books by seller ID
export const getBooksBySeller = createAsyncThunk(
  "books/getBySeller",
  async (sellerId, thunkAPI) => {
    try {
      const response = await axios.get(`${ENV.SERVER_URL}/books?sellerId=${sellerId}&showAll=true`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Create a new book
export const createBook = createAsyncThunk(
  "books/create",
  async (bookData, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const userId = state.users.user._id;
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('title', bookData.title);
      formData.append('author', bookData.author);
      formData.append('description', bookData.description);
      formData.append('price', bookData.price);
      formData.append('isExchangeOnly', bookData.isExchangeOnly);
      formData.append('category', bookData.category);
      
      // Append PDF file with correct field name
      if (bookData.pdfFile) {
        formData.append('pdf', bookData.pdfFile);
      }
      
      // Append cover image if provided
      if (bookData.coverImage) {
        formData.append('image', bookData.coverImage);
      }
      
      const response = await axios.post(
        `${ENV.SERVER_URL}/books`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'userid': userId,
          },
        }
      );
      
      return response.data.book;
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update a book
export const updateBook = createAsyncThunk(
  "books/update",
  async ({ bookId, bookData }, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const userId = state.users.user._id;
      
      const response = await axios.put(
        `${ENV.SERVER_URL}/books/${bookId}`,
        bookData,
        {
          headers: {
            'userid': userId,
          },
        }
      );
      
      return response.data.book;
    } catch (error) {
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete a book
export const deleteBook = createAsyncThunk(
  "books/delete",
  async (bookId, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const userId = state.users.user._id;
      
      const response = await axios.delete(
        `${ENV.SERVER_URL}/books/${bookId}`,
        {
          headers: {
            'userid': userId,
          },
        }
      );
      
      console.log('Delete book response:', response.data);
      return bookId;
    } catch (error) {
      console.error('Delete book error:', error);
      const message = error.response?.data?.error || error.message || error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const bookSlice = createSlice({
  name: "books",
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = "";
    },
    clearErrors: (state) => {
      state.isError = false;
      state.message = "";
    },
    clearBook: (state) => {
      state.book = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all books
      .addCase(getBooks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBooks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        if (action.payload && Array.isArray(action.payload)) {
          state.books = action.payload;
        } else if (action.payload && action.payload.books) {
          state.books = action.payload.books;
        } else {
          state.books = [];
        }
        state.totalBooks = state.books.length;
      })
      .addCase(getBooks.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.books = [];
      })
      
      // Get book by ID
      .addCase(getBookById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBookById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.book = action.payload;
      })
      .addCase(getBookById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.book = null;
      })
      
      // Get books by seller
      .addCase(getBooksBySeller.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBooksBySeller.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.userBooks = action.payload.books;
      })
      .addCase(getBooksBySeller.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.userBooks = [];
      })
      
      // Create book
      .addCase(createBook.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createBook.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.userBooks.push(action.payload);
      })
      .addCase(createBook.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Update book
      .addCase(updateBook.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateBook.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.userBooks = state.userBooks.map(book => 
          book._id === action.payload._id ? action.payload : book
        );
        if (state.book && state.book._id === action.payload._id) {
          state.book = action.payload;
        }
      })
      .addCase(updateBook.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Delete book
      .addCase(deleteBook.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteBook.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.userBooks = state.userBooks.filter(book => book._id !== action.payload);
        state.books = state.books.filter(book => book._id !== action.payload);
        if (state.book && state.book._id === action.payload) {
          state.book = null;
        }
      })
      .addCase(deleteBook.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset, clearErrors, clearBook } = bookSlice.actions;
export default bookSlice.reducer; 