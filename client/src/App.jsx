import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthContext from './contexts/AuthContext.jsx';
import NavigationBar from './components/NavigationBar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SetupPage from './pages/SetupPage.jsx';
import PlanningPage from './pages/PlanningPage.jsx';
import ExecutionPage from './pages/ExecutionPage.jsx';
import ResultPage from './pages/ResultPage.jsx';
import RankingPage from './pages/RankingPage.jsx';
import * as API from './API.js';
import './styles/app.css';

function App() {
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.getUserInfo()
      .then(u => {
        setUser(u);
        setLoggedIn(true);
      })
      .catch(() => {
        setUser(null);
        setLoggedIn(false);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = async (credentials) => {
    const u = await API.logIn(credentials);
    setUser(u);
    setLoggedIn(true);
  };

  const handleLogout = async () => {
    await API.logOut();
    setUser(null);
    setLoggedIn(false);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loggedIn, handleLogin, handleLogout }}>
      <NavigationBar />
      <div className="container-fluid mt-3">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={loggedIn ? <Navigate to="/setup" replace /> : <LoginPage />}
          />
          <Route
            path="/setup"
            element={<ProtectedRoute><SetupPage /></ProtectedRoute>}
          />
          <Route
            path="/planning/:gameId"
            element={<ProtectedRoute><PlanningPage /></ProtectedRoute>}
          />
          <Route
            path="/execution/:gameId"
            element={<ProtectedRoute><ExecutionPage /></ProtectedRoute>}
          />
          <Route
            path="/result/:gameId"
            element={<ProtectedRoute><ResultPage /></ProtectedRoute>}
          />
          <Route
            path="/ranking"
            element={<ProtectedRoute><RankingPage /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
