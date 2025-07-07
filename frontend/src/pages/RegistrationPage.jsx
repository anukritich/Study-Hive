import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './auth.css';
import { db, auth } from '../../firebaseConfig';
import { collection, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const RegistrationPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    collegeName: '',
    yearOfStudy: '',
    interests: '',
    gender: '',
    location: '',
    preferredLanguage: ''
  });
  const [showPopup, setShowPopup] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // 1. Create Firebase Auth user
      const { user } = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // 2. Save extra profile info to Firestore using user.uid
      await setDoc(doc(db, 'users', user.uid), {
        email: formData.email,
        collegeName: formData.collegeName,
        yearOfStudy: formData.yearOfStudy,
        interests: formData.interests,
        gender: formData.gender,
        location: formData.location,
        preferredLanguage: formData.preferredLanguage,
        createdAt: new Date()
      });

      setShowPopup(true); // Show popup on successful registration
    } catch (error) {
      console.error('Error registering user: ', error);
      if (error.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please use a different email or sign in.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    navigate('/login');
  };

  return (
    <div className="login-container">
      <div className="register-card">
        <div className="login-header">
          <h1>Create Account</h1>
          <p>Join our community today</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
          
            <div className="form-group">
              <label htmlFor="collegeName">College Name</label>
              <input
                id="collegeName"
                type="text"
                name="collegeName"
                placeholder="Enter your college"
                value={formData.collegeName}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="yearOfStudy">Year of Study</label>
              <select
                id="yearOfStudy"
                name="yearOfStudy"
                value={formData.yearOfStudy}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                type="text"
                name="location"
                placeholder="Your location"
                value={formData.location}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group span-2">
              <label htmlFor="interests">Interests</label>
              <input
                id="interests"
                type="text"
                name="interests"
                placeholder="Your interests (e.g. AI, Sports, Music)"
                value={formData.interests}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
            
            <div className="form-group span-2">
              <label htmlFor="preferredLanguage">Preferred Language</label>
              <input
                id="preferredLanguage"
                type="text"
                name="preferredLanguage"
                placeholder="Your preferred language"
                value={formData.preferredLanguage}
                onChange={handleChange}
                required
                className="form-input"
              />
            </div>
          </div>
          
          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="register-prompt">
          <p>Already have an account?</p>
          <Link to="/login" className="register-link">
            Sign In
          </Link>
        </div>
      </div>
      
      {showPopup && (
        <div className="modal-overlay">
          <div className="success-modal">
            <div className="success-icon">✓</div>
            <h2>Registration Successful!</h2>
            <p>Your account has been created. You can now log in.</p>
            <button onClick={handleClosePopup} className="modal-button">
              Go to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationPage;