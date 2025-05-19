import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Input, Button, Form, FormGroup, InputGroup } from 'reactstrap';
import { useSelector } from 'react-redux';

const Footer = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.users);

  const handleSubscribe = (e) => {
    e.preventDefault();
    // Subscribe logic would go here
    setEmail('');
  };

  // Simplified footer for non-authenticated users
  if (!user) {
    return (
      <footer className="modern-footer">
        <Container>
          <Row className="py-5">
            <Col lg={6} md={6} className="mb-4 mb-lg-0">
              <div className="footer-about">
                <h5 className="brand-name mb-4">BookMarket</h5>
                <p className="mb-4">
                  Your premier destination for buying, selling, and exchanging books. Connect with fellow readers and discover your next favorite read.
                </p>
              </div>
            </Col>
            
            <Col lg={6} md={6} className="text-lg-end text-center">
              <div className="auth-buttons">
                <Button 
                  color="primary" 
                  className="px-4 py-2 me-3 mb-3 mb-md-0"
                  onClick={() => navigate('/login')}
                >
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Login
                </Button>
                <Button 
                  outline 
                  color="light" 
                  className="px-4 py-2"
                  onClick={() => navigate('/register')}
                >
                  <i className="fas fa-user-plus me-2"></i>
                  Register
                </Button>
              </div>
            </Col>
          </Row>
          
          <hr className="footer-divider" />
          
          <Row className="footer-bottom py-4">
            <Col md={12} className="text-center">
              <p className="copyright mb-0">© {new Date().getFullYear()} BookMarket. All Rights Reserved.</p>
            </Col>
          </Row>
        </Container>
      </footer>
    );
  }

  // Full footer for authenticated users
  return (
    <footer className="modern-footer">
      <Container>
        {/* Main Footer Content */}
        <Row className="py-5">
          <Col lg={4} md={6} className="mb-4 mb-lg-0">
            <div className="footer-about">
              <h5 className="brand-name mb-4">BookMarket</h5>
              <p className="mb-4">
                Your premier destination for buying, selling, and exchanging books. Connect with fellow readers and discover your next favorite read.
              </p>
              <div className="social-links">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" aria-label="Pinterest">
                  <i className="fab fa-pinterest-p"></i>
                </a>
              </div>
            </div>
          </Col>
          
          <Col lg={2} md={3} sm={6} xs={6} className="mb-4 mb-lg-0">
            <div className="footer-links">
              <h5 className="mb-4">Explore</h5>
              <ul className="list-unstyled">
                <li><Link to="/books">Browse Books</Link></li>
                <li><Link to="/categories">Categories</Link></li>
                <li><Link to="/authors">Authors</Link></li>
                <li><Link to="/new-releases">New Releases</Link></li>
                <li><Link to="/bestsellers">Bestsellers</Link></li>
              </ul>
            </div>
          </Col>
          
          <Col lg={2} md={3} sm={6} xs={6} className="mb-4 mb-lg-0">
            <div className="footer-links">
              <h5 className="mb-4">Company</h5>
              <ul className="list-unstyled">
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                <li><Link to="/blog">Blog</Link></li>
                <li><Link to="/careers">Careers</Link></li>
                <li><Link to="/press">Press</Link></li>
              </ul>
            </div>
          </Col>
          
          <Col lg={4} md={12}>
            <div className="footer-newsletter">
              <h5 className="mb-4">Stay Updated</h5>
              <p className="mb-3">
                Subscribe to our newsletter for the latest books and exclusive offers.
              </p>
              <Form onSubmit={handleSubscribe}>
                <InputGroup>
                  <Input 
                    type="email"
                    placeholder="Your email address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="footer-input"
                  />
                  <Button type="submit" className="footer-btn">
                    <i className="fas fa-paper-plane"></i>
                  </Button>
                </InputGroup>
              </Form>
            </div>
          </Col>
        </Row>
        
        <hr className="footer-divider" />
        
        {/* Footer Bottom */}
        <Row className="footer-bottom py-4">
          <Col md={6} className="text-center text-md-start mb-2 mb-md-0">
            <p className="copyright mb-0">© {new Date().getFullYear()} BookMarket. All Rights Reserved.</p>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <div className="footer-legal">
              <Link to="/privacy" className="me-3">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
