import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import UserModel from "./Models/UserModel.js";
import bcrypt from "bcrypt";
import BookModel from "./Models/Posts.js"; // Using existing file for now
import TransactionModel from "./Models/Transaction.js";
import ExchangeRequestModel from "./Models/ExchangeRequest.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import * as ENV from "./config.js";

// Groq API integration
import fetch from 'node-fetch';

const GROQ_API_KEY = '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';

// Import Message Model
import MessageModel from "./Models/Message.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS middleware
const corsOptions = {
  origin: ENV.CLIENT_URL || '*',
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
  allowedHeaders: ['Content-Type', 'Authorization', 'userid']
};
app.use(cors(corsOptions));

app.use(express.json());

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// Configure storage location for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = '';
    
    if (file.mimetype === 'application/pdf') {
      uploadPath = path.join(__dirname, 'uploads/books');
    } else {
      uploadPath = path.join(__dirname, 'uploads/images');
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Configure multer
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  fileFilter: function (req, file, cb) {
    if (file.fieldname === 'pdf') {
      if (file.mimetype !== 'application/pdf') {
        return cb(new Error('Only PDF files are allowed'));
      }
    } else if (file.fieldname === 'image') {
      if (!file.mimetype.startsWith('image/')) {
        return cb(new Error('Only image files are allowed'));
      }
    }
    cb(null, true);
  }
});

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const connectString = `mongodb+srv://${ENV.DB_USER}:${ENV.DB_PASSWORD}@${ENV.DB_CLUSTER}/${ENV.DB_NAME}?retryWrites=true&w=majority`;

// Connect to MongoDB
mongoose
  .connect(connectString)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  const userId = req.headers.userid;
  
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: "Authentication error" });
  }
};

// Admin authorization middleware
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Seller authorization middleware
const authorizeSeller = (req, res, next) => {
  if (req.user.role !== 'seller' && req.user.role !== 'admin') {
    return res.status(403).json({ error: "Seller access required" });
  }
  next();
};

// USER ROUTES

app.post("/registerUser", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate role
    if (!['admin', 'seller', 'buyer'].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    
    const hashedpassword = await bcrypt.hash(password, 10);

    const user = new UserModel({
      name: name,
      email: email,
      password: hashedpassword,
      role: role,
    });

    await user.save();
    res.status(201).json({ user: user, msg: "User registered successfully." });
  } catch (error) {
    res.status(500).json({ error: "An error occurred" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email: email });

    if (!user) {
      return res.status(400).json({ error: "User not found." });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Authentication failed" });
    }

    res.status(200).json({ user, message: "Login successful." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/logout", async (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
});

app.get("/user/:id", authenticateUser, async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ error: "An error occurred" });
  }
});

app.put("/user/:id", authenticateUser, async (req, res) => {
  try {
    // Users can only update their own profile unless they're an admin
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: "Not authorized to update this user" });
    }
    
    const { name, email, bio } = req.body;
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      { name, email, bio },
      { new: true }
    ).select('-password');
    
    res.status(200).json({ user: updatedUser, message: "User updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "An error occurred" });
  }
});

// BOOK ROUTES

