import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getUserExchangeRequests, respondToExchangeRequest } from '../../Features/TransactionSlice';
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
  CardTitle,
  Badge,
  Button,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap';
import classnames from 'classnames';

const ExchangeRequests = () => {
  const dispatch = useDispatch();
  const { exchangeRequests, isLoading } = useSelector((state) => state.transactions);
  const { user } = useSelector((state) => state.users);
  
  const [activeTab, setActiveTab] = useState('received');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseModal, setResponseModal] = useState(false);
  const [responseType, setResponseType] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Fetch exchange requests when component mounts
  useEffect(() => {
    if (user && user._id) {
      dispatch(getUserExchangeRequests());
    }
  }, [dispatch, user]);
  
  // Open response modal for handling exchange requests
  const openResponseModal = (request, type) => {
    setSelectedRequest(request);
    setResponseType(type);
    setResponseModal(true);
  };
  
  // Handle exchange request response (accept or reject)
  const handleRequestResponse = () => {
    if (!selectedRequest || !responseType) return;
    
    const status = responseType === 'accept' ? 'accepted' : 'rejected';
    
    dispatch(respondToExchangeRequest({ requestId: selectedRequest._id, status }))
      .unwrap()
      .then(() => {
        setResponseModal(false);
        setMessage(`Exchange request ${status} successfully!`);
        setTimeout(() => setMessage(''), 5000);
      })
      .catch((err) => {
        setResponseModal(false);
        setError(err);
        setTimeout(() => setError(''), 5000);
      });
  };
  
  // Format date to be more readable
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get badge color based on exchange request status
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'completed':
        return 'info';
      default:
        return 'secondary';
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
  
  const receivedRequests = exchangeRequests.received || [];
  const sentRequests = exchangeRequests.sent || [];
  
  return (
    <Container className="my-4">
      <h2 className="mb-4">Exchange Requests</h2>
      
      {message && <Alert color="success">{message}</Alert>}
      {error && <Alert color="danger">{error}</Alert>}
      
      <Card>
        <CardBody>
          <Nav tabs>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === 'received' })}
                onClick={() => setActiveTab('received')}
                style={{ cursor: 'pointer' }}
              >
                Received Requests 
                {receivedRequests.length > 0 && 
                  <Badge color="primary" className="ms-2">{receivedRequests.length}</Badge>
                }
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={classnames({ active: activeTab === 'sent' })}
                onClick={() => setActiveTab('sent')}
                style={{ cursor: 'pointer' }}
              >
                Sent Requests
                {sentRequests.length > 0 && 
                  <Badge color="primary" className="ms-2">{sentRequests.length}</Badge>
                }
              </NavLink>
            </NavItem>
          </Nav>
          
          <TabContent activeTab={activeTab} className="pt-3">
            <TabPane tabId="received">
              {receivedRequests.length === 0 ? (
                <div className="text-center py-4">
                  <p>You haven't received any exchange requests yet.</p>
                </div>
              ) : (
                receivedRequests.map((request) => (
                  <Card key={request._id} className="mb-3 exchange-request-card">
                    <CardBody>
                      <Row>
                        <Col md={8}>
                          <h5>
                            <Link to={`/books/${request.requestedBookId._id}`}>
                              {request.requestedBookId.title}
                            </Link>
                          </h5>
                          <p className="text-muted">
                            Requester: {request.requesterId.name} ({request.requesterId.email})
                          </p>
                          
                          <div className="exchange-details mt-3">
                            <Badge color="secondary" className="me-2">
                              {request.requestedBookId.category}
                            </Badge>
                            <Badge color={getStatusBadgeColor(request.status)}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                            <small className="text-muted d-block mt-2">
                              Requested: {formatDate(request.createdAt)}
                            </small>
                          </div>
                          
                          {request.message && (
                            <div className="message-box mt-3 p-2 border rounded">
                              <small className="text-muted">Message from requester:</small>
                              <p className="mb-0">{request.message}</p>
                            </div>
                          )}
                        </Col>
                        
                        <Col md={4}>
                          <div className="offered-book p-2 border rounded">
                            <h6>Offered in Exchange:</h6>
                            <Link to={`/books/${request.offeredBookId._id}`}>
                              {request.offeredBookId.title}
                            </Link>
                            <p className="text-muted mb-0">
                              by {request.offeredBookId.author}
                            </p>
                          </div>
                          
                          {request.status === 'pending' && (
                            <div className="action-buttons mt-3">
                              <Button
                                color="success"
                                className="me-2"
                                onClick={() => openResponseModal(request, 'accept')}
                              >
                                Accept
                              </Button>
                              <Button
                                color="danger"
                                onClick={() => openResponseModal(request, 'reject')}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </Col>
                      </Row>
                    </CardBody>
                  </Card>
                ))
              )}
            </TabPane>
            
            <TabPane tabId="sent">
              {sentRequests.length === 0 ? (
                <div className="text-center py-4">
                  <p>You haven't sent any exchange requests yet.</p>
                </div>
              ) : (
                sentRequests.map((request) => (
                  <Card key={request._id} className="mb-3 exchange-request-card">
                    <CardBody>
                      <Row>
                        <Col md={8}>
                          <h5>
                            <Link to={`/books/${request.requestedBookId._id}`}>
                              {request.requestedBookId.title}
                            </Link>
                          </h5>
                          <p className="text-muted">
                            Owner: {request.ownerId.name} ({request.ownerId.email})
                          </p>
                          
                          <div className="exchange-details mt-3">
                            <Badge color="secondary" className="me-2">
                              {request.requestedBookId.category}
                            </Badge>
                            <Badge color={getStatusBadgeColor(request.status)}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                            <small className="text-muted d-block mt-2">
                              Requested: {formatDate(request.createdAt)}
                            </small>
                          </div>
                          
                          {request.message && (
                            <div className="message-box mt-3 p-2 border rounded">
                              <small className="text-muted">Your message:</small>
                              <p className="mb-0">{request.message}</p>
                            </div>
                          )}
                        </Col>
                        
                        <Col md={4}>
                          <div className="offered-book p-2 border rounded">
                            <h6>You Offered:</h6>
                            <Link to={`/books/${request.offeredBookId._id}`}>
                              {request.offeredBookId.title}
                            </Link>
                            <p className="text-muted mb-0">
                              by {request.offeredBookId.author}
                            </p>
                          </div>
                        </Col>
                      </Row>
                    </CardBody>
                  </Card>
                ))
              )}
            </TabPane>
          </TabContent>
        </CardBody>
      </Card>
      
      {/* Response Modal */}
      <Modal isOpen={responseModal} toggle={() => setResponseModal(!responseModal)}>
        <ModalHeader toggle={() => setResponseModal(!responseModal)}>
          {responseType === 'accept' ? 'Accept Exchange Request' : 'Reject Exchange Request'}
        </ModalHeader>
        <ModalBody>
          {responseType === 'accept' ? (
            <p>
              Are you sure you want to accept the exchange request for your 
              book "{selectedRequest?.requestedBookId?.title}" in exchange 
              for "{selectedRequest?.offeredBookId?.title}"?
            </p>
          ) : (
            <p>
              Are you sure you want to reject the exchange request for your 
              book "{selectedRequest?.requestedBookId?.title}"?
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setResponseModal(false)}>
            Cancel
          </Button>
          <Button 
            color={responseType === 'accept' ? 'success' : 'danger'} 
            onClick={handleRequestResponse}
          >
            {responseType === 'accept' ? 'Accept Exchange' : 'Reject Exchange'}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default ExchangeRequests; 