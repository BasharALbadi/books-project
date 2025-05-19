import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Spinner } from 'reactstrap';

const PrivateRoute = ({ allowedRoles = [] }) => {
  const { user, isLoading, isSuccess } = useSelector((state) => state.users);
  const location = useLocation();

  // Show loading spinner while authentication is being checked
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinner color="primary" />
      </div>
    );
  }

  // Check if user is authenticated
  if (!isSuccess || !user) {
    // Redirect to login page, but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If no specific roles are required or user's role is in the allowed roles
  if (allowedRoles.length === 0 || allowedRoles.includes(user.role)) {
    return <Outlet />;
  }

  // User is authenticated but doesn't have the required role
  // Redirect to home page with access denied message
  return <Navigate to="/" state={{ accessDenied: true }} replace />;
};

export default PrivateRoute; 