// Upload a new book
app.post("/books", authenticateUser, authorizeSeller, upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'image', maxCount: 1 }
]), async (req, res) => {
  try {
    const { title, author, description, price, isExchangeOnly, category } = req.body;
    
    const pdfFile = req.files['pdf'][0];
    const imageFile = req.files['image'] ? req.files['image'][0] : null;
    
    const pdfUrl = `/uploads/books/${pdfFile.filename}`;
    const coverImage = imageFile ? `/uploads/images/${imageFile.filename}` : '';
    
    const book = new BookModel({
      title,
      author,
      description,
      sellerId: req.user._id,
      price: price || 0,
      isExchangeOnly: isExchangeOnly === 'true',
      category,
      pdfUrl,
      coverImage,
      status: 'available'
    });
    
    await book.save();
    res.status(201).json({ book, message: "Book added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// Get all books with optional filtering
app.get("/books", async (req, res) => {
  try {
    const { category, minPrice, maxPrice, isExchangeOnly, sellerId, showAll } = req.query;
    
    const filter = {};
    
    // Only filter by 'available' status if showAll is not set to true
    if (showAll !== 'true') {
      filter.status = 'available';
    } else {
      // Even with showAll, never show deleted books in browse listings
      filter.status = { $ne: 'deleted' };
    }
    
    if (category) filter.category = category;
    if (sellerId) filter.sellerId = sellerId;
    if (isExchangeOnly === 'true') filter.isExchangeOnly = true;
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    const books = await BookModel.find(filter)
      .populate('sellerId', 'name email')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ books, count: books.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred" });
  }
});

// Get a single book by ID
app.get("/books/:id", async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.id)
      .populate('sellerId', 'name email');
      
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    res.status(200).json({ book });
  } catch (err) {
    res.status(500).json({ error: "An error occurred" });
  }
});

// Update a book (seller only)
app.put("/books/:id", authenticateUser, authorizeSeller, async (req, res) => {
  try {
    const book = await BookModel.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    // Only the seller or admin can update the book
    if (req.user.role !== 'admin' && req.user._id.toString() !== book.sellerId.toString()) {
      return res.status(403).json({ error: "Not authorized to update this book" });
    }
    
    const { title, author, description, price, isExchangeOnly, category, status } = req.body;
    
    const updatedBook = await BookModel.findByIdAndUpdate(
      req.params.id,
      { title, author, description, price, isExchangeOnly, category, status },
      { new: true }
    );
    
    res.status(200).json({ book: updatedBook, message: "Book updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "An error occurred" });
  }
});

// Delete a book (seller or admin only)
app.delete("/books/:id", authenticateUser, authorizeSeller, async (req, res) => {
  try {
    console.log(`Attempting to delete/archive book with ID: ${req.params.id}`);
    console.log(`User: ${req.user._id}, Role: ${req.user.role}`);
    
    const book = await BookModel.findById(req.params.id);
    
    if (!book) {
      console.log(`Book not found: ${req.params.id}`);
      return res.status(404).json({ error: "Book not found" });
    }
    
    // Only the seller or admin can delete the book
    if (req.user.role !== 'admin' && req.user._id.toString() !== book.sellerId.toString()) {
      console.log(`Authorization failed: User ${req.user._id} attempted to delete book owned by ${book.sellerId}`);
      return res.status(403).json({ error: "Not authorized to delete this book" });
    }
    
    try {
      // Check if book has associated transactions
      const transactionCount = await TransactionModel.countDocuments({ bookId: book._id });
      console.log(`Book has ${transactionCount} associated transactions`);
      
      // If book has transactions, mark it as deleted instead of removing it
      if (transactionCount > 0) {
        book.status = 'deleted';
        book.isAvailableForBrowse = false; // Hide from browse listings
        await book.save();
        console.log(`Book ${req.params.id} marked as deleted due to having ${transactionCount} transactions`);
        
        return res.status(200).json({ 
          message: "Book archived successfully", 
          status: "archived",
          bookId: book._id
        });
      } else {
        // No transactions, we can safely delete the book
        await BookModel.findByIdAndDelete(req.params.id);
        console.log(`Book ${req.params.id} completely deleted from database`);
        
        // Delete the PDF and image files
        if (book.pdfUrl) {
          const pdfPath = path.join(__dirname, book.pdfUrl);
          if (fs.existsSync(pdfPath)) {
            fs.unlinkSync(pdfPath);
            console.log(`Deleted PDF file: ${pdfPath}`);
          }
        }
        
        if (book.coverImage) {
          const imagePath = path.join(__dirname, book.coverImage);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            console.log(`Deleted cover image: ${imagePath}`);
          }
        }
        
        return res.status(200).json({ 
          message: "Book deleted successfully", 
          status: "deleted",
          bookId: req.params.id
        });
      }
    } catch (err) {
      console.error('Error in transaction check or file operations:', err);
      throw err;
    }
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).json({ error: "An error occurred while deleting the book: " + err.message });
  }
});

// TRANSACTION ROUTES

// Create a purchase transaction
app.post("/transactions/purchase", authenticateUser, async (req, res) => {
  try {
    const { bookId, paymentMethod } = req.body;
    
    const book = await BookModel.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    // Check if the book is available (not deleted)
    if (book.status === 'deleted') {
      return res.status(400).json({ error: "Book is not available for purchase" });
    }
    
    if (book.isExchangeOnly) {
      return res.status(400).json({ error: "This book is for exchange only" });
    }
    
    // Cannot buy your own book
    if (book.sellerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot buy your own book" });
    }
    
    const transaction = new TransactionModel({
      bookId: book._id,
      sellerId: book.sellerId,
      buyerId: req.user._id,
      price: book.price,
      isExchange: false,
      paymentMethod: paymentMethod || 'credit_card',
      status: 'completed' // Set to completed directly since digital books can be purchased immediately
    });
    
    await transaction.save();
    
    // No need to update book status anymore - digital books remain available
    
    res.status(201).json({ 
      transaction, 
      message: "Purchase completed successfully" 
    });
  } catch (err) {
    res.status(500).json({ error: "An error occurred" });
  }
});

// Create an exchange request
app.post("/exchange-requests", authenticateUser, async (req, res) => {
  try {
    const { requestedBookId, offeredBookId, message } = req.body;
    
    // Check if requested book exists and is for exchange
    const requestedBook = await BookModel.findById(requestedBookId);
    if (!requestedBook) {
      return res.status(404).json({ error: "Requested book not found" });
    }
    
    if (!requestedBook.isExchangeOnly && requestedBook.price > 0) {
      return res.status(400).json({ error: "Requested book is not for exchange" });
    }
    
    // Check if offered book exists and belongs to the requester
    const offeredBook = await BookModel.findById(offeredBookId);
    if (!offeredBook) {
      return res.status(404).json({ error: "Offered book not found" });
    }
    
    if (offeredBook.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "You can only offer your own books" });
    }
    
    // Cannot exchange with yourself
    if (requestedBook.sellerId.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot exchange with yourself" });
    }
    
    const exchangeRequest = new ExchangeRequestModel({
      requestedBookId,
      offeredBookId,
      requesterId: req.user._id,
      ownerId: requestedBook.sellerId,
      message: message || '',
      status: 'pending'
    });
    
    await exchangeRequest.save();
    
    res.status(201).json({ 
      exchangeRequest, 
      message: "Exchange request created successfully" 
    });
  } catch (err) {
    res.status(500).json({ error: "An error occurred" });
  }
});

