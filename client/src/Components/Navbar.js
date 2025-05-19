import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from '../Features/UserSlice';
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Button,
  Container,
  Badge
} from 'reactstrap';

const AppNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  
  const { user } = useSelector((state) => state.users);
  
  const toggle = () => setIsOpen(!isOpen);
  
  const onLogout = () => {
    try {
      // First remove from localStorage directly to ensure logout happens
      localStorage.removeItem('user');
      
      // Then dispatch actions
      dispatch(logout());
      dispatch(reset());
      
      // Navigate to login page and force page refresh
      setTimeout(() => {
        navigate('/login');
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback logout - force refresh
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };
  
  // Check for user on route change - safety check
  useEffect(() => {
    const userInStorage = localStorage.getItem('user');
    if (!userInStorage && user) {
      // If no user in storage but redux still has user, force reset
      dispatch(reset());
      if (location.pathname !== '/login' && location.pathname !== '/register') {
        navigate('/login');
      }
    }
  }, [location, user, dispatch, navigate]);
  
  return (
    <Navbar color="light" light expand="md" className="py-3" fixed="top">
      <Container>
        <NavbarBrand tag={Link} to="/" className="d-flex align-items-center">
          <i className="fas fa-book-open me-2"></i>
          <span>BookMarket</span>
          {user && user.role === 'seller' && (
            <Badge color="primary" className="ms-2">Seller Area</Badge>
          )}
        </NavbarBrand>
        <NavbarToggler onClick={toggle} />
        <Collapse isOpen={isOpen} navbar>
          <Nav className="ms-auto" navbar>
            {user ? (
              <>
                {/* Only show these links for buyers (non-sellers and non-admin) */}
                {user.role !== 'seller' && user.role !== 'admin' && (
                  <>
                    <NavItem>
                      <NavLink tag={Link} to="/books" className="d-flex align-items-center">
                        <i className="fas fa-search me-2"></i>
                        Browse Books
                      </NavLink>
                    </NavItem>
                    
                    <NavItem>
                      <NavLink tag={Link} to="/bookshelf" className="d-flex align-items-center">
                        <i className="fas fa-book me-2"></i>
                        BookShelf
                      </NavLink>
                    </NavItem>
                    
                    <NavItem>
                      <NavLink tag={Link} to="/my-purchases" className="d-flex align-items-center">
                        <i className="fas fa-book-reader me-2"></i>
                        My Books
                      </NavLink>
                    </NavItem>
                    
                    <NavItem>
                      <NavLink tag={Link} to="/messages" className="d-flex align-items-center position-relative">
                        <i className="fas fa-envelope me-2"></i>
                        Messages
                      </NavLink>
                    </NavItem>
                    
                    {/* Chatbot link for buyers */}
                    <NavItem>
                      <NavLink tag={Link} to="/assistant" className="d-flex align-items-center">
                        <i className="fas fa-robot me-2"></i>
                        AI Assistant
                      </NavLink>
                    </NavItem>
                  </>
                )}
                
                {/* Seller specific links */}
                {user.role === 'seller' && (
                  <>
                    <NavItem>
                      <NavLink tag={Link} to="/add-book" className="d-flex align-items-center">
                        <i className="fas fa-plus-circle me-2"></i>
                        Add Book
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink tag={Link} to="/my-books" className="d-flex align-items-center">
                        <i className="fas fa-list me-2"></i>
                        My Books
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink tag={Link} to="/customers" className="d-flex align-items-center">
                        <i className="fas fa-users me-2"></i>
                        Customers
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink tag={Link} to="/messages" className="d-flex align-items-center position-relative">
                        <i className="fas fa-envelope me-2"></i>
                        Messages
                      </NavLink>
                    </NavItem>
                    
                    {/* Chatbot link for sellers */}
                    <NavItem>
                      <NavLink tag={Link} to="/assistant" className="d-flex align-items-center">
                        <i className="fas fa-robot me-2"></i>
                        AI Assistant
                      </NavLink>
                    </NavItem>
                  </>
                )}
                
                {/* Admin specific links - ONLY these links will show for admins */}
                {user.role === 'admin' && (
                  <>
                    <NavItem>
                      <NavLink tag={Link} to="/admin" className="d-flex align-items-center">
                        <i className="fas fa-shield-alt me-2"></i>
                        Dashboard
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink tag={Link} to="/admin?tab=books" className="d-flex align-items-center">
                        <i className="fas fa-book me-2"></i>
                        All Books
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink tag={Link} to="/admin?tab=buyers" className="d-flex align-items-center">
                        <i className="fas fa-shopping-cart me-2"></i>
                        All Buyers
                      </NavLink>
                    </NavItem>
                    <NavItem>
                      <NavLink tag={Link} to="/admin?tab=sellers" className="d-flex align-items-center">
                        <i className="fas fa-store me-2"></i>
                        All Sellers
                      </NavLink>
                    </NavItem>
                  </>
                )}
                
                {/* User profile dropdown */}
                <UncontrolledDropdown nav inNavbar>
                  <DropdownToggle nav caret className="d-flex align-items-center">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt="Avatar" 
                        className="rounded-circle me-2"
                        style={{ width: '26px', height: '26px', objectFit: 'cover' }}
                      />
                    ) : (
                      <i className="fas fa-user-circle me-2"></i>
                    )}
                    {user.name || user.email}
                  </DropdownToggle>
                  <DropdownMenu end>
                    <DropdownItem tag={Link} to="/profile">
                      <i className="fas fa-user me-2"></i>
                      Profile
                    </DropdownItem>
                    <DropdownItem tag={Link} to="/settings">
                      <i className="fas fa-cog me-2"></i>
                      Settings
                    </DropdownItem>
                    <DropdownItem divider />
                    <DropdownItem onClick={onLogout}>
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Logout
                    </DropdownItem>
                  </DropdownMenu>
                </UncontrolledDropdown>
              </>
            ) : (
              <>
                {/* For non-authenticated users - only show login/register */}
                <NavItem>
                  <NavLink tag={Link} to="/login" className="d-flex align-items-center">
                    <i className="fas fa-sign-in-alt me-2"></i>
                    Login
                  </NavLink>
                </NavItem>
                <NavItem>
                  <Button 
                    color="primary" 
                    className="ms-2 rounded-pill px-4"
                    onClick={() => navigate('/register')}
                  >
                    <i className="fas fa-user-plus me-2"></i>
                    Register
                  </Button>
                </NavItem>
              </>
            )}
          </Nav>
        </Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar; 