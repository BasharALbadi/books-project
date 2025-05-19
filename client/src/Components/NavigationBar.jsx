import React, { useState } from "react";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logOut } from "../Features/UserSlice"; 
import { useNavigate } from "react-router-dom";
import { FaBook, FaSearch, FaShoppingBag, FaUserCircle, FaSignInAlt, FaSignOutAlt, FaUserPlus, FaStore, FaPlusCircle, FaExchangeAlt, FaListAlt, FaUsers, FaEnvelope } from 'react-icons/fa';
import { Badge } from "react-bootstrap";

function NavigationBar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    dispatch(logOut());
    localStorage.removeItem('user');
    window.location.reload();
  };

  const collapseNavbar = () => {
    setExpanded(false);
  };
  
  // Check if user is a seller
  const isSeller = user?.user?.role === 'seller' || user?.user?.role === 'admin';
  
  // شريط التنقل للمشتري
  const buyerNavigation = (
    <>
      <Nav.Link as={Link} to="/books" onClick={collapseNavbar}>
        <FaSearch className="me-1" /> Browse Books
      </Nav.Link>
      <Nav.Link as={Link} to="/bookshelf" onClick={collapseNavbar}>
        <FaBook className="me-1" /> BookShelf
      </Nav.Link>
      <Nav.Link as={Link} to="/transactions" onClick={collapseNavbar}>
        <FaShoppingBag className="me-1" /> My Purchases
      </Nav.Link>
      <Nav.Link as={Link} to="/messages" onClick={collapseNavbar} className="position-relative">
        <FaEnvelope className="me-1" /> Messages
      </Nav.Link>
      <NavDropdown 
        title={<><FaUserCircle className="me-1" /> {user.user.firstName}</>} 
        id="user-dropdown"
        align="end"
      >
        <NavDropdown.Item as={Link} to="/profile" onClick={collapseNavbar}>
          My Profile
        </NavDropdown.Item>
        <NavDropdown.Item as={Link} to="/settings" onClick={collapseNavbar}>
          Settings
        </NavDropdown.Item>
        <NavDropdown.Divider />
        <NavDropdown.Item onClick={() => {
          handleLogout();
          collapseNavbar();
        }}>
          <FaSignOutAlt className="me-1" /> Logout
        </NavDropdown.Item>
      </NavDropdown>
    </>
  );
  
  // شريط التنقل للبائع
  const sellerNavigation = (
    <>
      <Nav.Link as={Link} to="/add-book" onClick={collapseNavbar}>
        <FaPlusCircle className="me-1" /> Add Book
      </Nav.Link>
      <Nav.Link as={Link} to="/my-books" onClick={collapseNavbar}>
        <FaListAlt className="me-1" /> My Books
      </Nav.Link>
      <Nav.Link as={Link} to="/customers" onClick={collapseNavbar}>
        <FaUsers className="me-1" /> Customers
      </Nav.Link>
      <Nav.Link as={Link} to="/transactions" onClick={collapseNavbar}>
        <FaShoppingBag className="me-1" /> Sales
      </Nav.Link>
      <Nav.Link as={Link} to="/exchange-requests" onClick={collapseNavbar} className="position-relative">
        <FaExchangeAlt className="me-1" /> Exchanges
        <Badge 
          bg="danger" 
          className="position-absolute"
          style={{ 
            top: '0', 
            right: '0', 
            transform: 'translate(30%, -30%)',
            fontSize: '0.6rem'
          }}
          pill
        >
          2
        </Badge>
      </Nav.Link>
      <Nav.Link as={Link} to="/messages" onClick={collapseNavbar} className="position-relative">
        <FaEnvelope className="me-1" /> Messages
      </Nav.Link>
      <NavDropdown 
        title={<><FaStore className="me-1" /> {user.user.firstName}</>} 
        id="seller-dropdown"
        align="end"
      >
        <NavDropdown.Item as={Link} to="/profile" onClick={collapseNavbar}>
          My Profile
        </NavDropdown.Item>
        <NavDropdown.Item as={Link} to="/store-settings" onClick={collapseNavbar}>
          Store Settings
        </NavDropdown.Item>
        <NavDropdown.Divider />
        <NavDropdown.Item onClick={() => {
          handleLogout();
          collapseNavbar();
        }}>
          <FaSignOutAlt className="me-1" /> Logout
        </NavDropdown.Item>
      </NavDropdown>
    </>
  );
  
  return (
    <Navbar 
      bg={isSeller ? "primary" : "light"} 
      variant={isSeller ? "dark" : "light"}
      expand="lg" 
      fixed="top" 
      expanded={expanded}
      onToggle={setExpanded}
      className="shadow-sm"
      style={{ zIndex: 1050 }}
    >
      <Container>
        <Navbar.Brand as={Link} to="/" onClick={collapseNavbar}>
          <FaBook className="me-2" />
          <span className="fw-bold">BookMarket</span>
          {isSeller && <Badge bg="light" text="primary" className="ms-2 fw-bold">Seller Mode</Badge>}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {user && user.user ? (
              isSeller ? sellerNavigation : buyerNavigation
            ) : (
              <>
                <Nav.Link as={Link} to="/login" onClick={collapseNavbar} className="btn btn-outline-primary me-2">
                  <FaSignInAlt className="me-1" /> Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register" onClick={collapseNavbar} className="btn btn-primary text-white">
                  <FaUserPlus className="me-1" /> Sign Up
                </Nav.Link>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavigationBar; 