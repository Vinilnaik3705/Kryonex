import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Markets from './pages/Markets';
import Trade from './pages/Trade';
import Portfolio from './pages/Portfolio';
import Watchlist from './pages/Watchlist';
import Settings from './pages/Settings';
import Heatmap from './pages/Heatmap';
import Payment from './pages/Payment';
import NewsDetail from './pages/NewsDetail';import Documentation from './pages/Documentation';
import Features from './pages/Features';
import Updates from './pages/Updates';
import PrivacyPolicy from './pages/KryonexPrivacy';
import TermsOfService from './pages/TermsOfService';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MarketProvider } from './context/MarketContext';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { CoinLogoProvider } from './context/CoinLogoContext';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Loader } from 'lucide-react';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const AuthenticatedRedirect = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <Loader className="animate-spin text-accent" size={40} />
      </div>
    );
  }

  if (isSignedIn && ['/', '/login', '/register'].includes(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MarketProvider>
          <ThemeProvider>
            <CoinLogoProvider>
              <CurrencyProvider>
                <Router>
                  <ScrollToTop />
                  <div className="min-h-screen bg-primary text-white font-sans antialiased selection:bg-accent selection:text-white transition-colors duration-300">
                    <AuthenticatedRedirect>
                      <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                      {/* Protected Routes */}
                        <Route path="/dashboard" element={
                          <ProtectedRoute>
                            <Dashboard />
                          </ProtectedRoute>
                        } />
                        <Route path="/markets" element={
                          <ProtectedRoute>
                            <Markets />
                          </ProtectedRoute>
                        } />
                        <Route path="/trade/:assetId" element={
                          <ProtectedRoute>
                            <Trade />
                          </ProtectedRoute>
                        } />
                        <Route path="/portfolio" element={
                          <ProtectedRoute>
                            <Portfolio />
                          </ProtectedRoute>
                        } />
                        <Route path="/watchlist" element={
                          <ProtectedRoute>
                            <Watchlist />
                          </ProtectedRoute>
                        } />
                        <Route path="/settings" element={
                          <ProtectedRoute>
                            <Settings />
                          </ProtectedRoute>
                        } />
                        <Route path="/heatmap" element={
                          <ProtectedRoute>
                            <Heatmap />
                          </ProtectedRoute>
                        } />

                      {/* Payment Route (not in navigation) */}
                        <Route path="/payment" element={
                          <ProtectedRoute>
                            <Payment />
                          </ProtectedRoute>
                        } />
                        <Route path="/news/:id" element={
                          <ProtectedRoute>
                            <NewsDetail />
                          </ProtectedRoute>
                        } />

                      {/* Project Routes */}
                        <Route path="/documentation" element={<Documentation />} />
                        <Route path="/features" element={<Features />} />
                        <Route path="/updates" element={<Updates />} />
                        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                        <Route path="/terms-of-service" element={<TermsOfService />} />

                      {/* Fallback */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </AuthenticatedRedirect>
                  </div>
                </Router>
              </CurrencyProvider>
            </CoinLogoProvider>
          </ThemeProvider>
        </MarketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
