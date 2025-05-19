import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  CardHeader,
  CardBody,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Alert,
  Spinner
} from 'reactstrap';
import { updateProfile, reset } from '../Features/UserSlice';

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user, isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.users
  );
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    location: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [activeTab, setActiveTab] = useState('info'); // 'info' or 'password'
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  
  // Get user's geolocation
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }
    
    setLocationLoading(true);
    setLocationError('');
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocoding to get address from coordinates
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          
          if (!response.ok) {
            throw new Error('Failed to get location information');
          }
          
          const data = await response.json();
          const locationString = data.display_name || `${latitude}, ${longitude}`;
          
          setFormData((prevState) => ({
            ...prevState,
            location: locationString
          }));
          
          setLocationLoading(false);
        } catch (error) {
          console.error('Error getting location:', error);
          setLocationError('Failed to get location. Please try again.');
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError(`Error getting location: ${error.message}`);
        setLocationLoading(false);
      }
    );
  };
  
  useEffect(() => {
    if (user) {
      setFormData({
        ...formData,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        location: user.location || ''
      });
    }
    
    if (isSuccess && message === 'Profile updated') {
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
        dispatch(reset());
      }, 3000);
    }
  }, [user, isSuccess, message]);
  
  // Auto-detect location on component mount if not already set
  useEffect(() => {
    if (user && !user.location) {
      getUserLocation();
    }
  }, [user]);
  
  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value
    }));
  };
  
  const onInfoSubmit = (e) => {
    e.preventDefault();
    const userData = {
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      location: formData.location
    };
    
    dispatch(updateProfile(userData));
  };
  
  const onPasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');
    
    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    const userData = {
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    };
    
    dispatch(updateProfile(userData));
  };
  
  // Render user role badge with appropriate color
  const renderRoleBadge = () => {
    let color = 'secondary';
    if (user.role === 'admin') color = 'danger';
    if (user.role === 'seller') color = 'success';
    if (user.role === 'buyer') color = 'info';
    
    return (
      <span className={`badge bg-${color} text-white ms-2`}>
        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
      </span>
    );
  };
  
  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md="8">
          <Card className="shadow">
            <CardHeader className="bg-primary text-white">
              <h3 className="mb-0">
                My Profile {user && renderRoleBadge()}
              </h3>
            </CardHeader>
            <CardBody>
              {/* Success and Error Messages */}
              {updateSuccess && (
                <Alert color="success" className="mb-4">
                  Profile updated successfully!
                </Alert>
              )}
              
              {isError && (
                <Alert color="danger" className="mb-4">
                  {message}
                </Alert>
              )}
              
              {/* Tab Navigation */}
              <div className="nav nav-tabs mb-4">
                <div 
                  className={`nav-link ${activeTab === 'info' ? 'active' : ''}`}
                  onClick={() => setActiveTab('info')}
                  style={{ cursor: 'pointer' }}
                >
                  Profile Information
                </div>
                <div 
                  className={`nav-link ${activeTab === 'password' ? 'active' : ''}`}
                  onClick={() => setActiveTab('password')}
                  style={{ cursor: 'pointer' }}
                >
                  Change Password
                </div>
              </div>
              
              {/* Profile Information Form */}
              {activeTab === 'info' && (
                <Form onSubmit={onInfoSubmit}>
                  <FormGroup>
                    <Label for="email">Email (Read Only)</Label>
                    <Input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      readOnly
                      disabled
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label for="name">Full Name</Label>
                    <Input
                      type="text"
                      name="name"
                      id="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={onChange}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label for="phone">Phone Number</Label>
                    <Input
                      type="text"
                      name="phone"
                      id="phone"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={onChange}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label for="address">Shipping Address</Label>
                    <Input
                      type="textarea"
                      name="address"
                      id="address"
                      placeholder="Enter your shipping address"
                      value={formData.address}
                      onChange={onChange}
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label for="location">Geographic Location</Label>
                    <div className="d-flex">
                      <Input
                        type="text"
                        name="location"
                        id="location"
                        placeholder="Your geographic location"
                        value={formData.location}
                        onChange={onChange}
                        className="me-2"
                      />
                      <Button 
                        type="button" 
                        color="secondary" 
                        onClick={getUserLocation}
                        disabled={locationLoading}
                      >
                        {locationLoading ? (
                          <Spinner size="sm" />
                        ) : (
                          <i className="fas fa-map-marker-alt"></i>
                        )}
                      </Button>
                    </div>
                    <small className="text-muted">
                      Click the location icon to automatically detect your location
                    </small>
                    {locationError && (
                      <div className="text-danger mt-1">
                        <small>{locationError}</small>
                      </div>
                    )}
                  </FormGroup>
                  
                  <Button color="primary" block disabled={isLoading}>
                    {isLoading ? <Spinner size="sm" /> : 'Update Profile'}
                  </Button>
                </Form>
              )}
              
              {/* Change Password Form */}
              {activeTab === 'password' && (
                <Form onSubmit={onPasswordSubmit}>
                  {passwordError && (
                    <Alert color="danger" className="mb-4">
                      {passwordError}
                    </Alert>
                  )}
                  
                  <FormGroup>
                    <Label for="currentPassword">Current Password</Label>
                    <Input
                      type="password"
                      name="currentPassword"
                      id="currentPassword"
                      placeholder="Enter your current password"
                      value={formData.currentPassword}
                      onChange={onChange}
                      required
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label for="newPassword">New Password</Label>
                    <Input
                      type="password"
                      name="newPassword"
                      id="newPassword"
                      placeholder="Enter new password"
                      value={formData.newPassword}
                      onChange={onChange}
                      required
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label for="confirmPassword">Confirm New Password</Label>
                    <Input
                      type="password"
                      name="confirmPassword"
                      id="confirmPassword"
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={onChange}
                      required
                    />
                  </FormGroup>
                  
                  <Button color="primary" block disabled={isLoading}>
                    {isLoading ? <Spinner size="sm" /> : 'Change Password'}
                  </Button>
                </Form>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;
