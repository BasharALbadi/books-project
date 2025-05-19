import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getBooks } from '../../Features/BookSlice';
import * as ENV from '../../config';
import {
  Container,
  Row,
  Col,
  Card,
  CardImg,
  CardBody,
  CardTitle,
  CardSubtitle,
  CardText,
  Button,
  Badge,
  ButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Spinner
} from 'reactstrap';

const BookShelf = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { books, isLoading } = useSelector((state) => state.books);
  
  // Sort State
  const [sortBy, setSortBy] = useState('newest');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'shelf'
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 12;
  
  // Animation State
  const [fadeIn, setFadeIn] = useState(false);
  
  // Helper functions
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  
  // Fetch books on component mount
  useEffect(() => {
    dispatch(getBooks({ showAll: 'true' }));
    // Set fadeIn after a short delay to create animation effect
    setTimeout(() => {
      setFadeIn(true);
    }, 100);
  }, [dispatch]);
  
  // Sort books - make sure books exists before sorting
  const sortedBooks = books && books.length ? [...books].sort((a, b) => {
    switch (sortBy) {
      case 'title_asc':
        return a.title.localeCompare(b.title);
      case 'title_desc':
        return b.title.localeCompare(a.title);
      case 'price_low':
        return a.price - b.price;
      case 'price_high':
        return b.price - a.price;
      case 'newest':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      default:
        return 0;
    }
  }) : [];
  
  // Pagination logic
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = sortedBooks.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(sortedBooks.length / booksPerPage);
  
  // Change page
  const paginate = (pageNumber) => {
    setFadeIn(false);
    setTimeout(() => {
      setCurrentPage(pageNumber);
      setFadeIn(true);
    }, 300);
  };
  
  // View book details
  const viewBookDetails = (bookId) => {
    navigate(`/books/${bookId}`);
  };
  
  // Featured Books (first 3 books)
  const featuredBooks = sortedBooks.slice(0, 3);
  
  // CSS for animation effects
  const fadeStyle = {
    opacity: fadeIn ? 1 : 0,
    transition: 'opacity 0.5s ease-in-out',
  };
  
  return (
    <div className="bookshelf-page">
      {/* Hero Banner Section */}
      <div 
        className="hero-section text-white mb-5" 
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=1900&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          padding: '5rem 0',
          borderRadius: '0',
          marginTop: '-32px',
        }}
      >
        <Container className="text-center">
          <h1 className="display-3 fw-bold mb-3">Discover Your Next Book</h1>
          <p className="lead">Explore our collection of books from talented authors around the world.</p>
        </Container>
      </div>
      
      <Container>
        {/* Featured Books Section */}
        {featuredBooks.length > 0 && !isLoading && (
          <div className="featured-section mb-5">
            <h2 className="display-6 mb-4 fw-bold">
              <span style={{ borderBottom: '3px solid #0d6efd', paddingBottom: '0.5rem' }}>
                Featured Books
              </span>
            </h2>
            <Row>
              {featuredBooks.map((book, index) => (
                <Col key={book._id} md={4} className="mb-4">
                  <Card 
                    className="featured-card shadow h-100" 
                    onClick={() => viewBookDetails(book._id)}
                    style={{
                      cursor: 'pointer',
                      transform: fadeIn ? 'translateY(0)' : 'translateY(20px)',
                      opacity: fadeIn ? 1 : 0,
                      transition: `all 0.5s ease-in-out ${index * 0.1}s`,
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <div className="position-relative">
                      <CardImg
                        top
                        width="100%"
                        height="250px"
                        src={book.coverImage ? `${ENV.SERVER_URL}${book.coverImage}` : 'https://via.placeholder.com/300x400?text=No+Cover'}
                        alt={book.title}
                        style={{ objectFit: 'cover' }}
                      />
                      {book.isExchangeOnly && (
                        <div 
                          className="position-absolute" 
                          style={{ 
                            top: '10px', 
                            right: '10px',
                            background: '#17a2b8',
                            color: 'white',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontWeight: 'bold',
                            fontSize: '0.8rem'
                          }}
                        >
                          Exchange Only
                        </div>
                      )}
                    </div>
                    <CardBody>
                      <Badge 
                        color="secondary" 
                        pill
                        className="mb-2"
                      >
                        {book.category}
                      </Badge>
                      <CardTitle tag="h4" className="mb-1">{book.title}</CardTitle>
                      <CardSubtitle className="mb-3 text-muted">by {book.author}</CardSubtitle>
                      <div className="d-flex justify-content-between align-items-center">
                        {!book.isExchangeOnly && (
                          <h5 className="mb-0 fw-bold">${book.price}</h5>
                        )}
                        <Button 
                          color="primary" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewBookDetails(book._id);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="display-6 fw-bold mb-0">
            <span style={{ borderBottom: '3px solid #0d6efd', paddingBottom: '0.5rem' }}>
              All Books
            </span>
          </h2>
          <div className="d-flex align-items-center">
            <div className="view-toggle me-3">
              <Button 
                color={viewMode === 'grid' ? 'primary' : 'outline-primary'} 
                className="me-2"
                onClick={() => setViewMode('grid')}
                size="sm"
              >
                <i className="bi bi-grid-3x3-gap"></i>
              </Button>
              <Button 
                color={viewMode === 'shelf' ? 'primary' : 'outline-primary'}
                onClick={() => setViewMode('shelf')}
                size="sm"
              >
                <i className="bi bi-list"></i>
              </Button>
            </div>
            <ButtonDropdown isOpen={dropdownOpen} toggle={toggleDropdown}>
              <DropdownToggle caret color="light">
                Sort: {sortBy.replace('_', ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase())}
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem onClick={() => setSortBy('newest')}>Newest</DropdownItem>
                <DropdownItem onClick={() => setSortBy('oldest')}>Oldest</DropdownItem>
                <DropdownItem onClick={() => setSortBy('title_asc')}>Title (A-Z)</DropdownItem>
                <DropdownItem onClick={() => setSortBy('title_desc')}>Title (Z-A)</DropdownItem>
                <DropdownItem onClick={() => setSortBy('price_low')}>Price (Low to High)</DropdownItem>
                <DropdownItem onClick={() => setSortBy('price_high')}>Price (High to Low)</DropdownItem>
              </DropdownMenu>
            </ButtonDropdown>
          </div>
        </div>
        
        <div className="mb-3 text-muted">
          {sortedBooks.length === 0 ? 'No books found' : `${sortedBooks.length} book${sortedBooks.length !== 1 ? 's' : ''} found`}
        </div>
        
        <Row>
          {/* Main Content */}
          <Col md={12}>
            {/* Loading State */}
            {isLoading ? (
              <div className="text-center my-5 py-5">
                <div className="custom-spinner" style={{ 
                  width: '50px',
                  height: '50px',
                  margin: '0 auto',
                  borderRadius: '50%',
                  border: '3px solid rgba(0,0,0,0.1)',
                  borderTopColor: '#0d6efd',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <style>
                  {`
                    @keyframes spin {
                      to { transform: rotate(360deg); }
                    }
                  `}
                </style>
                <p className="mt-3 text-muted">Loading books...</p>
              </div>
            ) : (
              <div style={fadeStyle}>
                {/* Grid View */}
                {viewMode === 'grid' && (
                  <Row>
                    {currentBooks.length === 0 ? (
                      <Col className="text-center my-5">
                        <div className="empty-state p-5">
                          <i className="bi bi-book" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                          <h4 className="mt-3">No books found</h4>
                        </div>
                      </Col>
                    ) : (
                      currentBooks.map((book, index) => (
                        <Col key={book._id} sm={6} md={4} lg={3} className="mb-4">
                          <Card 
                            className="book-card h-100" 
                            style={{ 
                              cursor: 'pointer',
                              transform: fadeIn ? 'translateY(0)' : 'translateY(20px)',
                              opacity: fadeIn ? 1 : 0,
                              transition: `all 0.5s ease-in-out ${index * 0.05}s`,
                              borderRadius: '8px',
                              overflow: 'hidden',
                              boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
                              border: 'none',
                              height: '100%'
                            }}
                            onClick={() => viewBookDetails(book._id)}
                          >
                            <div 
                              className="book-cover-container position-relative"
                              style={{ height: '230px', overflow: 'hidden' }}
                            >
                              <CardImg
                                top
                                width="100%"
                                height="100%"
                                src={book.coverImage ? `${ENV.SERVER_URL}${book.coverImage}` : 'https://via.placeholder.com/150x220?text=No+Cover'}
                                alt={book.title}
                                style={{ 
                                  objectFit: 'cover',
                                  transition: 'transform 0.3s ease',
                                }}
                                className="book-cover-image"
                              />
                              <div className="overlay position-absolute" 
                                style={{ 
                                  top: 0, 
                                  left: 0, 
                                  right: 0, 
                                  bottom: 0, 
                                  background: 'linear-gradient(to bottom, rgba(0,0,0,0) 70%, rgba(0,0,0,0.8) 100%)',
                                  opacity: 0,
                                  transition: 'opacity 0.3s ease'
                                }} 
                              />
                              {book.isExchangeOnly && (
                                <div 
                                  className="position-absolute" 
                                  style={{ 
                                    top: '10px', 
                                    right: '10px',
                                    background: '#17a2b8',
                                    color: 'white',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    fontWeight: 'bold',
                                    fontSize: '0.8rem',
                                    zIndex: 2
                                  }}
                                >
                                  Exchange Only
                                </div>
                              )}
                            </div>
                            <CardBody className="d-flex flex-column" style={{ padding: '1.25rem' }}>
                              <div className="d-flex justify-content-between mb-2">
                                <Badge color="secondary" pill>{book.category}</Badge>
                              </div>
                              <CardTitle tag="h5" className="mb-1 book-title">
                                {book.title.length > 25 ? `${book.title.substring(0, 25)}...` : book.title}
                              </CardTitle>
                              
                              <CardSubtitle className="mb-2 text-muted">
                                by {book.author}
                              </CardSubtitle>
                              
                              <CardText className="small text-muted mb-2 flex-grow-1">
                                {book.description.length > 80 
                                  ? `${book.description.substring(0, 80)}...` 
                                  : book.description}
                              </CardText>
                              
                              <div className="d-flex justify-content-between align-items-center mt-auto pt-2" style={{ borderTop: '1px solid #eee' }}>
                                {book.isExchangeOnly ? (
                                  <span className="fw-bold">Exchange Only</span>
                                ) : (
                                  <span className="fw-bold price">${book.price}</span>
                                )}
                                <Button 
                                  color="primary" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    viewBookDetails(book._id);
                                  }}
                                >
                                  Details
                                </Button>
                              </div>
                            </CardBody>
                          </Card>
                        </Col>
                      ))
                    )}
                  </Row>
                )}
                
                {/* Shelf View */}
                {viewMode === 'shelf' && (
                  <div className="shelf-view">
                    {currentBooks.length === 0 ? (
                      <div className="text-center my-5">
                        <div className="empty-state p-5">
                          <i className="bi bi-book" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                          <h4 className="mt-3">No books found</h4>
                        </div>
                      </div>
                    ) : (
                      currentBooks.map((book, index) => (
                        <Card 
                          key={book._id} 
                          className="mb-3 shelf-item" 
                          style={{ 
                            cursor: 'pointer', 
                            borderRadius: '8px',
                            boxShadow: '0 3px 10px rgba(0,0,0,0.08)',
                            border: 'none',
                            transform: fadeIn ? 'translateY(0)' : 'translateY(20px)',
                            opacity: fadeIn ? 1 : 0,
                            transition: `all 0.5s ease-in-out ${index * 0.03}s`
                          }}
                          onClick={() => viewBookDetails(book._id)}
                        >
                          <Row className="g-0">
                            <Col xs={3} sm={2} style={{ maxWidth: '140px' }}>
                              <div 
                                style={{ 
                                  height: '100%', 
                                  overflow: 'hidden', 
                                  borderTopLeftRadius: '8px', 
                                  borderBottomLeftRadius: '8px' 
                                }}
                              >
                                <img
                                  src={book.coverImage ? `${ENV.SERVER_URL}${book.coverImage}` : 'https://via.placeholder.com/150x220?text=No+Cover'}
                                  alt={book.title}
                                  className="img-fluid"
                                  style={{ 
                                    height: '100%', 
                                    width: '100%', 
                                    objectFit: 'cover', 
                                    minHeight: '160px',
                                    transition: 'transform 0.3s ease' 
                                  }}
                                />
                              </div>
                            </Col>
                            <Col xs={9} sm={10}>
                              <CardBody style={{ padding: '1.5rem' }}>
                                <div className="d-flex justify-content-between">
                                  <div>
                                    <CardTitle tag="h4" className="mb-1">{book.title}</CardTitle>
                                    <CardSubtitle className="mb-3 text-muted">by {book.author}</CardSubtitle>
                                    <Badge color="secondary" pill className="me-2 mb-2">{book.category}</Badge>
                                    {book.sellerId && book.sellerId.name && (
                                      <span className="text-muted small ms-2">Seller: {book.sellerId.name}</span>
                                    )}
                                  </div>
                                  <div className="text-end">
                                    {book.isExchangeOnly ? (
                                      <Badge color="info" pill className="px-3 py-2">Exchange Only</Badge>
                                    ) : (
                                      <h4 className="price-display mb-2">${book.price}</h4>
                                    )}
                                    <div>
                                      <Button 
                                        color="primary" 
                                        outline
                                        size="sm"
                                        className="mt-2"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          viewBookDetails(book._id);
                                        }}
                                      >
                                        View Details
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                
                                <CardText className="mt-3">{book.description.substring(0, 180)}...</CardText>
                              </CardBody>
                            </Col>
                          </Row>
                        </Card>
                      ))
                    )}
                  </div>
                )}
                
                {/* Pagination */}
                {sortedBooks.length > booksPerPage && (
                  <div className="d-flex justify-content-center mt-5 mb-4">
                    <nav>
                      <ul className="pagination">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={{ borderRadius: '30px 0 0 30px' }}
                          >
                            <i className="bi bi-chevron-left"></i>
                          </button>
                        </li>
                        
                        {totalPages <= 7 ? (
                          // Show all page numbers if total pages are 7 or less
                          [...Array(totalPages).keys()].map(number => (
                            <li 
                              key={number + 1} 
                              className={`page-item ${currentPage === number + 1 ? 'active' : ''}`}
                            >
                              <button 
                                className="page-link" 
                                onClick={() => paginate(number + 1)}
                              >
                                {number + 1}
                              </button>
                            </li>
                          ))
                        ) : (
                          // Show limited page numbers with ellipsis for many pages
                          <>
                            {/* First page */}
                            <li className={`page-item ${currentPage === 1 ? 'active' : ''}`}>
                              <button className="page-link" onClick={() => paginate(1)}>1</button>
                            </li>
                            
                            {/* Ellipsis or second page */}
                            {currentPage > 3 && (
                              <li className="page-item disabled">
                                <button className="page-link">...</button>
                              </li>
                            )}
                            
                            {/* Pages around current page */}
                            {[...Array(totalPages).keys()]
                              .filter(number => {
                                const pageNum = number + 1;
                                return (
                                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1) && 
                                  (pageNum !== 1 && pageNum !== totalPages)
                                );
                              })
                              .map(number => (
                                <li 
                                  key={number + 1} 
                                  className={`page-item ${currentPage === number + 1 ? 'active' : ''}`}
                                >
                                  <button 
                                    className="page-link" 
                                    onClick={() => paginate(number + 1)}
                                  >
                                    {number + 1}
                                  </button>
                                </li>
                              ))
                            }
                            
                            {/* Ellipsis or second-to-last page */}
                            {currentPage < totalPages - 2 && (
                              <li className="page-item disabled">
                                <button className="page-link">...</button>
                              </li>
                            )}
                            
                            {/* Last page */}
                            <li className={`page-item ${currentPage === totalPages ? 'active' : ''}`}>
                              <button className="page-link" onClick={() => paginate(totalPages)}>
                                {totalPages}
                              </button>
                            </li>
                          </>
                        )}
                        
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={{ borderRadius: '0 30px 30px 0' }}
                          >
                            <i className="bi bi-chevron-right"></i>
                          </button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </div>
            )}
          </Col>
        </Row>
      </Container>
      
      {/* Add global CSS for hover effects */}
      <style>
        {`
          .book-card:hover {
            transform: translateY(-5px) !important;
            box-shadow: 0 10px 20px rgba(0,0,0,0.12) !important;
            transition: all 0.3s ease !important;
          }
          .book-card:hover .book-cover-image {
            transform: scale(1.05);
          }
          .book-card:hover .overlay {
            opacity: 1;
          }
          .shelf-item:hover {
            transform: translateY(-3px) !important;
            box-shadow: 0 10px 20px rgba(0,0,0,0.12) !important;
            transition: all 0.3s ease !important;
          }
          .price {
            color: #28a745;
            font-size: 1.1rem;
          }
          .price-display {
            color: #28a745;
            font-weight: bold;
          }
          .page-link {
            color: #0d6efd;
            border-color: #dee2e6;
            margin: 0 2px;
          }
          .page-item.active .page-link {
            background-color: #0d6efd;
            border-color: #0d6efd;
          }
          .page-link:focus {
            box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
          }
        `}
      </style>
    </div>
  );
};

export default BookShelf; 