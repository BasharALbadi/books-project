import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Nav,
  NavItem,
  NavLink,
  TabContent,
  TabPane,
  Card,
  CardBody,
  Badge,
  Spinner,
  Alert,
  Row,
  Col,
  Button,
  Modal, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Form,
  FormGroup,
  Label,
  Input
} from 'reactstrap';
import classnames from 'classnames';
import * as ENV from '../../config';

const Messages = () => {
  const { user } = useSelector((state) => state.users);
  const [activeTab, setActiveTab] = useState('received');
  const [messages, setMessages] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [replyModal, setReplyModal] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Cargar mensajes
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const userId = user._id;
        
        const response = await axios.get(
          `${ENV.SERVER_URL}/messages`,
          {
            headers: {
              'userid': userId,
            },
          }
        );
        
        setMessages({
          sent: response.data.sent,
          received: response.data.received
        });
        setLoading(false);
      } catch (err) {
        setError('Failed to load messages');
        setLoading(false);
      }
    };
    
    if (user && user._id) {
      fetchMessages();
    }
  }, [user]);
  
  // Marcar mensaje como leído
  const markAsRead = async (messageId) => {
    try {
      await axios.put(
        `${ENV.SERVER_URL}/messages/${messageId}/read`,
        {},
        {
          headers: {
            'userid': user._id,
          },
        }
      );
      
      // Actualizar estado local
      setMessages(prev => ({
        ...prev,
        received: prev.received.map(msg => 
          msg._id === messageId ? { ...msg, isRead: true } : msg
        )
      }));
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  // Eliminar mensaje
  const deleteMessage = async (messageId, type) => {
    try {
      await axios.delete(
        `${ENV.SERVER_URL}/messages/${messageId}`,
        {
          headers: {
            'userid': user._id,
          },
        }
      );
      
      // Actualizar estado local
      setMessages(prev => ({
        ...prev,
        [type]: prev[type].filter(msg => msg._id !== messageId)
      }));
    } catch (err) {
      console.error('Error deleting message:', err);
      setError('Failed to delete message');
    }
  };
  
  // Abrir modal de respuesta
  const openReplyModal = (message) => {
    setReplyTo(message);
    setReplyModal(true);
    // Marcar como leído si aún no lo está
    if (!message.isRead) {
      markAsRead(message._id);
    }
  };
  
  // Enviar respuesta
  const sendReply = async () => {
    if (!replyMessage.trim()) {
      setError('Message cannot be empty');
      return;
    }
    
    setError(''); // Limpiar errores previos
    
    // Mostrar mensaje de envío en progreso
    setSuccessMessage('Sending message...');
    
    // Crear un ID temporal para visualización inmediata
    const tempId = `temp_${Date.now()}`;
    
    try {
      console.log('Sending reply to:', replyTo.senderId._id);
      console.log('About book:', replyTo.bookId._id);
      
      // Enviar mensaje al servidor
      const response = await axios.post(
        `${ENV.SERVER_URL}/messages`,
        {
          receiverId: replyTo.senderId._id,
          bookId: replyTo.bookId._id,
          content: replyMessage
        },
        {
          headers: {
            'userid': user._id,
          },
        }
      );
      
      console.log('Server response:', response.data);
      
      if (response.data && response.data.message) {
        // Cerrar modal y mostrar éxito
        setReplyModal(false);
        setReplyMessage('');
        setSuccessMessage('Reply sent successfully!');
        
        // Refrescar todos los mensajes para asegurar datos consistentes
        const refreshResponse = await axios.get(
          `${ENV.SERVER_URL}/messages`,
          {
            headers: {
              'userid': user._id,
            },
          }
        );
        
        // Actualizar con datos frescos del servidor
        setMessages({
          sent: refreshResponse.data.sent,
          received: refreshResponse.data.received
        });
        
        // Ocultar mensaje de éxito después de un tiempo
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      
      // Mostrar mensaje de error más detallado
      if (err.response?.data?.error) {
        setError(`Failed to send: ${err.response.data.error}`);
      } else if (err.message) {
        setError(`Error: ${err.message}`);
      } else {
        setError('Error: Could not connect to server');
      }
      
      // Mantener modal abierto para reintentar
      setSuccessMessage('');
    }
  };
  
  // Formatear fecha
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner color="primary" />
        <p>Loading messages...</p>
      </Container>
    );
  }
  
  return (
    <Container className="my-4">
      <h2 className="mb-4">My Messages</h2>
      
      {error && <Alert color="danger">{error}</Alert>}
      {successMessage && <Alert color="success">{successMessage}</Alert>}
      
      <Nav tabs>
        <NavItem>
          <NavLink
            className={classnames({ active: activeTab === 'received' })}
            onClick={() => setActiveTab('received')}
            style={{ cursor: 'pointer' }}
          >
            Received 
            {messages.received.filter(msg => !msg.isRead).length > 0 && (
              <Badge color="danger" pill className="ms-2">
                {messages.received.filter(msg => !msg.isRead).length}
              </Badge>
            )}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className={classnames({ active: activeTab === 'sent' })}
            onClick={() => setActiveTab('sent')}
            style={{ cursor: 'pointer' }}
          >
            Sent
          </NavLink>
        </NavItem>
      </Nav>
      
      <TabContent activeTab={activeTab} className="mt-3">
        <TabPane tabId="received">
          {messages.received.length === 0 ? (
            <p className="text-center my-4">No messages received yet.</p>
          ) : (
            messages.received.map(message => (
              <Card 
                key={message._id} 
                className={`mb-3 ${!message.isRead ? 'border-primary' : ''}`}
              >
                <CardBody>
                  <Row>
                    <Col>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <strong>From: {message.senderId.name}</strong>
                          <span className="text-muted ms-2">({message.senderId.email})</span>
                        </div>
                        
                        {!message.isRead && (
                          <Badge color="primary" pill>New</Badge>
                        )}
                      </div>
                      
                      <div className="mb-2">
                        <span className="text-muted">Book: </span>
                        <Link to={`/books/${message.bookId._id}`}>
                          {message.bookId.title}
                        </Link>
                      </div>
                      
                      <div className="message-content p-3 bg-light rounded">
                        {message.content}
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <div className="text-muted small">
                          {formatDate(message.createdAt)}
                        </div>
                        
                        <div>
                          <Button 
                            color="success" 
                            size="sm" 
                            className="me-2"
                            onClick={() => openReplyModal(message)}
                          >
                            <i className="fas fa-reply me-1"></i> Reply
                          </Button>
                            
                          {!message.isRead && (
                            <Button 
                              color="primary" 
                              size="sm" 
                              className="me-2"
                              onClick={() => markAsRead(message._id)}
                            >
                              Mark as Read
                            </Button>
                          )}
                          <Button 
                            color="danger" 
                            size="sm"
                            onClick={() => deleteMessage(message._id, 'received')}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            ))
          )}
        </TabPane>
        
        <TabPane tabId="sent">
          {messages.sent.length === 0 ? (
            <p className="text-center my-4">No messages sent yet.</p>
          ) : (
            messages.sent.map(message => (
              <Card key={message._id} className="mb-3">
                <CardBody>
                  <Row>
                    <Col>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <strong>To: {message.receiverId.name}</strong>
                          <span className="text-muted ms-2">({message.receiverId.email})</span>
                        </div>
                        
                        {message.isRead && (
                          <Badge color="success" pill>Read</Badge>
                        )}
                      </div>
                      
                      <div className="mb-2">
                        <span className="text-muted">Book: </span>
                        <Link to={`/books/${message.bookId._id}`}>
                          {message.bookId.title}
                        </Link>
                      </div>
                      
                      <div className="message-content p-3 bg-light rounded">
                        {message.content}
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center mt-2">
                        <div className="text-muted small">
                          {formatDate(message.createdAt)}
                        </div>
                        
                        <Button 
                          color="danger" 
                          size="sm"
                          onClick={() => deleteMessage(message._id, 'sent')}
                        >
                          Delete
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </CardBody>
              </Card>
            ))
          )}
        </TabPane>
      </TabContent>
      
      {/* Modal de respuesta */}
      <Modal isOpen={replyModal} toggle={() => setReplyModal(!replyModal)}>
        <ModalHeader toggle={() => setReplyModal(!replyModal)}>
          Reply to {replyTo?.senderId.name}
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label>Original Message:</Label>
              <div className="original-message p-3 mb-3 bg-light rounded">
                {replyTo?.content}
              </div>
              
              <Label for="replyMessage">Your Reply:</Label>
              <Input 
                type="textarea" 
                id="replyMessage"
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={4}
                placeholder="Type your reply here..."
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setReplyModal(false)}>
            Cancel
          </Button>
          <Button 
            color="primary" 
            onClick={sendReply}
          >
            Send Reply
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default Messages; 