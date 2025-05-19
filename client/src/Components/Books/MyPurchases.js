import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardTitle,
  CardText,
  CardImg,
  Badge,
  Button,
  Alert,
  Spinner,
  ListGroup,
  ListGroupItem,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap';
import axios from 'axios';
import * as ENV from '../../config';

const MyPurchases = () => {
  const { user } = useSelector((state) => state.users);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  
  // Function to fetch user's purchased books
  const fetchPurchases = async () => {
    try {
      setLoading(true);
      
      // Get user ID from localStorage or Redux state
      let userId = null;
      const storedUser = localStorage.getItem('user');
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          userId = parsedUser._id;
        } catch (err) {
          console.error('Error parsing localStorage user:', err);
        }
      }
      
      if (!userId && user && user._id) {
        userId = user._id;
      }
      
      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }
      
      // Fetch transactions where the user is the buyer
      const response = await axios.get(
        `${ENV.SERVER_URL}/transactions/user-purchases`,
        {
          headers: {
            'userid': userId
          }
        }
      );
      
      setPurchases(response.data.purchases);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching purchases:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load purchases');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [user]);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Handle remove book from library
  const handleRemoveBook = async () => {
    if (!selectedPurchase) return;
    
    try {
      const userId = JSON.parse(localStorage.getItem('user'))._id;
      
      await axios.delete(
        `${ENV.SERVER_URL}/transactions/${selectedPurchase._id}/remove`,
        {
          headers: {
            'userid': userId
          }
        }
      );
      
      // Remove the book from the local state
      setPurchases(purchases.filter(p => p._id !== selectedPurchase._id));
      setDeleteModal(false);
      setSelectedPurchase(null);
      
      // Show success alert
      alert('Book has been removed from your library');
    } catch (err) {
      console.error('Error removing book:', err);
      alert('Failed to remove book: ' + (err.response?.data?.error || err.message));
    }
  };
  
  // Function to display download/access buttons based on book type and transaction status
  const renderAccessOptions = (purchase) => {
    // Check if the book exists
    if (!purchase.book) {
      return (
        <div className="d-flex justify-content-between w-100">
          <Badge color="secondary">
            Access Unavailable
          </Badge>
          <Button 
            color="danger" 
            size="sm" 
            onClick={() => {
              setSelectedPurchase(purchase);
              setDeleteModal(true);
            }}
          >
            <i className="fas fa-trash me-1"></i> Remove
          </Button>
        </div>
      );
    }
    
    // Check if the book is marked as deleted but still accessible
    if (purchase.book.status === 'deleted') {
      return (
        <div className="d-flex justify-content-between w-100">
          <Button color="primary" size="sm" tag="a" href={`${ENV.SERVER_URL}${purchase.book.pdfUrl}`} target="_blank" download>
            <i className="fas fa-download me-1"></i> Download
          </Button>
          <Button 
            color="danger" 
            size="sm" 
            onClick={() => {
              setSelectedPurchase(purchase);
              setDeleteModal(true);
            }}
          >
            <i className="fas fa-trash me-1"></i> Remove
          </Button>
        </div>
      );
    }

    if (purchase.status !== 'completed') {
      return (
        <div className="d-flex justify-content-between w-100">
          <Badge color={
            purchase.status === 'pending' ? 'warning' : 
            purchase.status === 'cancelled' ? 'danger' : 'info'
          }>
            {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
          </Badge>
          <Button 
            color="danger" 
            size="sm" 
            onClick={() => {
              setSelectedPurchase(purchase);
              setDeleteModal(true);
            }}
          >
            <i className="fas fa-trash me-1"></i> Remove
          </Button>
        </div>
      );
    }
    
    return (
      <div className="d-flex justify-content-between w-100">
        <div>
          <Button color="primary" size="sm" tag="a" href={`${ENV.SERVER_URL}${purchase.book.pdfUrl}`} target="_blank" download>
            <i className="fas fa-download me-1"></i> Download
          </Button>
          <Button color="info" size="sm" tag={Link} to={`/books/${purchase.book._id}`} className="ms-2">
            <i className="fas fa-eye me-1"></i> View Details
          </Button>
        </div>
        <Button 
          color="danger" 
          size="sm" 
          onClick={() => {
            setSelectedPurchase(purchase);
            setDeleteModal(true);
          }}
        >
          <i className="fas fa-trash me-1"></i> Remove
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner color="primary" />
        <p>Loading your purchased books...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert color="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <h1 className="mb-4">My Library</h1>
      
      {purchases.length === 0 ? (
        <Alert color="info">
          Your personal library is empty. <Link to="/books">Browse our collection</Link> to find books to add to your library.
        </Alert>
      ) : (
        <>
          <Alert color="success" className="mb-4">
            <i className="fas fa-info-circle me-2"></i>
            You have {purchases.length} book{purchases.length !== 1 ? 's' : ''} in your personal library.
          </Alert>
          
          <Row>
            {purchases.map((purchase) => (
              <Col md="4" className="mb-4" key={purchase._id}>
                <Card className="h-100 shadow-sm">
                  {purchase.book ? (
                    // Book exists
                    <>
                      {purchase.book.coverImage ? (
                        <CardImg 
                          top 
                          src={`${ENV.SERVER_URL}${purchase.book.coverImage}`} 
                          alt={purchase.book.title} 
                          style={{ height: '200px', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div 
                          className="bg-light d-flex align-items-center justify-content-center" 
                          style={{ height: '200px' }}
                        >
                          <i className="fas fa-book fa-3x text-secondary"></i>
                        </div>
                      )}
                      <CardBody>
                        <CardTitle tag="h5" className="mb-3">
                          {purchase.book.title}
                          {purchase.status === 'completed' && purchase.book.status !== 'deleted' && (
                            <Badge color="success" className="ms-2">Purchased</Badge>
                          )}
                          {purchase.book.status === 'deleted' && (
                            <Badge color="secondary" className="ms-2">Archived</Badge>
                          )}
                        </CardTitle>
                        <CardText>
                          <small className="text-muted">
                            <i className="fas fa-user me-2"></i>
                            {purchase.book.author}
                          </small>
                          {purchase.book.status === 'deleted' && (
                            <div className="mt-1 text-muted">
                              <small>This book is in your personal library</small>
                            </div>
                          )}
                        </CardText>
                        <ListGroup flush className="mb-3">
                          <ListGroupItem className="px-0">
                            <i className="fas fa-calendar-alt me-2"></i>
                            Purchased: {formatDate(purchase.transactionDate)}
                          </ListGroupItem>
                          <ListGroupItem className="px-0">
                            <i className="fas fa-tag me-2"></i>
                            Price: ${purchase.price.toFixed(2)}
                          </ListGroupItem>
                        </ListGroup>
                        <div className="d-flex justify-content-between">
                          {renderAccessOptions(purchase)}
                        </div>
                      </CardBody>
                    </>
                  ) : (
                    // Book was completely deleted from database (should rarely happen)
                    <>
                      <div 
                        className="bg-light d-flex align-items-center justify-content-center" 
                        style={{ height: '200px' }}
                      >
                        <i className="fas fa-book fa-3x text-secondary"></i>
                      </div>
                      <CardBody>
                        <CardTitle tag="h5" className="mb-3">
                          Purchased Book
                          <Badge color="secondary" className="ms-2">Archived</Badge>
                        </CardTitle>
                        <CardText>
                          <small className="text-muted">
                            This book is in your personal library
                          </small>
                        </CardText>
                        <ListGroup flush className="mb-3">
                          <ListGroupItem className="px-0">
                            <i className="fas fa-calendar-alt me-2"></i>
                            Purchased: {formatDate(purchase.transactionDate)}
                          </ListGroupItem>
                          <ListGroupItem className="px-0">
                            <i className="fas fa-tag me-2"></i>
                            Price: ${purchase.price.toFixed(2)}
                          </ListGroupItem>
                        </ListGroup>
                        <div className="d-flex justify-content-between">
                          <Button color="secondary" size="sm" disabled>
                            <i className="fas fa-download me-1"></i> Download Unavailable
                          </Button>
                          <Button 
                            color="danger" 
                            size="sm" 
                            onClick={() => {
                              setSelectedPurchase(purchase);
                              setDeleteModal(true);
                            }}
                          >
                            <i className="fas fa-trash me-1"></i> Remove
                          </Button>
                        </div>
                      </CardBody>
                    </>
                  )}
                </Card>
              </Col>
            ))}
          </Row>
        </>
      )}
      
      {/* Confirmation Modal for Deleting Book from Library */}
      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(!deleteModal)}>
        <ModalHeader toggle={() => setDeleteModal(!deleteModal)}>
          Remove Book from Library
        </ModalHeader>
        <ModalBody>
          Are you sure you want to remove this book from your library? This action cannot be undone.
          {selectedPurchase && selectedPurchase.book && (
            <div className="mt-3">
              <strong>Book:</strong> {selectedPurchase.book.title}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setDeleteModal(false)}>
            Cancel
          </Button>
          <Button color="danger" onClick={handleRemoveBook}>
            Remove
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default MyPurchases; 