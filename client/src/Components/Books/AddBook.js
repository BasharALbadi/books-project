import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createBook } from '../../Features/BookSlice';
import {
  Container,
  Row,
  Col,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Alert,
  Card,
  CardBody,
  FormFeedback
} from 'reactstrap';

const AddBook = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, isError, message } = useSelector((state) => state.books);
  
  // Form state
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [isExchangeOnly, setIsExchangeOnly] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  
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
  
  // Handle file selection for PDF
  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      if (file.type !== 'application/pdf') {
        setErrors({
          ...errors,
          pdf: 'Only PDF files are allowed'
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setErrors({
          ...errors,
          pdf: 'File size must be less than 10MB'
        });
        return;
      }
      
      setErrors({
        ...errors,
        pdf: null
      });
      setPdfFile(file);
    }
  };
  
  // Handle file selection for cover image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Check if file is an image using common image extensions
      const validImageTypes = [
        'image/jpeg', 
        'image/jpg', 
        'image/png', 
        'image/gif', 
        'image/bmp', 
        'image/webp', 
        'image/tiff'
      ];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const isValidByExtension = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'tiff'].includes(fileExtension);
      
      if (!file.type.startsWith('image/') && !isValidByExtension) {
        setErrors({
          ...errors,
          image: 'Only image files are allowed (.jpg, .png, .gif, etc.)'
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors({
          ...errors,
          image: 'File size must be less than 5MB'
        });
        return;
      }
      
      setErrors({
        ...errors,
        image: null
      });
      setCoverImage(file);
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!author.trim()) newErrors.author = 'Author is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!category) newErrors.category = 'Category is required';
    
    if (!isExchangeOnly && (!price || price <= 0)) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    if (!pdfFile) newErrors.pdf = 'PDF file is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const bookData = {
      title,
      author,
      description,
      category,
      price: isExchangeOnly ? 0 : price,
      isExchangeOnly,
      pdfFile,
      coverImage
    };
    
    dispatch(createBook(bookData))
      .unwrap()
      .then(() => {
        setSuccess('Book added successfully!');
        setTimeout(() => {
          navigate('/my-books');
        }, 2000);
      })
      .catch((err) => {
        setErrors({
          ...errors,
          submit: err
        });
      });
  };
  
  return (
    <Container className="my-4">
      <Row>
        <Col md={{ size: 8, offset: 2 }}>
          <Card>
            <CardBody>
              <h2 className="mb-4">Add New Book</h2>
              
              {success && <Alert color="success">{success}</Alert>}
              {errors.submit && <Alert color="danger">{errors.submit}</Alert>}
              {isError && <Alert color="danger">{message}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="title">Book Title*</Label>
                      <Input
                        type="text"
                        name="title"
                        id="title"
                        placeholder="Enter book title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        invalid={!!errors.title}
                      />
                      <FormFeedback>{errors.title}</FormFeedback>
                    </FormGroup>
                  </Col>
                  
                  <Col md={6}>
                    <FormGroup>
                      <Label for="author">Author*</Label>
                      <Input
                        type="text"
                        name="author"
                        id="author"
                        placeholder="Enter author name"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        invalid={!!errors.author}
                      />
                      <FormFeedback>{errors.author}</FormFeedback>
                    </FormGroup>
                  </Col>
                </Row>
                
                <FormGroup>
                  <Label for="description">Description*</Label>
                  <Input
                    type="textarea"
                    name="description"
                    id="description"
                    placeholder="Enter book description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    invalid={!!errors.description}
                  />
                  <FormFeedback>{errors.description}</FormFeedback>
                </FormGroup>
                
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="category">Category*</Label>
                      <Input
                        type="select"
                        name="category"
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        invalid={!!errors.category}
                      >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </Input>
                      <FormFeedback>{errors.category}</FormFeedback>
                    </FormGroup>
                  </Col>
                  
                  <Col md={6}>
                    <FormGroup>
                      <Label for="price">Price ($)</Label>
                      <Input
                        type="number"
                        name="price"
                        id="price"
                        placeholder="Enter price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        disabled={isExchangeOnly}
                        invalid={!isExchangeOnly && !!errors.price}
                        min="0"
                        step="0.01"
                      />
                      <FormFeedback>{errors.price}</FormFeedback>
                    </FormGroup>
                  </Col>
                </Row>
                
                <FormGroup check className="mb-3">
                  <Label check>
                    <Input
                      type="checkbox"
                      checked={isExchangeOnly}
                      onChange={() => setIsExchangeOnly(!isExchangeOnly)}
                    />
                    Exchange Only (no selling price)
                  </Label>
                </FormGroup>
                
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Label for="pdfFile">Book PDF File*</Label>
                      <Input
                        type="file"
                        name="pdfFile"
                        id="pdfFile"
                        onChange={handlePdfChange}
                        accept=".pdf"
                        invalid={!!errors.pdf}
                      />
                      <FormFeedback>{errors.pdf}</FormFeedback>
                      <small className="form-text text-muted">
                        Upload a PDF file of the book. Maximum size: 10MB.
                      </small>
                    </FormGroup>
                  </Col>
                  
                  <Col md={6}>
                    <FormGroup>
                      <Label for="coverImage">Cover Image (Optional)</Label>
                      <Input
                        type="file"
                        name="coverImage"
                        id="coverImage"
                        onChange={handleImageChange}
                        accept="image/*"
                        invalid={!!errors.image}
                      />
                      <FormFeedback>{errors.image}</FormFeedback>
                      <small className="form-text text-muted">
                        Upload a cover image. Maximum size: 5MB.
                      </small>
                    </FormGroup>
                  </Col>
                </Row>
                
                <div className="mt-4 d-flex justify-content-between">
                  <Button type="button" color="secondary" onClick={() => navigate('/my-books')}>
                    Cancel
                  </Button>
                  <Button type="submit" color="primary" disabled={isLoading}>
                    {isLoading ? 'Uploading...' : 'Add Book'}
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AddBook; 