// Get exchange requests for a user
app.get("/exchange-requests/user", authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get requests received (as owner)
    const receivedRequests = await ExchangeRequestModel.find({ ownerId: userId })
      .populate('requestedBookId')
      .populate('offeredBookId')
      .populate('requesterId', 'name email');
    
    // Get requests sent (as requester)
    const sentRequests = await ExchangeRequestModel.find({ requesterId: userId })
      .populate('requestedBookId')
      .populate('offeredBookId')
      .populate('ownerId', 'name email');
    
    res.status(200).json({ 
      receivedRequests, 
      sentRequests 
    });
  } catch (err) {
    res.status(500).json({ error: "An error occurred" });
  }
});

// Respond to exchange request
app.put("/exchange-requests/:id", authenticateUser, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['accepted', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const exchangeRequest = await ExchangeRequestModel.findById(req.params.id);
    if (!exchangeRequest) {
      return res.status(404).json({ error: "Exchange request not found" });
    }
    
    // Only the owner can respond to the request
    if (exchangeRequest.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to respond to this request" });
    }
    
    exchangeRequest.status = status;
    await exchangeRequest.save();
    
    // If accepted, create a transaction and update book statuses
    if (status === 'accepted') {
      // Create exchange transaction
      const transaction = new TransactionModel({
        bookId: exchangeRequest.requestedBookId,
        sellerId: exchangeRequest.ownerId,
        buyerId: exchangeRequest.requesterId,
        isExchange: true,
        exchangeBookId: exchangeRequest.offeredBookId,
        status: 'completed',
        paymentMethod: 'exchange'
      });
      
      await transaction.save();
      
      // Update book statuses
      await BookModel.findByIdAndUpdate(exchangeRequest.requestedBookId, { status: 'sold' });
      await BookModel.findByIdAndUpdate(exchangeRequest.offeredBookId, { status: 'sold' });
    }
    
    res.status(200).json({ 
      exchangeRequest, 
      message: `Exchange request ${status}` 
    });
  } catch (err) {
    res.status(500).json({ error: "An error occurred" });
  }
});

