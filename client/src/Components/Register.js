import React, { useState, useEffect } from "react";
import { 
  Container, 
  Row, 
  Col, 
  Button, 
  FormGroup, 
  Label, 
  Input,
  Form,
  InputGroup,
  InputGroupText,
  Alert,
  Spinner,
  Card,
  CardBody
} from "reactstrap";

import { userSchemaValidation } from "../Validations/UserValidations";

import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { useSelector, useDispatch } from "react-redux";
import { registerUser, reset } from "../Features/UserSlice";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState("buyer");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, isError, isSuccess, message } = useSelector((state) => state.users);

  // Set up form with react-hook-form
  const { 
    control, 
    handleSubmit, 
    formState: { errors }
  } = useForm({
    resolver: yupResolver(userSchemaValidation),
    mode: "onSubmit", // Only validate on submit
    reValidateMode: "onBlur", // Re-validate when fields are blurred
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "buyer"
    }
  });

  // Handle successful registration
  useEffect(() => {
    if (isSuccess) {
      setShowSuccessMessage(true);
      
      // Wait 2 seconds before redirecting to login
      const timer = setTimeout(() => {
        dispatch(reset()); // Reset the state
        navigate("/login");
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate, dispatch]);

  const onSubmit = (data) => {
    try {
      const userData = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: role,
      };

      dispatch(registerUser(userData));
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <div className="auth-page py-5" style={{ marginTop: '76px' }}>
      <Container>
        <Row className="justify-content-center">
          <Col lg={10} md={12}>
            <Card className="shadow border-0 overflow-hidden">
              <Row className="g-0">
                <Col lg={6} className="d-none d-lg-block bg-primary text-white">
                  <div className="p-5 d-flex flex-column h-100 justify-content-center">
                    <div className="feature-info">
                      <h2 className="display-6 fw-bold mb-4">Welcome to BookMarket</h2>
                      <p className="lead mb-4">Your one-stop destination for books!</p>
                      <div className="mb-4">
                        <div className="d-flex align-items-center mb-3">
                          <div className="feature-icon me-3 bg-white text-primary rounded-circle p-2">
                            <i className="fas fa-book"></i>
                          </div>
                          <span>Access thousands of eBooks in PDF format</span>
                        </div>
                        <div className="d-flex align-items-center mb-3">
                          <div className="feature-icon me-3 bg-white text-primary rounded-circle p-2">
                            <i className="fas fa-exchange-alt"></i>
                          </div>
                          <span>Buy, sell, or exchange with other readers</span>
                        </div>
                        <div className="d-flex align-items-center mb-3">
                          <div className="feature-icon me-3 bg-white text-primary rounded-circle p-2">
                            <i className="fas fa-lock"></i>
                          </div>
                          <span>Secure payment processing</span>
                        </div>
                        <div className="d-flex align-items-center">
                          <div className="feature-icon me-3 bg-white text-primary rounded-circle p-2">
                            <i className="fas fa-user-shield"></i>
                          </div>
                          <span>Protected user information</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-auto text-center">
                      <p>Already have an account?</p>
                      <Button color="light" tag={Link} to="/login">
                        Sign In
                      </Button>
                    </div>
                  </div>
                </Col>
                
                <Col lg={6}>
                  <CardBody className="p-lg-5 p-4">
                    <div className="text-center mb-4">
                      <h2 className="fw-bold">Create Your Account</h2>
                      <p className="text-muted">
                        Join BookMarket today and discover your next favorite book
                      </p>
                    </div>

                    {isError && (
                      <Alert color="danger" className="mb-4">
                        {message || "Registration failed. Please try again."}
                      </Alert>
                    )}
                    
                    {showSuccessMessage && (
                      <Alert color="success" className="mb-4">
                        <i className="fas fa-check-circle me-2"></i>
                        Registration successful! Redirecting to login...
                      </Alert>
                    )}

                    <Form onSubmit={handleSubmit(onSubmit)} noValidate>
                      <FormGroup className="mb-3">
                        <Label for="name" className="form-label">Full Name</Label>
                        <Controller
                          name="name"
                          control={control}
                          render={({ field }) => (
                            <InputGroup>
                              <InputGroupText className="bg-transparent">
                                <i className="fas fa-user"></i>
                              </InputGroupText>
                              <Input
                                {...field}
                                id="name"
                                type="text"
                                placeholder="Enter your name"
                                invalid={!!errors.name}
                              />
                            </InputGroup>
                          )}
                        />
                        {errors.name && (
                          <div className="text-danger mt-1 small">
                            {errors.name.message}
                          </div>
                        )}
                      </FormGroup>

                      <FormGroup className="mb-3">
                        <Label for="email" className="form-label">Email Address</Label>
                        <Controller
                          name="email"
                          control={control}
                          render={({ field }) => (
                            <InputGroup>
                              <InputGroupText className="bg-transparent">
                                <i className="fas fa-envelope"></i>
                              </InputGroupText>
                              <Input
                                {...field}
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                invalid={!!errors.email}
                              />
                            </InputGroup>
                          )}
                        />
                        {errors.email && (
                          <div className="text-danger mt-1 small">
                            {errors.email.message}
                          </div>
                        )}
                      </FormGroup>

                      <FormGroup className="mb-3">
                        <Label for="password" className="form-label">Password</Label>
                        <Controller
                          name="password"
                          control={control}
                          render={({ field }) => (
                            <InputGroup>
                              <InputGroupText className="bg-transparent">
                                <i className="fas fa-lock"></i>
                              </InputGroupText>
                              <Input
                                {...field}
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                invalid={!!errors.password}
                              />
                              <InputGroupText 
                                className="bg-transparent cursor-pointer"
                                onClick={toggleShowPassword}
                                style={{ cursor: 'pointer' }}
                              >
                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                              </InputGroupText>
                            </InputGroup>
                          )}
                        />
                        {errors.password && (
                          <div className="text-danger mt-1 small">
                            {errors.password.message}
                          </div>
                        )}
                      </FormGroup>

                      <FormGroup className="mb-3">
                        <Label for="confirmPassword" className="form-label">Confirm Password</Label>
                        <Controller
                          name="confirmPassword"
                          control={control}
                          render={({ field }) => (
                            <InputGroup>
                              <InputGroupText className="bg-transparent">
                                <i className="fas fa-lock"></i>
                              </InputGroupText>
                              <Input
                                {...field}
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm your password"
                                invalid={!!errors.confirmPassword}
                              />
                              <InputGroupText 
                                className="bg-transparent cursor-pointer"
                                onClick={toggleShowConfirmPassword}
                                style={{ cursor: 'pointer' }}
                              >
                                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                              </InputGroupText>
                            </InputGroup>
                          )}
                        />
                        {errors.confirmPassword && (
                          <div className="text-danger mt-1 small">
                            {errors.confirmPassword.message}
                          </div>
                        )}
                      </FormGroup>

                      <FormGroup className="mb-4">
                        <Label for="role" className="form-label">Account Type</Label>
                        <InputGroup>
                          <InputGroupText className="bg-transparent">
                            <i className="fas fa-user-tag"></i>
                          </InputGroupText>
                          <Input
                            type="select"
                            name="role"
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                          >
                            <option value="buyer">Buyer</option>
                            <option value="seller">Seller</option>
                          </Input>
                        </InputGroup>
                        <div className="text-muted mt-1 small">
                          {role === "buyer" 
                            ? "As a buyer, you can browse, purchase, or request to exchange books."
                            : "As a seller, you can upload books for sale or exchange, and manage your listings."}
                        </div>
                      </FormGroup>

                      <Button 
                        color="primary" 
                        type="submit" 
                        className="w-100 py-2" 
                        disabled={isLoading || showSuccessMessage}
                      >
                        {isLoading ? (
                          <>
                            <Spinner size="sm" className="me-2" /> Creating Account...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </Button>
                      
                      <div className="mt-4 text-center d-block d-lg-none">
                        <p className="mb-0 text-muted">
                          Already have an account? <Link to="/login" className="fw-bold">Sign In</Link>
                        </p>
                      </div>
                    </Form>
                  </CardBody>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Register;
