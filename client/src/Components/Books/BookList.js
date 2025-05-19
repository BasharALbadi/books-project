import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getBooks } from '../../Features/BookSlice';
import { Link } from 'react-router-dom';
import {
  Container,
  Row,
  Col,
  Card,
  CardImg,
  CardBody,
  CardTitle,
  CardSubtitle,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Badge
} from 'reactstrap';

const BookList = () => {
  const dispatch = useDispatch();
  const { books, isLoading } = useSelector((state) => state.books);
  
  // Filter states
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [exchangeOnly, setExchangeOnly] = useState(false);
  
  // Available categories
  const categories = [
    'Fiction',
    'Non-fiction',
    'Science',
    'Technology',
    'History',
    'Biography',
    'Self-help',
    'Business',
    'Cooking',
    'Art',
    'Travel',
    'Religion',
    'Comics',
    'Other'
  ];
  
  // Load books on component mount
  useEffect(() => {
    dispatch(getBooks());
  }, [dispatch]);
  
  // Apply filters
  const applyFilters = () => {
    const filters = {
      category: category || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      isExchangeOnly: exchangeOnly || undefined
    };
    
    dispatch(getBooks(filters));
  };
  
  // Reset filters
  const resetFilters = () => {
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setExchangeOnly(false);
    dispatch(getBooks());
  };
  
  return (
    <Container>
      <h2 className="my-4">Browse Books</h2>
      
      <Row>
        {/* Filters sidebar */}
        <Col md={3}>
          <Card className="mb-4">
            <CardBody>
              <h4>Filters</h4>
              <Form>
                <FormGroup>
                  <Label for="category">Category</Label>
                  <Input
                    type="select"
                    name="category"
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Input>
                </FormGroup>
                
                <FormGroup>
                  <Label for="priceRange">Price Range</Label>
                  <Row>
                    <Col>
                      <Input
                        type="number"
                        name="minPrice"
                        id="minPrice"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                      />
                    </Col>
                    <Col>
                      <Input
                        type="number"
                        name="maxPrice"
                        id="maxPrice"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                      />
                    </Col>
                  </Row>
                </FormGroup>
                
                <FormGroup check>
                  <Label check>
                    <Input
                      type="checkbox"
                      checked={exchangeOnly}
                      onChange={() => setExchangeOnly(!exchangeOnly)}
                    />
                    Exchange Only
                  </Label>
                </FormGroup>
                
                <div className="d-flex justify-content-between mt-3">
                  <Button color="primary" onClick={applyFilters}>
                    Apply Filters
                  </Button>
                  <Button color="secondary" onClick={resetFilters}>
                    Reset
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>
        
        {/* Book grid */}
        <Col md={9}>
          {isLoading ? (
            <div className="text-center my-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <Row>
              {books.length === 0 ? (
                <Col>
                  <div className="text-center my-5">
                    <h4>No books found matching your criteria</h4>
                    <p>Try adjusting your filters or browse all books</p>
                  </div>
                </Col>
              ) : (
                books.map((book) => (
                  <Col md={4} key={book._id} className="mb-4">
                    <Card className="h-100 book-card">
                      <CardImg
                        top
                        width="100%"
                        src={book.coverImage ? `${process.env.REACT_APP_API_URL}${book.coverImage}` : 'https://via.placeholder.com/150x200?text=No+Cover'}
                        alt={book.title}
                        className="book-cover"
                      />
                      <CardBody>
                        <CardTitle tag="h5">{book.title}</CardTitle>
                        <CardSubtitle tag="h6" className="mb-2 text-muted">
                          {book.author}
                        </CardSubtitle>
                        
                        <div className="d-flex justify-content-between align-items-center my-2">
                          {book.isExchangeOnly ? (
                            <Badge color="info">Exchange Only</Badge>
                          ) : (
                            <span className="price">${book.price}</span>
                          )}
                          <Badge color="secondary">{book.category}</Badge>
                        </div>
                        
                        <div className="mt-auto">
                          <Link to={`/books/${book._id}`}>
                            <Button color="primary" block>View Details</Button>
                          </Link>
                        </div>
                      </CardBody>
                    </Card>
                  </Col>
                ))
              )}
            </Row>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default BookList; 