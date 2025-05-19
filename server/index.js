import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import UserModel from "./Models/UserModel.js";
import bcrypt from "bcrypt";
import BookModel from "./Models/Posts.js";
import TransactionModel from "./Models/Transaction.js";
import ExchangeRequestModel from "./Models/ExchangeRequest.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

import * as ENV from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS middleware
const corsOptions = {
  origin: ENV.CLIENT_URL,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());

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
    const { category, minPrice, maxPrice, isExchangeOnly, sellerId } = req.query;
    
    const filter = { status: 'available' };
    
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
    const book = await BookModel.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    // Only the seller or admin can delete the book
    if (req.user.role !== 'admin' && req.user._id.toString() !== book.sellerId.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this book" });
    }
    
    await BookModel.findByIdAndDelete(req.params.id);
    
    // Optional: Delete the PDF and image files
    if (book.pdfUrl) {
      const pdfPath = path.join(__dirname, book.pdfUrl);
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }
    
    if (book.coverImage) {
      const imagePath = path.join(__dirname, book.coverImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    res.status(200).json({ message: "Book deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "An error occurred" });
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
    
    if (book.status !== 'available') {
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
      status: 'pending'
    });
    
    await transaction.save();
    
    // Update book status
    book.status = 'reserved';
    await book.save();
    
    res.status(201).json({ 
      transaction, 
      message: "Purchase transaction created successfully" 
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

// Admin Routes

// Get all users (admin only)
app.get("/admin/users", authenticateUser, authorizeAdmin, async (req, res) => {
  try {
    const users = await UserModel.find().select('-password');
    res.status(200).json({ users });
  } catch (err) {
    res.status(500).json({ error: "An error occurred" });
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
    
    // Update book status if transaction status changes
    if (status === 'completed') {
      await BookModel.findByIdAndUpdate(transaction.bookId, { status: 'sold' });
    } else if (status === 'cancelled' || status === 'rejected') {
      await BookModel.findByIdAndUpdate(transaction.bookId, { status: 'available' });
    }
    
    res.status(200).json({ 
      transaction, 
      message: "Transaction updated successfully" 
    });
  } catch (err) {
    res.status(500).json({ error: "An error occurred" });
  }
});

const port = ENV.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running at port: ${port}`);
});

