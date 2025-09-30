import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiCheck, FiDownload, FiMail, FiMapPin, FiNavigation, FiPhone, FiUser, FiX } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { bookingsAPI } from '../utils/api';

const BookingDetails = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await bookingsAPI.getById(bookingId);
      setBooking(response.data.booking);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast.error('Booking not found');
      navigate('/my-bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    setIsCancelling(true);
    try {
      await bookingsAPI.cancel(bookingId, cancelReason);
      toast.success('Booking cancelled successfully');
      setShowCancelModal(false);
      fetchBookingDetails(); // Refresh booking details
    } catch (error) {
      console.error('Cancellation error:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await bookingsAPI.checkIn(bookingId);
      toast.success('Check-in successful!');
      fetchBookingDetails(); // Refresh booking details
    } catch (error) {
      console.error('Check-in error:', error);
      toast.error(error.response?.data?.message || 'Check-in failed');
    }
  };

  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (dateTime) => {
    return new Date(dateTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const canCancel = () => {
    if (!booking) return false;
    if (booking.bookingStatus === 'cancelled') return false;
    
    const departureTime = new Date(booking.flight.route.departure.time);
    const now = new Date();
    const hoursDifference = (departureTime - now) / (1000 * 60 * 60);
    
    return hoursDifference > 2; // Can cancel if more than 2 hours before departure
  };

  const canCheckIn = () => {
    if (!booking) return false;
    if (booking.bookingStatus !== 'confirmed') return false;
    if (booking.checkInStatus.isCheckedIn) return false;
    
    const departureTime = new Date(booking.flight.route.departure.time);
    const now = new Date();
    const hoursDifference = (departureTime - now) / (1000 * 60 * 60);
    
    return hoursDifference <= 24 && hoursDifference > 0; // Can check-in 24 hours before to departure
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Booking not found</p>
        <button onClick={() => navigate('/my-bookings')} className="btn-primary mt-4">
          Back to My Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Booking Details
            </h1>
            <div className="flex items-center space-x-4 text-gray-600">
              <span>Booking ID: <strong>{booking.bookingId}</strong></span>
              <span>PNR: <strong>{booking.bookingReference.pnr}</strong></span>
            </div>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.bookingStatus)}`}>
              {booking.bookingStatus.charAt(0).toUpperCase() + booking.bookingStatus.slice(1)}
            </span>
            {booking.checkInStatus.isCheckedIn && (
              <span className="px-3 py-1 rounded-full text-sm font-medium text-blue-600 bg-blue-100">
                Checked In
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Flight Information */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <FiNavigation className="mr-2" />
          Flight Information
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Flight Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Flight:</span>
                <span className="font-medium">{booking.flight.airline.name} {booking.flight.flightNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Aircraft:</span>
                <span className="font-medium">Boeing 737-800</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">{booking.flight.status}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Route</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <FiMapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Departure</span>
                </div>
                <div className="ml-6">
                  <div className="font-medium">{booking.flight.route.departure.airport.code}</div>
                  <div className="text-sm text-gray-600">{booking.flight.route.departure.airport.name}</div>
                  <div className="text-sm text-gray-500">
                    {formatDate(booking.flight.route.departure.time)} at {formatTime(booking.flight.route.departure.time)}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <FiMapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Arrival</span>
                </div>
                <div className="ml-6">
                  <div className="font-medium">{booking.flight.route.arrival.airport.code}</div>
                  <div className="text-sm text-gray-600">{booking.flight.route.arrival.airport.name}</div>
                  <div className="text-sm text-gray-500">
                    {formatDate(booking.flight.route.arrival.time)} at {formatTime(booking.flight.route.arrival.time)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Passenger Information */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <FiUser className="mr-2" />
          Passenger Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {booking.passengers.map((passenger, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {passenger.title} {passenger.firstName} {passenger.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">Passenger {index + 1}</p>
                </div>
                <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-sm font-medium">
                  {passenger.seatNumber}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Class:</span>
                  <span className="ml-2 font-medium capitalize">{passenger.seatClass}</span>
                </div>
                <div>
                  <span className="text-gray-600">Meal:</span>
                  <span className="ml-2 font-medium capitalize">
                    {passenger.mealPreference === 'none' ? 'Standard' : passenger.mealPreference}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Gender:</span>
                  <span className="ml-2 font-medium capitalize">{passenger.gender}</span>
                </div>
                <div>
                  <span className="text-gray-600">Age:</span>
                  <span className="ml-2 font-medium">
                    {new Date().getFullYear() - new Date(passenger.dateOfBirth).getFullYear()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <FiMail className="mr-2" />
          Contact Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <FiMail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Email</span>
            </div>
            <div className="ml-6 font-medium">{booking.contactDetails.email}</div>
          </div>
          
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <FiPhone className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Phone</span>
            </div>
            <div className="ml-6 font-medium">{booking.contactDetails.phone || 'Not provided'}</div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6">Payment Information</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Base Price:</span>
            <span className="font-medium">${booking.pricing.basePrice}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Taxes & Fees:</span>
            <span className="font-medium">${booking.pricing.taxes + booking.pricing.fees}</span>
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Paid:</span>
              <span className="text-primary-600">${booking.pricing.totalAmount}</span>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Payment Status:</span>
            <span className="font-medium text-green-600">Completed</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Transaction ID:</span>
            <span className="font-medium">{booking.paymentDetails.transactionId}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-6">Actions</h2>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => window.print()}
            className="btn-secondary flex items-center space-x-2"
          >
            <FiDownload className="w-4 h-4" />
            <span>Download Ticket</span>
          </button>
          
          {canCheckIn() && (
            <button
              onClick={handleCheckIn}
              className="btn-success flex items-center space-x-2"
            >
              <FiCheck className="w-4 h-4" />
              <span>Check In</span>
            </button>
          )}
          
          {canCancel() && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="btn-danger flex items-center space-x-2"
            >
              <FiX className="w-4 h-4" />
              <span>Cancel Booking</span>
            </button>
          )}
          
          <button
            onClick={() => navigate('/my-bookings')}
            className="btn-secondary"
          >
            Back to My Bookings
          </button>
        </div>
      </div>

      {/* Cancel Booking Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Cancel Booking</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation:
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="input-field"
                rows="3"
                placeholder="Please provide a reason..."
                required
              />
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleCancelBooking}
                disabled={isCancelling || !cancelReason.trim()}
                className="btn-danger flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCancelling ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="spinner"></div>
                    <span>Cancelling...</span>
                  </div>
                ) : (
                  'Confirm Cancellation'
                )}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn-secondary flex-1"
                disabled={isCancelling}
              >
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetails;