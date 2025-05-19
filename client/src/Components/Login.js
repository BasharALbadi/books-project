import React, { useState, useEffect } from "react";
import {
  Col,
  Container,
  Form,
  Row,
  FormGroup,
  Label,
  Input,
  Button,
  Card,
  CardBody,
  Alert,
  InputGroup,
  InputGroupText,
  Spinner
} from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../Features/UserSlice";

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const { email, password } = formData;

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Retrieve the current value of the state from the store
  const { user, isSuccess, isError, isLoading, message } = useSelector((state) => state.users);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const userData = { email, password };
    dispatch(login(userData));
  };
  
  const toggleShowPassword = () => setShowPassword(!showPassword);

  useEffect(() => {
    if (isSuccess && user) {
      navigate("/");
    }
  }, [user, isSuccess, navigate]);

  return (
    <div className="auth-page py-5" style={{ marginTop: '76px' }}>
      <Container>
        <Row className="justify-content-center">
          <Col lg={5} md={8} sm={12}>
            <div className="auth-container">
              <div className="auth-header">
                <h2>Welcome Back</h2>
                <p>Sign in to access your BookMarket account</p>
              </div>
              
              {isError && (
                <Alert color="danger" className="mb-4">
                  {message || 'Invalid email or password. Please try again.'}
                </Alert>
              )}
              
              <Form onSubmit={handleLogin}>
                <FormGroup className="mb-4">
                  <Label for="email" className="form-label">Email Address</Label>
                  <InputGroup>
                    <InputGroupText className="bg-transparent">
                      <i className="fas fa-envelope"></i>
                    </InputGroupText>
                    <Input
                      id="email"
                      name="email"
                      placeholder="Enter your email"
                      type="email"
                      value={email}
                      onChange={handleChange}
                      className="ps-2"
                      required
                    />
                  </InputGroup>
                </FormGroup>

                <FormGroup className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <Label for="password" className="form-label">Password</Label>
                    <Link to="/forgot-password" className="small">Forgot Password?</Link>
                  </div>
                  <InputGroup>
                    <InputGroupText className="bg-transparent">
                      <i className="fas fa-lock"></i>
                    </InputGroupText>
                    <Input
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handleChange}
                      className="ps-2"
                      required
                    />
                    <InputGroupText 
                      className="bg-transparent cursor-pointer"
                      onClick={toggleShowPassword}
                      style={{ cursor: 'pointer' }}
                    >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </InputGroupText>
                  </InputGroup>
                </FormGroup>

                <Button
                  color="primary"
                  className="w-100 mb-4"
                  type="submit"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Spinner size="sm" className="me-2" /> Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
                
                <div className="text-center">
                  <p className="mb-0">
                    Don't have an account? <Link to="/register" className="fw-bold">Sign Up</Link>
                  </p>
                </div>
              </Form>
              
              <div className="mt-4 position-relative">
                <hr />
                <div 
                  className="position-absolute text-center" 
                  style={{ 
                    top: '-12px',
                    left: '0',
                    right: '0',
                    margin: '0 auto'
                  }}
                >
                  <span className="bg-white px-3 text-muted small">OR CONTINUE WITH</span>
                </div>
              </div>
              
              <div className="d-flex justify-content-center mt-4 gap-3">
                <Button outline className="flex-grow-0 social-btn">
                  <i className="fab fa-google"></i>
                </Button>
                <Button outline className="flex-grow-0 social-btn">
                  <i className="fab fa-facebook-f"></i>
                </Button>
                <Button outline className="flex-grow-0 social-btn">
                  <i className="fab fa-twitter"></i>
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;
