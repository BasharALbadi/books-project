import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  Table,
  Badge,
  Spinner,
  Alert,
  Button
} from 'reactstrap';
import axios from 'axios';
import * as ENV from '../../config';

const Customers = () => {
  const { user } = useSelector((state) => state.users);
  
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch customers that can be called on retry
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test API connection first
      try {
        const testResponse = await axios.get(`${ENV.SERVER_URL}/api-test`);
        console.log('API test response:', testResponse.data);
      } catch (testErr) {
        console.error('API test failed:', testErr);
        throw new Error('Server API is not reachable. Check if the server is running.');
      }
      
      // Get authenticated user ID
      let userId = null;
      
      // First try to get from localStorage which is more reliable
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          userId = parsedUser._id;
          console.log('Using userId from localStorage:', userId);
        } catch (parseErr) {
          console.error('Error parsing localStorage user:', parseErr);
        }
      }
      
      // If localStorage failed, try from Redux state
      if (!userId && user && user._id) {
        userId = user._id;
        console.log('Using userId from Redux state:', userId);
      }
      
      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }
      
      // Make API call with userId
      console.log(`Making API call to ${ENV.SERVER_URL}/transactions/customers`);
      console.log('Server URL:', ENV.SERVER_URL);
      
      const response = await axios.get(
        `${ENV.SERVER_URL}/transactions/customers`,
        {
          headers: {
            'userid': userId,
            'Content-Type': 'application/json'
          },
        }
      );
      
      console.log('API response:', response.data);
      
      if (response.data && response.data.customers) {
        setCustomers(response.data.customers);
      } else {
        setCustomers([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching customers:', err);
      
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        setError(`${err.message} (Status: ${err.response.status})`);
      } else if (err.request) {
        console.error('Request error (no response):', err.request);
        setError('No response from server. Please check your internet connection.');
      } else {
        setError(err.message || 'Failed to load customers');
      }
      
      setLoading(false);
    }
  };

  // Call fetchCustomers on component mount
  useEffect(() => {
    fetchCustomers();
  }, [user]);

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get total purchases by customer
  const getCustomerTotal = (customer) => {
    return customer.transactions.reduce((total, transaction) => {
      return total + transaction.price;
    }, 0);
  };

  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner color="primary" />
        <p>Loading customers...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert color="danger">
          {error}
          <div className="mt-3">
            <Button color="primary" onClick={fetchCustomers}>
              Retry
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="my-4">
      <h1 className="mb-4">My Customers</h1>
      
      {customers.length === 0 ? (
        <Alert color="info">
          You don't have any customers yet. Once your books are purchased, your customers will appear here.
          <div className="mt-3">
            <Button color="success" onClick={() => {
              // If there are no real customers, show sample data for testing
              setCustomers([
                {
                  _id: 'sample-customer-1',
                  firstName: 'Ahmed',
                  lastName: 'Mohammed',
                  email: 'ahmed@example.com',
                  transactions: [
                    {
                      _id: 'sample-transaction-1',
                      bookId: 'book-1',
                      price: 29.99,
                      transactionDate: new Date().toISOString(),
                      status: 'completed'
                    }
                  ]
                }
              ]);
            }}>
              Show Sample Data (For Testing)
            </Button>
            <Button color="warning" className="ms-2" onClick={async () => {
              try {
                setLoading(true);
                const userId = JSON.parse(localStorage.getItem('user'))._id;
                const response = await axios.post(
                  `${ENV.SERVER_URL}/create-test-transaction`,
                  {},
                  { headers: { 'userid': userId } }
                );
                console.log('Created test transaction:', response.data);
                alert('Test transaction created successfully! Refreshing data...');
                fetchCustomers();
              } catch (err) {
                console.error('Failed to create test transaction:', err);
                alert('Failed to create test transaction: ' + (err.response?.data?.error || err.message));
                setLoading(false);
              }
            }}>
              Create Test Transaction
            </Button>
          </div>
        </Alert>
      ) : (
        <>
          <Row className="mb-4">
            <Col sm="4">
              <Card className="text-center bg-primary text-white">
                <CardBody>
                  <h3>{customers.length}</h3>
                  <p>Total Customers</p>
                </CardBody>
              </Card>
            </Col>
            <Col sm="4">
              <Card className="text-center bg-success text-white">
                <CardBody>
                  <h3>
                    ${customers.reduce((total, customer) => {
                      return total + getCustomerTotal(customer);
                    }, 0).toFixed(2)}
                  </h3>
                  <p>Total Revenue</p>
                </CardBody>
              </Card>
            </Col>
            <Col sm="4">
              <Card className="text-center bg-info text-white">
                <CardBody>
                  <h3>
                    {customers.reduce((total, customer) => {
                      return total + customer.transactions.length;
                    }, 0)}
                  </h3>
                  <p>Total Orders</p>
                </CardBody>
              </Card>
            </Col>
          </Row>

          <Card>
            <CardBody>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Books Purchased</th>
                    <th>Total Spent</th>
                    <th>Last Purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div>
                            <span className="fw-bold">{customer.firstName} {customer.lastName}</span>
                          </div>
                        </div>
                      </td>
                      <td>{customer.email}</td>
                      <td>
                        {customer.transactions.length}
                        <Badge color="primary" pill className="ms-2">
                          {customer.transactions.length > 1 ? 'items' : 'item'}
                        </Badge>
                      </td>
                      <td>${getCustomerTotal(customer).toFixed(2)}</td>
                      <td>
                        {formatDate(customer.transactions.sort((a, b) => 
                          new Date(b.transactionDate) - new Date(a.transactionDate)
                        )[0].transactionDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </CardBody>
          </Card>
        </>
      )}
    </Container>
  );
};

export default Customers; 