import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getBooksBySeller, updateBook, deleteBook, clearErrors } from '../../Features/BookSlice';
import * as ENV from '../../config';
import {
  Container, 
  Row, 
  Col, 
  Table, 
  Button, 
  Spinner,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input,
  Alert
} from 'reactstrap';

const MyBooks = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.users);
  const { userBooks, isLoading, isError, message } = useSelector((state) => state.books);
  
  const [deleteModal, setDeleteModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    author: '',
    description: '',
    category: '',
    price: '',
    isExchangeOnly: false,
    status: ''
  });
  const [statusMessage, setStatusMessage] = useState('');
  
  // Add a filter state
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'available', 'sold'
  
  // Filter books based on status
  const filteredBooks = userBooks.filter(book => {
    if (statusFilter === 'all') return true;
    return book.status === statusFilter;
  });
  
  // Available categories
  const categories = [
    'Fiction',
    'Non-fiction',
    'Science',
    'Technology',
    'History',
    'Biography',
    'Self-help',
    'Business',
    'Cooking',
    'Art',
    'Travel',
    'Religion',
    'Comics',
    'Other'
  ];
  
  // Fetch seller's books when component mounts
  useEffect(() => {
    if (user && user._id) {
      dispatch(getBooksBySeller(user._id));
    }
  }, [dispatch, user]);
  
  // Handle book deletion
  const handleDeleteBook = (book) => {
    // Clear any previous errors
    dispatch({ type: "books/clearErrors" }); // This will be handled in the slice
    
    dispatch(deleteBook(book._id))
      .unwrap()
      .then((result) => {
        setDeleteModal(false);
        setSelectedBook(null);
        setStatusMessage(`Book "${book.title}" has been successfully removed.`);
        setTimeout(() => {
          setStatusMessage('');
        }, 5000);
      })
      .catch((err) => {
        console.error('Failed to delete book:', err);
        alert(`Failed to delete book: ${err}`);
        setDeleteModal(false);
      });
  };
  
  // Open edit modal with selected book data
  const openEditModal = (book) => {
    setSelectedBook(book);
    setEditFormData({
      title: book.title,
      author: book.author,
      description: book.description,
      category: book.category,
      price: book.price,
      isExchangeOnly: book.isExchangeOnly,
      status: book.status
    });
    setEditModal(true);
  };
  
  // Handle input changes in edit form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle book update
  const handleUpdateBook = () => {
    const updatedData = {
      ...editFormData,
      price: editFormData.isExchangeOnly ? 0 : editFormData.price
    };
    
    dispatch(updateBook({ bookId: selectedBook._id, bookData: updatedData }))
      .unwrap()
      .then(() => {
        setEditModal(false);
        setSelectedBook(null);
      })
      .catch((err) => {
        console.error('Failed to update:', err);
      });
  };
  
  // View PDF of a book
  const handleViewPDF = (book) => {
    if (book && book.pdfUrl) {
      window.open(`${ENV.SERVER_URL}${book.pdfUrl}`, '_blank');
    }
  };
  
  // Determine badge color based on status
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'sold':
        return 'primary';
      case 'reserved':
        return 'warning';
      default:
        return 'secondary';
    }
  };
  
  return (
    <Container className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Books</h1>
        <Button 
          color="primary" 
          onClick={() => navigate('/add-book')}
        >
          Add New Book
        </Button>
      </div>
      
      {/* Status Messages */}
      {statusMessage && (
        <Alert color="success" className="mb-4">
          {statusMessage}
        </Alert>
      )}
      {isError && (
        <Alert color="danger" className="mb-4" toggle={() => dispatch(clearErrors())}>
          {message}
        </Alert>
      )}
      
      {isLoading ? (
        <div className="text-center my-5">
          <Spinner color="primary" />
        </div>
      ) : userBooks.length === 0 ? (
        <Alert color="info">
          You haven't added any books yet. Click the "Add New Book" button to get started.
        </Alert>
      ) : (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <span className="me-2">Total Books: {userBooks.length}</span>
              <Badge color="success" className="me-2">Available: {userBooks.filter(book => book.status === 'available').length}</Badge>
              <Badge color="primary" className="me-2">Sold: {userBooks.filter(book => book.status === 'sold').length}</Badge>
              <Badge color="warning">Reserved: {userBooks.filter(book => book.status === 'reserved').length}</Badge>
            </div>
            <div>
              <span className="me-2">Filter:</span>
              <Button 
                color={statusFilter === 'all' ? 'primary' : 'secondary'}
                size="sm" 
                className="me-1"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button 
                color={statusFilter === 'available' ? 'primary' : 'secondary'}
                size="sm"
                className="me-1" 
                onClick={() => setStatusFilter('available')}
              >
                Available
              </Button>
              <Button 
                color={statusFilter === 'sold' ? 'primary' : 'secondary'}
                size="sm" 
                onClick={() => setStatusFilter('sold')}
              >
                Sold
              </Button>
            </div>
          </div>
          
          <div className="table-responsive">
            <Table bordered hover>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((book) => (
                  <tr key={book._id}>
                    <td>
                      <a 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/books/${book._id}`);
                        }}
                      >
                        {book.title}
                      </a>
                    </td>
                    <td>{book.author}</td>
                    <td>{book.category}</td>
                    <td>
                      {book.isExchangeOnly ? (
                        <Badge color="info">Exchange Only</Badge>
                      ) : (
                        `$${book.price}`
                      )}
                    </td>
                    <td>
                      <Badge color={getStatusBadgeColor(book.status)}>
                        {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
                      </Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button
                          color="success"
                          size="sm"
                          onClick={() => handleViewPDF(book)}
                          title="View PDF"
                        >
                          <i className="bi bi-file-pdf"></i> PDF
                        </Button>
                        <Button
                          color="info"
                          size="sm"
                          onClick={() => openEditModal(book)}
                          title="Edit Book"
                        >
                          Edit
                        </Button>
                        <Button
                          color="danger"
                          size="sm"
                          onClick={() => {
                            setSelectedBook(book);
                            setDeleteModal(true);
                          }}
                          title="Delete Book"
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(!deleteModal)}>
        <ModalHeader toggle={() => setDeleteModal(!deleteModal)}>
          Confirm Delete
        </ModalHeader>
        <ModalBody>
          Are you sure you want to delete the book "{selectedBook?.title}"? This action cannot be undone.
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setDeleteModal(false)}>
            Cancel
          </Button>
          <Button color="danger" onClick={() => handleDeleteBook(selectedBook)}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
      
      {/* Edit Book Modal */}
      <Modal isOpen={editModal} toggle={() => setEditModal(!editModal)} size="lg">
        <ModalHeader toggle={() => setEditModal(!editModal)}>
          Edit Book
        </ModalHeader>
        <ModalBody>
          <Form>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="title">Title</Label>
                  <Input
                    type="text"
                    name="title"
                    id="title"
                    value={editFormData.title}
                    onChange={handleInputChange}
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="author">Author</Label>
                  <Input
                    type="text"
                    name="author"
                    id="author"
                    value={editFormData.author}
                    onChange={handleInputChange}
                  />
                </FormGroup>
              </Col>
            </Row>
            
            <FormGroup>
              <Label for="description">Description</Label>
              <Input
                type="textarea"
                name="description"
                id="description"
                value={editFormData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </FormGroup>
            
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="category">Category</Label>
                  <Input
                    type="select"
                    name="category"
                    id="category"
                    value={editFormData.category}
                    onChange={handleInputChange}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="status">Status</Label>
                  <Input
                    type="select"
                    name="status"
                    id="status"
                    value={editFormData.status}
                    onChange={handleInputChange}
                  >
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="reserved">Reserved</option>
                  </Input>
                </FormGroup>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <FormGroup>
                  <div className="form-check">
                    <Input
                      type="checkbox"
                      name="isExchangeOnly"
                      id="isExchangeOnly"
                      className="form-check-input"
                      checked={editFormData.isExchangeOnly}
                      onChange={handleInputChange}
                    />
                    <Label for="isExchangeOnly" className="form-check-label">
                      Exchange Only
                    </Label>
                  </div>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="price">Price</Label>
                  <Input
                    type="number"
                    name="price"
                    id="price"
                    value={editFormData.price}
                    onChange={handleInputChange}
                    disabled={editFormData.isExchangeOnly}
                    min="0"
                    step="0.01"
                  />
                </FormGroup>
              </Col>
            </Row>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setEditModal(false)}>
            Cancel
          </Button>
          <Button color="primary" onClick={handleUpdateBook}>
            Save Changes
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default MyBooks; 