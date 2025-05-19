//import logo from "../Images/logo-t.png";
import Posts from "./Posts";
import SharePost from "./SharePost";
import User from "./User";
import { Container, Row, Col } from "reactstrap"; //import the Reactstrap Components

import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getBooks } from '../Features/BookSlice';
import {
  Card,
  CardImg,
  CardBody,
  CardTitle,
  CardSubtitle,
  Button,
  Badge,
  Carousel,
  CarouselItem,
  CarouselControl,
  CarouselIndicators,
  CarouselCaption,
  Jumbotron,
  Input,
  InputGroup,
  Form
} from 'reactstrap';

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.users);
  const { books, isLoading } = useSelector((state) => state.books);
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Featured books for the carousel (will use the first 3 books)
  const featuredBooks = books && books.length ? books.slice(0, 3) : [];
  
  // Fetch books when component mounts
  useEffect(() => {
    dispatch(getBooks());
    // Add scroll event listener to create fade-in animations
    const handleScroll = () => {
      const elements = document.querySelectorAll('.scroll-animation');
      elements.forEach((element) => {
        const position = element.getBoundingClientRect();
        // If element is in viewport
        if (position.top < window.innerHeight && position.bottom >= 0) {
          element.classList.add('fade-in');
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    // Trigger once on page load
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [dispatch]);
  
  // Handle carousel next/previous
  const next = () => {
    if (animating) return;
    const nextIndex = activeIndex === featuredBooks.length - 1 ? 0 : activeIndex + 1;
    setActiveIndex(nextIndex);
  };
  
  const previous = () => {
    if (animating) return;
    const nextIndex = activeIndex === 0 ? featuredBooks.length - 1 : activeIndex - 1;
    setActiveIndex(nextIndex);
  };
  
  const goToIndex = (newIndex) => {
    if (animating) return;
    setActiveIndex(newIndex);
  };
  
  // Categories for the category section with icons
  const categories = [
    { name: 'Fiction', icon: 'fa-book-open', color: '#3B82F6' },
    { name: 'Non-fiction', icon: 'fa-landmark', color: '#F97316' },
    { name: 'Science', icon: 'fa-flask', color: '#10B981' },
    { name: 'Technology', icon: 'fa-laptop-code', color: '#8B5CF6' },
    { name: 'History', icon: 'fa-monument', color: '#F59E0B' },
    { name: 'Business', icon: 'fa-chart-line', color: '#EF4444' }
  ];
  
  // Handle search query change
  const handleSearch = (e) => {
    e.preventDefault();
    if (!user) {
      // Redirect to register if not logged in
      navigate('/register', { 
        state: { 
          message: 'Please register or login to search for books' 
        } 
      });
      return;
    }
    navigate(`/books?search=${searchQuery}`);
  };
  
  // Testimonials data
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Book Enthusiast",
      image: "https://randomuser.me/api/portraits/women/11.jpg",
      text: "BookMarket transformed how I discover new books! The exchange feature helped me refresh my collection without breaking the bank."
    },
    {
      id: 2,
      name: "David Chen",
      role: "English Professor",
      image: "https://randomuser.me/api/portraits/men/32.jpg",
      text: "As an educator, I love how easy it is to find specific editions. The seller verification system ensures I always get quality books."
    },
    {
      id: 3,
      name: "Maria Rodriguez",
      role: "Small Bookstore Owner",
      image: "https://randomuser.me/api/portraits/women/68.jpg",
      text: "BookMarket helped me expand my business online. The platform is intuitive and has connected me with readers nationwide!"
    }
  ];
  
  // Features for non-authenticated users
  const features = [
    {
      icon: 'fa-exchange-alt',
      title: 'Book Exchange',
      description: 'Trade books with other readers to refresh your collection without spending money',
      color: '#3B82F6'
    },
    {
      icon: 'fa-book-reader',
      title: 'Diverse Collection',
      description: 'Find everything from bestsellers to rare editions across all genres',
      color: '#10B981'
    },
    {
      icon: 'fa-hand-holding-usd',
      title: 'Sell Your Books',
      description: 'Make money by selling books you no longer need',
      color: '#F97316'
    },
    {
      icon: 'fa-users',
      title: 'Reader Community',
      description: 'Connect with fellow book lovers and discover new recommendations',
      color: '#8B5CF6'
    }
  ];
  
  return (
    <div className="home-page" style={{ marginTop: '76px' }}>
      {/* Hero Section */}
      <div 
        className="hero-section mb-5" 
        style={{ 
          backgroundImage: `url(https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80)`,
          padding: '6rem 0'
        }}
      >
        <Container>
          <Row className="align-items-center">
            <Col lg={7} md={10} className="text-white">
              <h1 className="display-4 fw-bold mb-4">Discover Your Next Literary Adventure</h1>
              <p className="lead mb-4">Buy, sell, and exchange books with fellow readers from around the world. Join our community and find your next page-turner.</p>
              
              <Form onSubmit={handleSearch} className="mt-4 mb-4">
                <InputGroup className="search-bar">
                  <Input 
                    type="text" 
                    placeholder="Search for books, authors, or ISBN..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="form-control-lg border-0"
                  />
                  <Button color="primary" type="submit">
                    <i className="fas fa-search"></i>
                  </Button>
                </InputGroup>
              </Form>
              
              <div className="d-flex flex-wrap gap-2 mt-4">
                {!user ? (
                  <>
                    <Button 
                      color="secondary" 
                      size="lg" 
                      className="me-2" 
                      onClick={() => navigate('/register')}
                    >
                      <i className="fas fa-user-plus me-2"></i>
                      Join Now
                    </Button>
                    <Button 
                      outline
                      color="light" 
                      size="lg" 
                      onClick={() => navigate('/login')}
                    >
                      <i className="fas fa-sign-in-alt me-2"></i>
                      Sign In
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      color="secondary" 
                      size="lg" 
                      className="me-2" 
                      onClick={() => navigate('/books')}
                    >
                      <i className="fas fa-book me-2"></i>
                      Browse Catalog
                    </Button>
                    {user.role === 'seller' && (
                      <Button 
                        color="success" 
                        size="lg" 
                        onClick={() => navigate('/add-book')}
                      >
                        <i className="fas fa-plus-circle me-2"></i>
                        Sell a Book
                      </Button>
                    )}
                  </>
                )}
              </div>
              
              <div className="stats d-flex mt-5">
                <div className="me-4">
                  <div className="fs-3 fw-bold text-white">10,000+</div>
                  <div className="text-light-50">Books Listed</div>
                </div>
                <div className="me-4">
                  <div className="fs-3 fw-bold text-white">5,000+</div>
                  <div className="text-light-50">Active Users</div>
                </div>
                <div>
                  <div className="fs-3 fw-bold text-white">98%</div>
                  <div className="text-light-50">Satisfaction</div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
      
      {/* Features Section for Non-authenticated Users */}
      {!user && (
        <section className="py-5 bg-light">
          <Container>
            <h2 className="section-title text-center mb-5">Why Join BookMarket?</h2>
            <Row>
              {features.map((feature, index) => (
                <Col md={3} sm={6} key={index} className="mb-4">
                  <div className="text-center scroll-animation">
                    <div className="mb-4">
                      <div 
                        className="mx-auto rounded-circle d-flex align-items-center justify-content-center"
                        style={{ 
                          width: '80px', 
                          height: '80px', 
                          backgroundColor: `${feature.color}20`,
                          color: feature.color
                        }}
                      >
                        <i className={`fas ${feature.icon} fa-2x`}></i>
                      </div>
                    </div>
                    <h4>{feature.title}</h4>
                    <p className="text-muted">{feature.description}</p>
                  </div>
                </Col>
              ))}
            </Row>
            <div className="text-center mt-4">
              <Button 
                color="primary" 
                size="lg" 
                onClick={() => navigate('/register')}
              >
                Create Free Account
              </Button>
            </div>
          </Container>
        </section>
      )}
      
      {/* Categories Section */}
      <section className="py-5 bg-light">
        <Container>
          <h2 className="section-title text-center mb-5">Browse by Category</h2>
          <Row>
            {categories.map((category, index) => (
              <Col md={2} sm={4} xs={6} key={index} className="mb-4">
                <div 
                  className="category-card scroll-animation cursor-pointer"
                  onClick={() => {
                    if (user) {
                      navigate(`/books?category=${category.name.toLowerCase()}`);
                    } else {
                      navigate('/register', { 
                        state: { message: 'Register to browse our collection' } 
                      });
                    }
                  }}
                >
                  <div 
                    className="category-icon" 
                    style={{ 
                      backgroundColor: `${category.color}20`,
                      color: category.color,
                      width: '70px',
                      height: '70px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      marginBottom: '1rem'
                    }}
                  >
                    <i className={`fas ${category.icon} fa-2x`}></i>
                  </div>
                  <h5 className="mb-0 text-dark">{category.name}</h5>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
      
      {/* Featured Books Preview (even for non-authenticated users) */}
      {featuredBooks.length > 0 && (
        <section className="py-5">
          <Container>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="section-title mb-0">Featured Books</h2>
              <Button 
                color="link" 
                className="fw-bold"
                onClick={() => user ? navigate('/books') : navigate('/register')}
              >
                {user ? 'View All' : 'Register to Browse'} <i className="fas fa-arrow-right ms-1"></i>
              </Button>
            </div>
            
            <div className="position-relative">
              <Carousel
                activeIndex={activeIndex}
                next={next}
                previous={previous}
                className="featured-carousel"
                dark
              >
                <CarouselIndicators
                  items={featuredBooks}
                  activeIndex={activeIndex}
                  onClickHandler={goToIndex}
                />
                {featuredBooks.map((book, index) => (
                  <CarouselItem
                    key={book._id || index}
                    onExiting={() => setAnimating(true)}
                    onExited={() => setAnimating(false)}
                    className="featured-item"
                  >
                    <Row>
                      <Col md={4} className="d-flex align-items-center justify-content-center">
                        <img 
                          src={book.coverImage || 'https://via.placeholder.com/300x450?text=No+Cover'} 
                          alt={book.title} 
                          className="img-fluid book-cover-shadow"
                          style={{ maxHeight: '350px', borderRadius: '8px' }}
                        />
                      </Col>
                      <Col md={8} className="d-flex align-items-center">
                        <div className="p-md-5 p-3">
                          <h3 className="mb-3">{book.title}</h3>
                          <p className="text-muted mb-3">by {book.author}</p>
                          <div className="mb-4">
                            {book.isExchangeOnly ? (
                              <Badge color="info" className="me-2 p-2">Exchange Only</Badge>
                            ) : (
                              <div className="book-price mb-3">${book.price}</div>
                            )}
                            <Badge color="secondary" className="p-2">{book.category}</Badge>
                          </div>
                          <p className="mb-4">{book.description ? book.description.substring(0, 150) + '...' : 'No description available.'}</p>
                          <Button 
                            color="primary"
                            onClick={() => user ? navigate(`/books/${book._id}`) : navigate('/register')}
                          >
                            {user ? 'View Details' : 'Register to View'}
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </CarouselItem>
                ))}
                <CarouselControl
                  direction="prev"
                  directionText="Previous"
                  onClickHandler={previous}
                />
                <CarouselControl
                  direction="next"
                  directionText="Next"
                  onClickHandler={next}
                />
              </Carousel>
            </div>
          </Container>
        </section>
      )}
      
      {/* How It Works Section */}
      <section className="py-5 bg-light">
        <Container>
          <h2 className="section-title text-center mb-5">How BookMarket Works</h2>
          <Row>
            <Col md={4} className="mb-4">
              <div className="text-center scroll-animation">
                <div className="mb-4">
                  <div 
                    className="mx-auto rounded-circle bg-primary d-flex align-items-center justify-content-center"
                    style={{ width: '80px', height: '80px' }}
                  >
                    <i className="fas fa-search fa-2x text-white"></i>
                  </div>
                </div>
                <h4>Find Books</h4>
                <p className="text-muted">
                  Browse our extensive catalog of books from sellers around the world. Filter by category, price, condition and more.
                </p>
              </div>
            </Col>
            <Col md={4} className="mb-4">
              <div className="text-center scroll-animation">
                <div className="mb-4">
                  <div 
                    className="mx-auto rounded-circle bg-secondary d-flex align-items-center justify-content-center"
                    style={{ width: '80px', height: '80px' }}
                  >
                    <i className="fas fa-handshake fa-2x text-white"></i>
                  </div>
                </div>
                <h4>Exchange or Purchase</h4>
                <p className="text-muted">
                  Choose to buy books directly or propose exchanges with other readers. Our secure system ensures fair trades.
                </p>
              </div>
            </Col>
            <Col md={4} className="mb-4">
              <div className="text-center scroll-animation">
                <div className="mb-4">
                  <div 
                    className="mx-auto rounded-circle bg-success d-flex align-items-center justify-content-center"
                    style={{ width: '80px', height: '80px' }}
                  >
                    <i className="fas fa-book-reader fa-2x text-white"></i>
                  </div>
                </div>
                <h4>Enjoy Reading</h4>
                <p className="text-muted">
                  Receive your books and dive into new worlds. Leave reviews, build your collection, and connect with the community.
                </p>
              </div>
            </Col>
          </Row>
          <div className="text-center mt-4">
            <Button 
              color="primary" 
              size="lg" 
              onClick={() => user ? navigate('/about') : navigate('/register')}
            >
              {user ? 'Learn More About Us' : 'Get Started Now'}
            </Button>
          </div>
        </Container>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-5">
        <Container>
          <h2 className="section-title text-center mb-5">What Our Users Say</h2>
          <Row>
            {testimonials.map(testimonial => (
              <Col md={4} key={testimonial.id} className="mb-4">
                <Card className="h-100 border-0 scroll-animation">
                  <CardBody className="p-4">
                    <div className="d-flex mb-4">
                      {[1, 2, 3, 4, 5].map(star => (
                        <i key={star} className="fas fa-star text-warning me-1"></i>
                      ))}
                    </div>
                    <p className="testimonial-text mb-4">{testimonial.text}</p>
                    <div className="d-flex align-items-center">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name} 
                        className="rounded-circle"
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                      />
                      <div className="ms-3">
                        <h6 className="mb-0 fw-bold">{testimonial.name}</h6>
                        <small className="text-muted">{testimonial.role}</small>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>
      
      {/* CTA Section */}
      <section 
        className="py-5 text-white"
        style={{ 
          backgroundImage: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <Container>
          <Row className="align-items-center">
            <Col lg={8} md={7}>
              <h2 className="text-white mb-3">Ready to Start Your Reading Journey?</h2>
              <p className="lead mb-4">
                Join thousands of book lovers and start exploring our collection today. List your books, find new favorites, and connect with readers worldwide.
              </p>
            </Col>
            <Col lg={4} md={5} className="text-md-end">
              {!user ? (
                <Button 
                  color="light" 
                  size="lg" 
                  className="fw-bold"
                  onClick={() => navigate('/register')}
                >
                  Sign Up Now <i className="fas fa-arrow-right ms-2"></i>
                </Button>
              ) : (
                <Button 
                  color="light" 
                  size="lg" 
                  className="fw-bold"
                  onClick={() => navigate('/books')}
                >
                  Browse Books <i className="fas fa-arrow-right ms-2"></i>
                </Button>
              )}
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home;
