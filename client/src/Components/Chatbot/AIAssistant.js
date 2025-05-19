import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, CardBody, Input, Button, Spinner, Alert } from 'reactstrap';
import axios from 'axios';
import { useSelector } from 'react-redux';
import * as ENV from '../../config';
import './AIAssistant.css';

const GROQ_API_KEY = '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';

const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debug, setDebug] = useState('');
  const { user } = useSelector((state) => state.users);
  
  const messagesEndRef = useRef(null);
  const chatBodyRef = useRef(null);
  
  // Improved scroll to bottom to prevent layout shifts
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Use a slight delay to ensure DOM is updated
      setTimeout(() => {
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'end'
        });
      }, 100);
    }
  };
  
  // Scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Store the previous scroll height to prevent jumps
  const preserveScroll = () => {
    if (chatBodyRef.current) {
      const scrollTop = chatBodyRef.current.scrollTop;
      const scrollHeight = chatBodyRef.current.scrollHeight;
      
      return () => {
        if (chatBodyRef.current) {
          requestAnimationFrame(() => {
            const newScrollHeight = chatBodyRef.current.scrollHeight;
            chatBodyRef.current.scrollTop = scrollTop + (newScrollHeight - scrollHeight);
          });
        }
      };
    }
    return () => {};
  };
  
  // Test server connection on component mount
  useEffect(() => {
    // Ping the server to check connectivity
    const testConnection = async () => {
      try {
        const response = await axios.get(`${ENV.SERVER_URL}/api-test`);
        console.log('Server connection test:', response.data);
        setDebug(`Server connected at: ${ENV.SERVER_URL}`);
      } catch (err) {
        console.error('Server connection test failed:', err);
        setDebug(`Failed to connect to server at: ${ENV.SERVER_URL}`);
      }
    };
    
    testConnection();
  }, []);
  
  // Add initial greeting from the assistant when component mounts
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: 'Hello! I am the AI assistant for the bookstore. How can I help you today? You can ask me about books, authors, or any other inquiries.'
      }
    ]);
  }, []);

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    // Create a restore function to preserve scroll position
    const restoreScroll = preserveScroll();
    
    // Add user message to chat
    const userMessage = { role: 'user', content: currentMessage };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Clear input and show loading state
    setCurrentMessage('');
    setIsLoading(true);
    setError('');
    setDebug('Sending message...');
    
    // Restore the scroll position after state update
    restoreScroll();
    
    try {
      // Prepare context and chat history for the API
      const chatHistory = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add system prompt
      const systemPrompt = {
        role: 'system',
        content: `You are an AI assistant for a book store called BookMarket. 
        You help customers find books, provide recommendations, and answer questions 
        about authors and literature. Be friendly and helpful. Respond in English only.
        The user's name is ${user?.name || 'Guest'}.`
      };
      
      const requestData = {
        messages: [systemPrompt, ...chatHistory],
        model: 'gemma2-9b-it',
        temperature: 0.7,
        max_tokens: 1024
      };
      
      setDebug(`Sending request to: ${ENV.SERVER_URL}/api/chat`);
      console.log('Request payload:', requestData);
      
      // Make API request to the backend proxy with absolute URL
      const response = await axios.post(`${ENV.SERVER_URL}/api/chat`, requestData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Response received:', response.data);
      setDebug('Response received successfully');
      
      // Add AI response to messages
      if (response.data && response.data.message) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: response.data.message
        }]);
      } else {
        setError('No valid message in response');
        console.error('Invalid response format:', response.data);
      }
    } catch (err) {
      console.error('Error with chat API:', err);
      
      // Detailed error reporting
      let errorMessage = 'Error connecting to AI assistant. Please try again.';
      
      if (err.response) {
        // Server responded with error
        console.error('Server error response:', err.response.data);
        setDebug(`Error ${err.response.status}: ${JSON.stringify(err.response.data)}`);
        errorMessage += ` (${err.response.status})`;
      } else if (err.request) {
        // Request made but no response
        console.error('No response received:', err.request);
        setDebug('No response received from server. Check server status.');
        errorMessage += ' (No response from server)';
      } else {
        // Something else went wrong
        console.error('Request error:', err.message);
        setDebug(`Request error: ${err.message}`);
        errorMessage += ` (${err.message})`;
      }
      
      setError(errorMessage);
      
      // Fallback to direct API call as a last resort
      try {
        setDebug('Attempting direct fallback to Groq API...');
        const directResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          messages: [
            { role: 'system', content: 'You are a helpful English-speaking assistant for a bookstore.' },
            { role: 'user', content: currentMessage }
          ],
          model: 'gemma2-9b-it',
          temperature: 0.7,
          max_tokens: 500
        }, {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (directResponse.data && directResponse.data.choices && directResponse.data.choices[0]) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: directResponse.data.choices[0].message.content
          }]);
          setError('');
          setDebug('Used direct fallback to Groq API');
        }
      } catch (fallbackErr) {
        console.error('Fallback API also failed:', fallbackErr);
        setDebug(`Fallback also failed: ${fallbackErr.message}`);
        // Error already set
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <Container className="chat-container my-4">
      <h2 className="text-center mb-4">AI Assistant</h2>
      
      {error && <Alert color="danger">{error}</Alert>}
      {debug && process.env.NODE_ENV !== 'production' && (
        <Alert color="warning" className="debug-info">
          <small><strong>Debug:</strong> {debug}</small>
        </Alert>
      )}
      
      <Card className="chat-card">
        <CardBody className="chat-messages" ref={chatBodyRef}>
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`message ${msg.role === 'user' ? 'user-message' : 'assistant-message'}`}
            >
              <div className="message-content">
                {msg.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant-message">
              <div className="message-content">
                <Spinner size="sm" color="primary" /> Typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="message-end-anchor" />
        </CardBody>
        
        <div className="chat-input-container">
          <div className="d-flex">
            <Input
              type="textarea"
              className="chat-input"
              placeholder="Type your message here..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              rows={2}
            />
            <Button 
              color="primary" 
              onClick={sendMessage} 
              disabled={isLoading || !currentMessage.trim()}
              className="ms-2 send-button"
            >
              {isLoading ? <Spinner size="sm" /> : <i className="fas fa-paper-plane"></i>}
            </Button>
          </div>
          <small className="text-muted mt-2 d-block">
            AI Assistant powered by Gemma AI from Groq
          </small>
        </div>
      </Card>
    </Container>
  );
};

export default AIAssistant; 