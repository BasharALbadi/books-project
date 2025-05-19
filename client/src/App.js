import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppNavbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import Home from "./Components/Home";
import Login from "./Components/Login";
import Register from "./Components/Register";
import PrivateRoute from "./Components/PrivateRoute";
import BookList from "./Components/Books/BookList";
import BookShelf from "./Components/Books/BookShelf";
import BookDetail from "./Components/Books/BookDetail";
import AddBook from "./Components/Books/AddBook";
import MyBooks from "./Components/Books/MyBooks";
import MyPurchases from "./Components/Books/MyPurchases";
import ExchangeRequests from "./Components/Transactions/ExchangeRequests";
import Transactions from "./Components/Transactions/Transactions";
import AdminDashboard from "./Components/Admin/AdminDashboard";
import Profile from "./Components/Profile";
import About from "./Components/About";
import Customers from "./Components/Seller/Customers";
import Messages from "./Components/Messages/Messages";
import AIAssistant from "./Components/Chatbot/AIAssistant";
import { useDispatch } from "react-redux";
import { forceLogout } from "./Features/UserSlice";

// ScrollToTop component to scroll to top on page navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// Authentication validator component
const AuthValidator = () => {
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Check if user token exists in localStorage
    const validateAuth = () => {
      try {
        const user = localStorage.getItem('user');
        if (!user) {
          // If no user in localStorage, ensure Redux state is cleared
          dispatch(forceLogout());
        }
      } catch (error) {
        console.error('Auth validation error:', error);
        dispatch(forceLogout());
      }
    };
    
    // Validate on mount
    validateAuth();
    
    // Re-validate periodically
    const interval = setInterval(validateAuth, 60000); // Check every minute
    
    // Handle page refresh/load events
    window.addEventListener('storage', validateAuth);
    
    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', validateAuth);
    };
  }, [dispatch]);
  
  return null;
};

const App = () => {
  // Enable smooth scrolling
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <Router>
      <div className="page">
        <AuthValidator />
        <AppNavbar />
        <ScrollToTop />
        <ToastContainer 
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/books" element={<BookShelf />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/books/:id" element={<BookDetail />} />
            
            {/* General user routes */}
            <Route element={<PrivateRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/bookshelf" element={<BookShelf />} />
              <Route path="/my-purchases" element={<MyPurchases />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/exchange-requests" element={<ExchangeRequests />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/assistant" element={<AIAssistant />} />
            </Route>
            
            {/* Seller routes */}
            <Route element={<PrivateRoute allowedRoles={['seller', 'admin']} />}>
              <Route path="/add-book" element={<AddBook />} />
              <Route path="/my-books" element={<MyBooks />} />
              <Route path="/customers" element={<Customers />} />
            </Route>
            
            {/* Admin routes */}
            <Route element={<PrivateRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

export default App;