// Simple test endpoint to verify API is working
app.get("/api-test", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    message: "API connection successful",
    timestamp: new Date().toISOString()
  });
});

// Get customers for a seller (based on transactions)
app.get("/transactions/customers", authenticateUser, authorizeSeller, async (req, res) => {
  try {
    console.log('GET /transactions/customers endpoint hit');
    console.log('Authenticated user:', req.user._id, req.user.role);
    
    // Get all transactions where the user is the seller
    const transactions = await TransactionModel.find({ 
      sellerId: req.user._id
    }).populate('buyerId');
    
    console.log(`Found ${transactions.length} transactions for seller`);
    
    // Extract unique customers and their transactions
    const customersMap = {};
    
    transactions.forEach(transaction => {
      // Skip if buyerId is not populated
      if (!transaction.buyerId) {
        console.log('Warning: Transaction has no buyerId:', transaction._id);
        return;
      }
      
      const buyerId = transaction.buyerId._id.toString();
      
      if (!customersMap[buyerId]) {
        // Get first and last name from either firstName/lastName fields or split the name field
        let firstName = '';
        let lastName = '';
        
        if (transaction.buyerId.firstName) {
          firstName = transaction.buyerId.firstName;
        } else if (transaction.buyerId.name) {
          const nameParts = transaction.buyerId.name.split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }
        
        if (transaction.buyerId.lastName) {
          lastName = transaction.buyerId.lastName;
        }
        
        // Create a new customer entry
        customersMap[buyerId] = {
          _id: buyerId,
          firstName: firstName,
          lastName: lastName,
          email: transaction.buyerId.email || 'unknown@email.com',
          transactions: []
        };
      }
      
      // Add this transaction to the customer
      customersMap[buyerId].transactions.push({
        _id: transaction._id,
        bookId: transaction.bookId,
        price: transaction.price || 0,
        transactionDate: transaction.transactionDate,
        status: transaction.status
      });
    });
    
    // Convert the map to an array
    const customers = Object.values(customersMap);
    console.log(`Returning ${customers.length} unique customers`);
    
    res.status(200).json({ customers });
  } catch (err) {
    console.error('Error in /transactions/customers:', err);
    res.status(500).json({ error: "An error occurred while fetching customers" });
  }
});

// Get purchases for a specific user
app.get("/transactions/user-purchases", authenticateUser, async (req, res) => {
  try {
    console.log('GET /transactions/user-purchases endpoint hit');
    console.log('Authenticated user:', req.user._id, req.user.role);
    
    // Find all transactions where the current user is the buyer
    // and the book hasn't been removed from their library
    const transactions = await TransactionModel.find({
      buyerId: req.user._id,
      removedFromLibrary: { $ne: true } // Don't include books removed from library
    }).populate('bookId').sort({ transactionDate: -1 });
    
    console.log(`Found ${transactions.length} purchases for user`);
    
    // Format the purchases for the frontend
    const purchases = transactions.map(transaction => {
      // Check if the book exists (might have been deleted)
      const book = transaction.bookId;
      
      return {
        _id: transaction._id,
        book: book, // This might be null if the book was deleted
        price: transaction.price,
        status: transaction.status,
        transactionDate: transaction.transactionDate,
        paymentMethod: transaction.paymentMethod
      };
    });
    
    res.status(200).json({ purchases });
  } catch (err) {
    console.error('Error in /transactions/user-purchases:', err);
    res.status(500).json({ error: "An error occurred while fetching your purchases" });
  }
});

