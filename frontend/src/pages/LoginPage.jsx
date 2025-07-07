import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './auth.css';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const LoginPage = () => {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const auth = getAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
    setError(''); // Clear error when user types
  };

  const fetchUserProfile = async (userId) => {
    try {
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userProfile = docSnap.data();
        const fullProfile = {
          userId: userId,
          email: userProfile.email || "",
          college: userProfile.collegeName || "",
          year: userProfile.yearOfStudy || "",
          interest: userProfile.interests || "",
          gender: userProfile.gender || "",
          location: userProfile.location || "",
          preferredLanguage: userProfile.preferredLanguage || ""
        };
        localStorage.setItem("userData", JSON.stringify(fullProfile));
        console.log("✅ User profile loaded and saved:", fullProfile);
      } else {
        console.error("❌ No user profile found in Firestore!");
      }
    } catch (error) {
      console.error("❌ Error fetching user profile:", error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // 1. Sign in using Firebase Auth
      const { user } = await signInWithEmailAndPassword(
        auth,
        loginData.email,
        loginData.password
      );

      // 2. Fetch and store user profile
      await fetchUserProfile(user.uid);
      navigate('/dashboard');
    } catch (error) {
      console.error('❌ Error signing in:', error.message);
      setError('Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Please sign in to continue</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={loginData.email}
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
              placeholder="Enter your password"
              value={loginData.password}
              onChange={handleChange}
              required
              className="form-input"
            />
          </div>
          
          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="register-prompt">
          <p>Don't have an account?</p>
          <Link to="/register" className="register-link">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;