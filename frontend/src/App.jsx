import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import JoinGroup from "./pages/JoinGroup";
import CreateGroup from "./pages/CreateGroup";
import StudyGroupChat from "./pages/StudyGroupChat";
import LandingPage from "./pages/LandingPage"; 
import PersonalStudyRoom from "./pages/PersonalStudyRoom";
import StandaloneVideoChat from "./pages/StandaloneVideoChat";
import RegistrationPage from "./pages/RegistrationPage";
import LoginPage from "./pages/LoginPage";
import FindingBuddy from "./pages/FindingBuddy";




function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/join-group" element={<JoinGroup />} />
      <Route path="/create-group" element={<CreateGroup />} />
      <Route path="/study-group/:groupId" element={<StudyGroupChat />} />
      <Route path="/personal-study-room" element={<PersonalStudyRoom />} />
      <Route path="/video" element={<StandaloneVideoChat />} />
      <Route path="/video/:roomId" element={<StandaloneVideoChat />} />
      <Route path="/register" element={<RegistrationPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/finding-buddy" element={<FindingBuddy />} />
    </Routes>
  );
}

export default App;
