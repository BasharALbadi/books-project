import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getBookById } from '../../Features/BookSlice';
import { purchaseBook } from '../../Features/TransactionSlice';
import { getBooksBySeller } from '../../Features/BookSlice';
import { requestExchange } from '../../Features/TransactionSlice';
import {
  Container,
  Row,
  Col,
  Card,
  CardImg,
  CardBody,
  CardTitle,
  CardSubtitle,
  CardText,
  Button,
  Badge,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input
} from 'reactstrap';
import * as ENV from '../../config';
import axios from 'axios';

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { book, userBooks, isLoading } = useSelector((state) => state.books);
  const { user, isSuccess } = useSelector((state) => state.users);
  const { isLoading: transactionLoading, isSuccess: transactionSuccess } = useSelector(
    (state) => state.transactions
  );
  
  const [purchaseModal, setPurchaseModal] = useState(false);
  const [exchangeModal, setExchangeModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [selectedBookForExchange, setSelectedBookForExchange] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  
  // Fetch book details when component mounts
  useEffect(() => {
    if (id) {
      dispatch(getBookById(id));
    }
  }, [dispatch, id]);
  
  // Check if the user has already purchased this book
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (!user || !user._id || !id || !book) return;
      
      console.log('Checking purchase status for book:', id);
      
      try {
        const response = await axios.get(
          `${ENV.SERVER_URL}/transactions/user-purchases`,
          {
            headers: {
              'userid': user._id
            }
          }
        );
        
        console.log('User purchases:', response.data.purchases.length);
        
        // Check if the current book ID is in the user's purchases
        // Convert both IDs to strings to ensure proper comparison
        const purchased = response.data.purchases.some(purchase => 
          purchase.book && purchase.book._id && 
          purchase.book._id.toString() === id.toString()
        );
        
        console.log('Has purchased this book:', purchased);
        setHasPurchased(purchased);
      } catch (err) {
        console.error('Error checking purchase status:', err);
      }
    };
    
    if (user && book) {
      checkPurchaseStatus();
    }
  }, [user, id, book]);
  
  // Fetch user's books for exchange if user is logged in
  useEffect(() => {
    if (isSuccess && user && user._id && user.role === 'seller') {
      dispatch(getBooksBySeller(user._id));
    }
  }, [dispatch, isSuccess, user]);
  
  // Handle purchase submission
  const handlePurchase = () => {
    if (!isSuccess || !user) {
      setError('You must be logged in to make a purchase');
      return;
    }
    
    dispatch(purchaseBook({ bookId: id, paymentMethod }))
      .unwrap()
      .then(() => {
        setPurchaseModal(false);
        setMessage('Purchase successful! Check your transactions for details.');
      })
      .catch((err) => {
        setError(err);
        setPurchaseModal(false);
      });
  };
  
  // Handle PDF view
  const handleViewPDF = () => {
    if (book && book.pdfUrl) {
      // Open PDF in a new tab
      window.open(`${ENV.SERVER_URL}${book.pdfUrl}`, '_blank');
    }
  };
  
  // Handle exchange request submission
  const handleExchangeRequest = () => {
    if (!isSuccess || !user) {
      setError('You must be logged in to request an exchange');
      return;
    }
    
    if (!selectedBookForExchange) {
      setError('Please select a book to offer for exchange');
      return;
    }
    
    dispatch(
      requestExchange({
        requestedBookId: id,
        offeredBookId: selectedBookForExchange,
        message,
      })
    )
      .unwrap()
      .then(() => {
        setExchangeModal(false);
        setMessage('Exchange request sent successfully!');
      })
      .catch((err) => {
        setError(err);
        setExchangeModal(false);
      });
  };
  
  // Handle send message to seller
  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      setError("Message cannot be empty");
      return;
    }
    
    try {
      const userId = user._id;
      const response = await axios.post(
        `${ENV.SERVER_URL}/messages`,
        {
          receiverId: book.sellerId._id,
          bookId: book._id,
          content: messageContent
        },
        {
          headers: {
            'userid': userId,
          },
        }
      );
      
      setMessageContent('');
      setContactModal(false);
      setMessageSent(true);
      setTimeout(() => setMessageSent(false), 5000);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to send message");
    }
  };
  
  if (isLoading) {
    return (
      <Container className="text-center my-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }
  
  if (!book) {
    return (
      <Container className="text-center my-5">
        <Alert color="danger">Book not found</Alert>
      </Container>
    );
  }
  
  // Determine if the current user is the seller of this book
  const isOwner = user && book.sellerId && user._id === book.sellerId._id;
  
  // Determine if the user can access the PDF
  // Owner can always access, admins can access, and buyers who have purchased can access
  const canAccessPDF = isOwner || (user && user.role === 'admin') || hasPurchased;
  
  return (
    <Container className="my-4">
      {message && <Alert color="success">{message}</Alert>}
      {error && <Alert color="danger">{error}</Alert>}
      {messageSent && (
        <Alert color="success">
          Message sent successfully! The seller will get back to you soon.
        </Alert>
      )}
      
      <Row>
        <Col md={4}>
          <Card className="book-detail-card">
            <CardImg
              top
              width="100%"
              src={book.coverImage ? `${ENV.SERVER_URL}${book.coverImage}` : 'https://via.placeholder.com/300x400?text=No+Cover'}
              alt={book.title}
              className="book-detail-cover"
            />
            
            {/* PDF View Button */}
            {canAccessPDF && book.pdfUrl && (
              <Button 
                color="success" 
                block 
                className="mt-3"
                onClick={handleViewPDF}
              >
                <i className="bi bi-file-earmark-pdf me-2"></i>
                View PDF
              </Button>
            )}
          </Card>
        </Col>
        
        <Col md={8}>
          <h1>{book.title}</h1>
          <h4 className="text-muted">{book.author}</h4>
          
          <div className="my-3">
            <Badge color="secondary" className="me-2">{book.category}</Badge>
            {book.isExchangeOnly ? (
              <Badge color="info">Exchange Only</Badge>
            ) : (
              <Badge color="success">${book.price}</Badge>
            )}
            {book.status === 'deleted' && (
              <Badge color="secondary" className="ms-2">Archived</Badge>
            )}
          </div>
          
          <CardText className="book-description">
            {book.description}
          </CardText>
          
          <div className="seller-info mt-4">
            <h5>Seller Information</h5>
            <p>
              {book.sellerId && book.sellerId.name} ({book.sellerId && book.sellerId.email})
            </p>
          </div>
          
          <div className="book-actions mt-4">
            {/* Only show purchase option if not owner and book is not exchange only */}
            {!isOwner && !book.isExchangeOnly && book.status !== 'deleted' && (
              <>
                {hasPurchased ? (
                  <Button 
                    color="success" 
                    disabled
                    className="me-2"
                  >
                    <i className="bi bi-check-circle me-1"></i> Already Purchased
                  </Button>
                ) : (
                  <Button 
                    color="primary" 
                    onClick={() => setPurchaseModal(true)}
                    className="me-2"
                  >
                    <i className="bi bi-cart-plus me-1"></i> Buy Now (${book.price})
                  </Button>
                )}
              </>
            )}
            
            {/* Only show exchange option if not owner, user is a seller, and book isn't deleted */}
            {!isOwner && user && user.role === 'seller' && book.status !== 'deleted' && (
              <Button 
                color="secondary" 
                onClick={() => setExchangeModal(true)}
                className="me-2"
              >
                <i className="bi bi-arrow-left-right me-1"></i> Offer Exchange
              </Button>
            )}
            
            {/* Contact seller button - visible to all logged in users except the owner */}
            {!isOwner && user && (
              <Button 
                color="info" 
                onClick={() => setContactModal(true)}
                className="me-2"
              >
                <i className="bi bi-chat-dots me-1"></i> Contact Seller
              </Button>
            )}
            
            {/* ... existing buttons ... */}
          </div>
          
          {!isOwner && book.status === 'deleted' && (
            <div className="mt-4">
              <Alert color="secondary">
                <div className="d-flex align-items-center">
                  <i className="bi bi-archive me-2" style={{ fontSize: "1.5rem" }}></i>
                  <div>
                    <strong>This book is no longer available</strong>
                    <p className="mb-0 small">
                      The seller has archived this book and it is not available for new purchases.
                    </p>
                  </div>
                </div>
              </Alert>
            </div>
          )}
          
          {isOwner && (
            <div className="owner-actions mt-4">
              <Button 
                color="secondary" 
                onClick={() => navigate(`/my-books`)}
                className="me-2"
              >
                Manage Your Books
              </Button>
              
              {book.pdfUrl && (
                <Button 
                  color="success" 
                  onClick={handleViewPDF}
                >
                  View PDF
                </Button>
              )}
            </div>
          )}
        </Col>
      </Row>
      
      {/* Purchase Modal */}
      <Modal isOpen={purchaseModal} toggle={() => setPurchaseModal(!purchaseModal)}>
        <ModalHeader toggle={() => setPurchaseModal(!purchaseModal)}>
          Confirm Purchase
        </ModalHeader>
        <ModalBody>
          <p>You are about to purchase: <strong>{book.title}</strong></p>
          <p>Price: <strong>${book.price}</strong></p>
          
          <Form>
            <FormGroup>
              <Label for="paymentMethod">Payment Method</Label>
              <Input 
                type="select" 
                name="paymentMethod" 
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="credit_card">Credit Card</option>
                <option value="paypal">PayPal</option>
                <option value="other">Other</option>
              </Input>
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setPurchaseModal(false)}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            onClick={handlePurchase}
            disabled={transactionLoading}
          >
            {transactionLoading ? 'Processing...' : 'Confirm Purchase'}
          </Button>
        </ModalFooter>
      </Modal>
      
      {/* Exchange Modal */}
      <Modal isOpen={exchangeModal} toggle={() => setExchangeModal(!exchangeModal)}>
        <ModalHeader toggle={() => setExchangeModal(!exchangeModal)}>
          Request Book Exchange
        </ModalHeader>
        <ModalBody>
          <p>You are requesting to exchange for: <strong>{book.title}</strong></p>
          
          <Form>
            <FormGroup>
              <Label for="bookToExchange">Select Your Book to Exchange</Label>
              {userBooks.length === 0 ? (
                <Alert color="info">
                  You don't have any books to offer for exchange. 
                  <br />
                  <Button 
                    color="link" 
                    className="p-0" 
                    onClick={() => {
                      setExchangeModal(false);
                      navigate('/add-book');
                    }}
                  >
                    Add a book first
                  </Button>
                </Alert>
              ) : (
                <Input 
                  type="select" 
                  name="bookToExchange" 
                  id="bookToExchange"
                  value={selectedBookForExchange}
                  onChange={(e) => setSelectedBookForExchange(e.target.value)}
                >
                  <option value="">Select a book...</option>
                  {userBooks
                    .filter(b => b.status === 'available')
                    .map(b => (
                      <option key={b._id} value={b._id}>
                        {b.title} ({b.isExchangeOnly ? 'Exchange Only' : `$${b.price}`})
                      </option>
                    ))}
                </Input>
              )}
            </FormGroup>
            
            <FormGroup>
              <Label for="message">Message to Seller (Optional)</Label>
              <Input 
                type="textarea" 
                name="message" 
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter a message to the seller..."
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setExchangeModal(false)}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            onClick={handleExchangeRequest}
            disabled={transactionLoading || !selectedBookForExchange || userBooks.length === 0}
          >
            {transactionLoading ? 'Processing...' : 'Send Exchange Request'}
          </Button>
        </ModalFooter>
      </Modal>
      
      {/* Contact Seller Modal */}
      <Modal isOpen={contactModal} toggle={() => setContactModal(!contactModal)}>
        <ModalHeader toggle={() => setContactModal(!contactModal)}>
          Contact the Seller
        </ModalHeader>
        <ModalBody>
          <p>Send a message to {book.sellerId && book.sellerId.name} about book "{book.title}"</p>
          <Form>
            <FormGroup>
              <Label for="messageContent">Your Message</Label>
              <Input 
                type="textarea" 
                id="messageContent"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={4}
                placeholder="Ask questions about the book..."
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setContactModal(false)}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            onClick={handleSendMessage}
          >
            Send Message
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default BookDetail; 