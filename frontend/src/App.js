import { Toaster } from 'react-hot-toast';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import BookingConfirmation from './pages/BookingConfirmation';
import BookingDetails from './pages/BookingDetails';
import FlightDetails from './pages/FlightDetails';
import FlightSearch from './pages/FlightSearch';
import Home from './pages/Home';
import Login from './pages/Login';
import MyBookings from './pages/MyBookings';
import Register from './pages/Register';
import SeatSelection from './pages/SeatSelection';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/flights/search" element={<FlightSearch />} />
              <Route path="/flights/:flightId" element={<FlightDetails />} />
              
              {/* Protected routes */}
              <Route path="/flights/:flightId/seats" element={
                <ProtectedRoute>
                  <SeatSelection />
                </ProtectedRoute>
              } />
              <Route path="/booking/confirmation" element={
                <ProtectedRoute>
                  <BookingConfirmation />
                </ProtectedRoute>
              } />
              <Route path="/booking/:bookingId" element={
                <ProtectedRoute>
                  <BookingDetails />
                </ProtectedRoute>
              } />
              <Route path="/my-bookings" element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              } />
              
              {/* Admin routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
            </Routes>
          </main>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '10px',
                padding: '16px',
                fontSize: '14px',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;