// Remove a purchase transaction from user's library
app.delete("/transactions/:id/remove", authenticateUser, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const userId = req.user._id;
    
    // Find the transaction and verify it belongs to this user
    const transaction = await TransactionModel.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    
    // Verify that the requesting user is the buyer
    if (transaction.buyerId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Not authorized to remove this book" });
    }
    
    // We don't actually delete the transaction from the database,
    // We just mark it as removed from the buyer's library
    transaction.removedFromLibrary = true;
    await transaction.save();
    
    res.status(200).json({ 
      message: "Book removed from your library successfully" 
    });
  } catch (err) {
    console.error('Error removing book from library:', err);
    res.status(500).json({ error: "An error occurred while removing book from library" });
  }
});

// Admin Routes

// Get all users (for admin)
app.get("/admin/users", authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const role = req.query.role; // Optional role filter
    
    let query = {};
    if (role && ['buyer', 'seller', 'admin'].includes(role)) {
      query.role = role;
    }
    
    // Get users without password field
    const users = await UserModel.find(query).select('-password');
    
    // Enhance user data with additional statistics
    const enhancedUsers = await Promise.all(users.map(async (user) => {
      const userData = user.toObject();
      
      if (userData.role === 'buyer') {
        // Count purchases for buyers
        userData.purchaseCount = await TransactionModel.countDocuments({ buyerId: user._id });
      } else if (userData.role === 'seller') {
        // Count books and sales for sellers
        userData.bookCount = await BookModel.countDocuments({ sellerId: user._id });
        userData.salesCount = await TransactionModel.countDocuments({ sellerId: user._id });
      }
      
      return userData;
    }));
    
    res.status(200).json({ users: enhancedUsers });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Delete user (for admin)
app.delete("/admin/users/:userId", authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Don't allow admin to delete themselves
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: "Admin cannot delete their own account" });
    }
    
    // Find user to be deleted
    const userToDelete = await UserModel.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // If deleting a seller, handle their books
    if (userToDelete.role === 'seller') {
      // Option 1: Delete all books by this seller
      await BookModel.deleteMany({ sellerId: userId });
      
      // Option 2 (alternative): Mark books as unavailable
      // await BookModel.updateMany({ sellerId: userId }, { status: 'unavailable' });
    }
    
    // Delete user
    await UserModel.findByIdAndDelete(userId);
    
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

// Get all transactions (admin only)
app.get("/admin/transactions", authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const transactions = await TransactionModel.find()
      .populate('bookId')
      .populate('sellerId', 'name email')
      .populate('buyerId', 'name email')
      .sort({ createdAt: -1 });
      
    res.status(200).json({ transactions });
  } catch (err) {
    res.status(500).json({ error: "An error occurred" });
  }
});

// Update transaction status (admin only)
app.put("/admin/transactions/:id", authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'completed', 'cancelled', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const transaction = await TransactionModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    // Digital books remain available regardless of transaction status
    // No need to update book status anymore
    
    res.status(200).json({ 
      transaction, 
      message: "Transaction updated successfully" 
    });
  } catch (err) {
    res.status(500).json({ error: "An error occurred" });
  }
});

// Create a test transaction for development purposes
app.post("/create-test-transaction", authenticateUser, async (req, res) => {
  try {
    // Ensure the user is a seller
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Only sellers can create test transactions" });
    }
    
    // Find a buyer (any user who is not the current seller)
    const buyer = await UserModel.findOne({ 
      _id: { $ne: req.user._id },
      role: { $ne: 'seller' }
    });
    
    if (!buyer) {
      return res.status(404).json({ error: "No buyers found in the system" });
    }
    
    // Find a book from this seller, or create one if needed
    let book = await BookModel.findOne({ sellerId: req.user._id });
    
    if (!book) {
      // Create a test book
      book = new BookModel({
        title: "Test Book",
        author: "Test Author",
        description: "This is a test book created for transaction testing",
        sellerId: req.user._id,
        price: 19.99,
        status: 'available'
      });
      await book.save();
    }
    
    // Create a test transaction
    const transaction = new TransactionModel({
      bookId: book._id,
      sellerId: req.user._id,
      buyerId: buyer._id,
      price: book.price || 19.99,
      status: 'completed',
      transactionDate: new Date()
    });
    
    await transaction.save();
    
    // No need to update book status - digital books remain available
    
    res.status(201).json({ 
      transaction,
      message: "Test transaction created successfully"
    });
  } catch (err) {
    console.error('Error creating test transaction:', err);
    res.status(500).json({ error: "Failed to create test transaction" });
  }
});

