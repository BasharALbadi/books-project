import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
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
  Badge,
  Table,
  Button,
  Alert
} from 'reactstrap';
import classnames from 'classnames';

const Transactions = () => {
  const dispatch = useDispatch();
  const { userTransactions, isLoading } = useSelector((state) => state.transactions);
  const { user } = useSelector((state) => state.users);
  
  const [activeTab, setActiveTab] = useState('purchases');
  
  // Mock data - In a real application, you would fetch this from the API
  // Using mock data here since we haven't implemented the transaction fetching yet
  const mockPurchases = [
    {
      _id: '1',
      bookId: { 
        _id: 'book1', 
        title: 'The Great Gatsby', 
        author: 'F. Scott Fitzgerald',
        price: 12.99,
        category: 'Fiction'
      },
      sellerId: { 
        _id: 'seller1', 
        name: 'John Doe', 
        email: 'johndoe@example.com' 
      },
      price: 12.99,
      status: 'completed',
      paymentMethod: 'credit_card',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    },
    {
      _id: '2',
      bookId: { 
        _id: 'book2', 
        title: 'To Kill a Mockingbird', 
        author: 'Harper Lee',
        price: 10.50,
        category: 'Fiction'
      },
      sellerId: { 
        _id: 'seller2', 
        name: 'Jane Smith', 
        email: 'janesmith@example.com' 
      },
      price: 10.50,
      status: 'pending',
      paymentMethod: 'paypal',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    }
  ];
  
  const mockSales = [
    {
      _id: '3',
      bookId: { 
        _id: 'book3', 
        title: '1984', 
        author: 'George Orwell',
        price: 9.99,
        category: 'Fiction'
      },
      buyerId: { 
        _id: 'buyer1', 
        name: 'Alice Johnson', 
        email: 'alicejohnson@example.com' 
      },
      price: 9.99,
      status: 'completed',
      paymentMethod: 'credit_card',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    },
    {
      _id: '4',
      bookId: { 
        _id: 'book4', 
        title: 'The Hobbit', 
        author: 'J.R.R. Tolkien',
        price: 15.99,
        category: 'Fantasy'
      },
      buyerId: { 
        _id: 'buyer2', 
        name: 'Bob Wilson', 
        email: 'bobwilson@example.com' 
      },
      price: 15.99,
      status: 'pending',
      paymentMethod: 'paypal',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    }
  ];
  
  // Format currency
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get badge color based on transaction status
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
  // In a real app, we would fetch the actual transactions instead of using mock data
  const purchases = mockPurchases;
  const sales = mockSales;
  
  if (isLoading) {
    return (
      <Container className="text-center my-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }
  
  return (
    <Container className="my-4">
      <h2 className="mb-4">Transactions</h2>
      
      <Card>
        <CardBody>
          <Nav tabs>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === 'purchases' })}
                onClick={() => setActiveTab('purchases')}
                style={{ cursor: 'pointer' }}
              >
                My Purchases
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === 'sales' })}
                onClick={() => setActiveTab('sales')}
                style={{ cursor: 'pointer' }}
              >
                My Sales
              </NavLink>
            </NavItem>
          </Nav>
          
          <TabContent activeTab={activeTab} className="pt-3">
            <TabPane tabId="purchases">
              {purchases.length === 0 ? (
                <div className="text-center py-4">
                  <p>You haven't made any purchases yet.</p>
                  <Button color="primary" tag={Link} to="/books">
                    Browse Books
                  </Button>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped>
                    <thead>
                      <tr>
                        <th>Book</th>
                        <th>Seller</th>
                        <th>Price</th>
                        <th>Payment Method</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((transaction) => (
                        <tr key={transaction._id}>
                          <td>
                            <Link to={`/books/${transaction.bookId._id}`}>
                              {transaction.bookId.title}
                            </Link>
                            <div className="text-muted small">
                              by {transaction.bookId.author}
                            </div>
                          </td>
                          <td>{transaction.sellerId.name}</td>
                          <td>{formatCurrency(transaction.price)}</td>
                          <td className="text-capitalize">
                            {transaction.paymentMethod.replace('_', ' ')}
                          </td>
                          <td>{formatDate(transaction.createdAt)}</td>
                          <td>
                            <Badge color={getStatusBadgeColor(transaction.status)}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </TabPane>
            
            <TabPane tabId="sales">
              {sales.length === 0 ? (
                <div className="text-center py-4">
                  <p>You haven't made any sales yet.</p>
                  {user.role === 'seller' && (
                    <Button color="primary" tag={Link} to="/add-book">
                      Add a Book to Sell
                    </Button>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped>
                    <thead>
                      <tr>
                        <th>Book</th>
                        <th>Buyer</th>
                        <th>Price</th>
                        <th>Payment Method</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((transaction) => (
                        <tr key={transaction._id}>
                          <td>
                            <Link to={`/books/${transaction.bookId._id}`}>
                              {transaction.bookId.title}
                            </Link>
                            <div className="text-muted small">
                              by {transaction.bookId.author}
                            </div>
                          </td>
                          <td>{transaction.buyerId.name}</td>
                          <td>{formatCurrency(transaction.price)}</td>
                          <td className="text-capitalize">
                            {transaction.paymentMethod.replace('_', ' ')}
                          </td>
                          <td>{formatDate(transaction.createdAt)}</td>
                          <td>
                            <Badge color={getStatusBadgeColor(transaction.status)}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </Badge>
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
    </Container>
  );
};

export default Transactions; 