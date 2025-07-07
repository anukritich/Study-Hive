import React from "react";
import { Link } from "react-router-dom";
import Hero from './Hero'

const LandingPage = () => {
  return (
    <>
    <Hero />
    {/* <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-600">Welcome to StudyHive</h1>
      <p className="mt-4 text-lg text-gray-700">Collaborate, Learn, and Track Your Progress</p>
      <div className="mt-6">
        <Link to="/dashboard" className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700">Get Started</Link>
      </div>
    </div> */}
    </>
    
    
  );
};
export default LandingPage;