import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllTransactions } from '../../Features/TransactionSlice';
import { getBooks } from '../../Features/BookSlice';
import { Link, useLocation } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Card,
  CardBody,
  CardTitle,
  Badge,
  Table,
  Button,
  Alert,
  InputGroup,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Form,
  FormGroup,
  Label
} from 'reactstrap';
import axios from 'axios';
import * as ENV from '../../config';
import classnames from 'classnames';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { books, isLoading: booksLoading } = useSelector((state) => state.books);
  const { user } = useSelector((state) => state.users);
  
  // Parse query parameters for tab selection
  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');
  
  const [activeTab, setActiveTab] = useState(tabParam || 'books');
  const [users, setUsers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ type: '', id: '' });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      setError('Access denied. Admin privileges required.');
    }
  }, [user]);
  
  // Load books and users
  useEffect(() => {
    const fetchData = async () => {
      if (user && user.role === 'admin') {
        setIsLoading(true);
        
        try {
          // Load books
          dispatch(getBooks());
          
          // Load users
          const response = await axios.get(`${ENV.SERVER_URL}/admin/users`, {
            headers: {
              'userid': user._id
            }
          });
          
          const allUsers = response.data.users || [];
          setUsers(allUsers);
          
          // Filter users by role
          setBuyers(allUsers.filter(user => user.role === 'buyer'));
          setSellers(allUsers.filter(user => user.role === 'seller'));
          
        } catch (err) {
          console.error('Error loading admin data:', err);
          setError('Failed to load data. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchData();
  }, [dispatch, user]);
  
  // Format currency
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get badge color based on user role
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'danger';
      case 'seller':
        return 'primary';
      case 'buyer':
        return 'success';
      default:
        return 'secondary';
    }
  };
  
  // Handle delete confirmation
  const confirmDelete = (type, id, name) => {
    setDeleteTarget({ type, id, name });
    setDeleteModal(true);
  };
  
  // Handle delete
  const handleDelete = async () => {
    try {
      const { type, id } = deleteTarget;
      
      if (type === 'book') {
        await axios.delete(`${ENV.SERVER_URL}/books/${id}`, {
          headers: {
            'userid': user._id
          }
        });
        
        dispatch(getBooks()); // Refresh books
        setMessage(`Book deleted successfully`);
      } else if (type === 'user') {
        await axios.delete(`${ENV.SERVER_URL}/admin/users/${id}`, {
          headers: {
            'userid': user._id
          }
        });
        
        // Update users lists
        const updatedUsers = users.filter(user => user._id !== id);
        setUsers(updatedUsers);
        setBuyers(updatedUsers.filter(user => user.role === 'buyer'));
        setSellers(updatedUsers.filter(user => user.role === 'seller'));
        
        setMessage(`User deleted successfully`);
      }
      
      setDeleteModal(false);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
      
    } catch (err) {
      console.error('Error deleting:', err);
      setError(`Failed to delete: ${err.response?.data?.error || err.message}`);
      setDeleteModal(false);
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };
  
  // Filter books based on search term
  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter users based on search term
  const filteredBuyers = buyers.filter(buyer => 
    buyer.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    buyer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredSellers = sellers.filter(seller => 
    seller.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    seller.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Update active tab when URL changes
  useEffect(() => {
    if (tabParam && ['books', 'buyers', 'sellers'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  
  if (error === 'Access denied. Admin privileges required.') {
    return (
      <Container className="my-5">
        <Alert color="danger">
          <h4 className="alert-heading">Access Denied</h4>
          <p>You don't have permission to access the admin dashboard.</p>
          <hr />
          <p className="mb-0">Please contact an administrator if you believe this is an error.</p>
        </Alert>
      </Container>
    );
  }
  
  if (isLoading || booksLoading) {
    return (
      <Container className="text-center my-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }
  
  return (
    <Container fluid className="my-4">
      <h2 className="mb-4">Admin Dashboard</h2>
      
      {message && <Alert color="success">{message}</Alert>}
      {error && <Alert color="danger">{error}</Alert>}
      
      <Row>
        <Col md={3}>
          <Card className="mb-4">
            <CardBody>
              <Nav vertical pills>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === 'books' })}
                    onClick={() => setActiveTab('books')}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="fas fa-book me-2"></i>
                    All Books
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === 'buyers' })}
                    onClick={() => setActiveTab('buyers')}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="fas fa-shopping-cart me-2"></i>
                    All Buyers
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink
                    className={classnames({ active: activeTab === 'sellers' })}
                    onClick={() => setActiveTab('sellers')}
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="fas fa-store me-2"></i>
                    All Sellers
                  </NavLink>
                </NavItem>
              </Nav>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <div className="mb-2">Total Books: <strong>{books.length}</strong></div>
              <div className="mb-2">Total Buyers: <strong>{buyers.length}</strong></div>
              <div>Total Sellers: <strong>{sellers.length}</strong></div>
            </CardBody>
          </Card>
        </Col>
        
        <Col md={9}>
          <Card>
            <CardBody>
              {/* Search bar */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">
                  {activeTab === 'books' && 'Books Management'}
                  {activeTab === 'buyers' && 'Buyers Management'}
                  {activeTab === 'sellers' && 'Sellers Management'}
                </h4>
                <div className="d-flex">
                  <InputGroup style={{ width: "300px" }}>
                    <Input 
                      placeholder={`Search ${activeTab}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                  {activeTab === 'books' && (
                    <Button color="success" className="ms-2" tag={Link} to="/add-book">
                      <i className="fas fa-plus me-1"></i> Add Book
                    </Button>
                  )}
                </div>
              </div>
              
              <TabContent activeTab={activeTab}>
                {/* Books Tab */}
                <TabPane tabId="books">
                  {filteredBooks.length === 0 ? (
                    <Alert color="info">No books found.</Alert>
                  ) : (
                    <div className="table-responsive">
                      <Table striped hover>
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Price</th>
                            <th>Category</th>
                            <th>Seller</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBooks.map((book) => (
                            <tr key={book._id}>
                              <td>{book.title}</td>
                              <td>{book.author}</td>
                              <td>{book.isExchangeOnly ? 'Exchange Only' : formatCurrency(book.price)}</td>
                              <td>{book.category}</td>
                              <td>
                                {book.sellerId && typeof book.sellerId === 'object' 
                                  ? book.sellerId.name 
                                  : 'Unknown Seller'}
                              </td>
                              <td>
                                <Badge 
                                  color={book.status === 'available' ? 'success' : 'secondary'}
                                >
                                  {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
                                </Badge>
                              </td>
                              <td>
                                <Button 
                                  color="info" 
                                  size="sm" 
                                  tag={Link} 
                                  to={`/books/${book._id}`}
                                  className="me-1"
                                >
                                  <i className="fas fa-eye"></i>
                                </Button>
                                <Button 
                                  color="danger" 
                                  size="sm" 
                                  onClick={() => confirmDelete('book', book._id, book.title)}
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </TabPane>
                
                {/* Buyers Tab */}
                <TabPane tabId="buyers">
                  <div className="mb-3">
                    <Button color="success">
                      <i className="fas fa-user-plus me-2"></i> Add New Buyer
                    </Button>
                  </div>
                  
                  {filteredBuyers.length === 0 ? (
                    <Alert color="info">No buyers found.</Alert>
                  ) : (
                    <div className="table-responsive">
                      <Table striped hover>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Joined Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBuyers.map((buyer) => (
                            <tr key={buyer._id}>
                              <td>{buyer.name}</td>
                              <td>{buyer.email}</td>
                              <td>{buyer.createdAt ? formatDate(buyer.createdAt) : 'N/A'}</td>
                              <td>
                                <Badge color="success">Active</Badge>
                              </td>
                              <td>
                                <Button 
                                  color="primary" 
                                  size="sm" 
                                  className="me-1"
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                                <Button 
                                  color="danger" 
                                  size="sm" 
                                  onClick={() => confirmDelete('user', buyer._id, buyer.name)}
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </TabPane>
                
                {/* Sellers Tab */}
                <TabPane tabId="sellers">
                  <div className="mb-3">
                    <Button color="success">
                      <i className="fas fa-user-plus me-2"></i> Add New Seller
                    </Button>
                  </div>
                  
                  {filteredSellers.length === 0 ? (
                    <Alert color="info">No sellers found.</Alert>
                  ) : (
                    <div className="table-responsive">
                      <Table striped hover>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Joined Date</th>
                            <th>Books</th>
                            <th>Sales</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSellers.map((seller) => (
                            <tr key={seller._id}>
                              <td>{seller.name}</td>
                              <td>{seller.email}</td>
                              <td>{seller.createdAt ? formatDate(seller.createdAt) : 'N/A'}</td>
                              <td>{seller.bookCount || 0}</td>
                              <td>{seller.salesCount || 0}</td>
                              <td>
                                <Badge color="primary">Active</Badge>
                              </td>
                              <td>
                                <Button 
                                  color="primary" 
                                  size="sm" 
                                  className="me-1"
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                                <Button 
                                  color="danger" 
                                  size="sm" 
                                  onClick={() => confirmDelete('user', seller._id, seller.name)}
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </TabPane>
              </TabContent>
            </CardBody>
          </Card>
        </Col>
      </Row>
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteModal} toggle={() => setDeleteModal(!deleteModal)}>
        <ModalHeader toggle={() => setDeleteModal(!deleteModal)}>
          Confirm Delete
        </ModalHeader>
        <ModalBody>
          Are you sure you want to delete this {deleteTarget.type}?
          <p className="mt-3 mb-0">
            <strong>{deleteTarget.name}</strong>
          </p>
          {deleteTarget.type === 'user' && (
            <p className="text-danger mt-3 mb-0">
              <i className="fas fa-exclamation-triangle me-2"></i>
              This will permanently delete the user account and all associated data.
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setDeleteModal(false)}>
            Cancel
          </Button>
          <Button color="danger" onClick={handleDelete}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default AdminDashboard; 