// MESSAGE ROUTES

// Get messages for current user
app.get("/messages", authenticateUser, async (req, res) => {
  try {
    // Get messages sent by the user
    const sent = await MessageModel.find({ senderId: req.user._id })
      .populate('receiverId', 'name email')
      .populate('bookId', 'title coverImage')
      .sort({ createdAt: -1 });
    
    // Get messages received by the user
    const received = await MessageModel.find({ receiverId: req.user._id })
      .populate('senderId', 'name email')
      .populate('bookId', 'title coverImage')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ 
      sent, 
      received 
    });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: "An error occurred" });
  }
});

// Send a new message
app.post("/messages", authenticateUser, async (req, res) => {
  try {
    const { receiverId, bookId, content } = req.body;
    
    // Verify that the book exists
    const book = await BookModel.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    // Create a unique ID to avoid collisions
    const uniqueId = new mongoose.Types.ObjectId();
    
    try {
      // Create and save in one step with explicit ID
      const message = await MessageModel.create({
        _id: uniqueId,
        senderId: req.user._id,
        receiverId,
        bookId,
        content,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Populate the fields for response
      const populatedMessage = await MessageModel.findById(message._id)
        .populate('receiverId', 'name email')
        .populate('bookId', 'title coverImage')
        .populate('senderId', 'name email');
      
      if (!populatedMessage) {
        throw new Error("Message created but couldn't be retrieved");
      }
      
      res.status(201).json({ 
        message: populatedMessage, 
        success: "Message sent successfully" 
      });
    } catch (err) {
      console.error('Error creating message:', err);
      res.status(500).json({ error: `Failed to create message: ${err.message}` });
    }
  } catch (err) {
    console.error('Error in message process:', err);
    res.status(500).json({ error: `An error occurred: ${err.message}` });
  }
});

// Mark message as read
app.put("/messages/:id/read", authenticateUser, async (req, res) => {
  try {
    const message = await MessageModel.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    
    // Only the receiver can mark as read
    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    message.isRead = true;
    await message.save();
    
    res.status(200).json({ 
      message, 
      success: "Message marked as read" 
    });
  } catch (err) {
    console.error('Error marking message as read:', err);
    res.status(500).json({ error: "An error occurred" });
  }
});

// Delete a message
app.delete("/messages/:id", authenticateUser, async (req, res) => {
  try {
    const message = await MessageModel.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    
    // Only sender or receiver can delete
    if (message.senderId.toString() !== req.user._id.toString() && 
        message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized" });
    }
    
    await MessageModel.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ 
      success: "Message deleted successfully" 
    });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ error: "An error occurred" });
  }
});

// AI CHATBOT ROUTES
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, model, temperature, max_tokens } = req.body;
    
    // Validate inputs
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }
    
    console.log("Chat API request received:", { model, temperature, max_tokens });
    console.log("Number of messages:", messages.length);
    
    // Override any system message to ensure English responses
    let modifiedMessages = [...messages];
    if (messages.length > 0 && messages[0].role === 'system') {
      // Modify the existing system prompt to ensure English responses
      modifiedMessages[0] = {
        ...messages[0],
        content: messages[0].content + " Always respond in English only."
      };
    }
    
    // Make request to Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: modifiedMessages,
        model: model || 'gemma2-9b-it',
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 1024,
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error status:', response.status);
      console.error('Groq API error response:', errorData);
      return res.status(response.status).json({ error: `Error from AI service: ${response.status}` });
    }
    
    const responseData = await response.json();
    
    if (responseData && responseData.choices && responseData.choices[0]) {
      return res.status(200).json({ 
        message: responseData.choices[0].message.content,
        usage: responseData.usage
      });
    } else {
      console.error('Unexpected Groq API response:', responseData);
      return res.status(500).json({ error: "Unexpected response format from AI service" });
    }
  } catch (err) {
    console.error('Error in chat endpoint:', err);
    return res.status(500).json({ error: `An error occurred processing the chat request: ${err.message}` });
  }
});

const port = ENV.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running at port: ${port}`);
}); 