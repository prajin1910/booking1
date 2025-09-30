import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiClock, FiEye, FiMapPin, FiNavigation, FiRefreshCw, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { bookingsAPI } from '../utils/api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, completed, cancelled
  const [sortBy, setSortBy] = useState('date-desc'); // date-asc, date-desc, status

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await bookingsAPI.getMyBookings();
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
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

  const getFlightStatus = (booking) => {
    const now = new Date();
    const departureTime = new Date(booking.flight.route.departure.time);
    const arrivalTime = new Date(booking.flight.route.arrival.time);

    if (booking.bookingStatus === 'cancelled') return 'cancelled';
    if (now > arrivalTime) return 'completed';
    if (now > departureTime) return 'in-flight';
    return 'upcoming';
  };

  const filterBookings = (bookings) => {
    let filtered = bookings;

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(booking => {
        const status = getFlightStatus(booking);
        return filter === status || (filter === 'upcoming' && ['upcoming', 'in-flight'].includes(status));
      });
    }

    // Sort bookings
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.flight.route.departure.time) - new Date(b.flight.route.departure.time);
        case 'date-desc':
          return new Date(b.flight.route.departure.time) - new Date(a.flight.route.departure.time);
        case 'status':
          return a.bookingStatus.localeCompare(b.bookingStatus);
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    return filtered;
  };

  const filteredBookings = filterBookings(bookings);

  const getBookingCounts = () => {
    const all = bookings.length;
    const upcoming = bookings.filter(b => ['upcoming', 'in-flight'].includes(getFlightStatus(b))).length;
    const completed = bookings.filter(b => getFlightStatus(b) === 'completed').length;
    const cancelled = bookings.filter(b => b.bookingStatus === 'cancelled').length;
    
    return { all, upcoming, completed, cancelled };
  };

  const counts = getBookingCounts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">Manage and track all your flight bookings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <FiNavigation className="w-8 h-8 text-primary-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{counts.all}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <FiClock className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Upcoming</p>
              <p className="text-2xl font-bold text-gray-900">{counts.upcoming}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <FiUser className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{counts.completed}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <FiRefreshCw className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">{counts.cancelled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'upcoming'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming ({counts.upcoming})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'completed'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed ({counts.completed})
            </button>
            <button
              onClick={() => setFilter('cancelled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'cancelled'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelled ({counts.cancelled})
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <FiNavigation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No bookings found' : `No ${filter} bookings`}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? "You haven't made any flight bookings yet."
              : `You don't have any ${filter} bookings.`
            }
          </p>
          <Link to="/search" className="btn-primary">
            Book Your First Flight
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBookings.map((booking) => {
            const flightStatus = getFlightStatus(booking);
            return (
              <div key={booking._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      {/* Booking Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.flight.airline.name} {booking.flight.flightNumber}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.bookingStatus)}`}>
                            {booking.bookingStatus.charAt(0).toUpperCase() + booking.bookingStatus.slice(1)}
                          </span>
                          {booking.checkInStatus.isCheckedIn && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium text-blue-600 bg-blue-100">
                              Checked In
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Booking ID</p>
                          <p className="font-medium">{booking.bookingId}</p>
                        </div>
                      </div>

                      {/* Flight Route */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <FiMapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">Departure</span>
                          </div>
                          <div className="ml-6">
                            <p className="font-semibold text-lg">{booking.flight.route.departure.airport.code}</p>
                            <p className="text-sm text-gray-600">{booking.flight.route.departure.airport.name}</p>
                            <p className="text-sm text-gray-500">
                              {formatDate(booking.flight.route.departure.time)} at {formatTime(booking.flight.route.departure.time)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <FiNavigation className="w-6 h-6 text-primary-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Direct Flight</p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <FiMapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">Arrival</span>
                          </div>
                          <div className="ml-6">
                            <p className="font-semibold text-lg">{booking.flight.route.arrival.airport.code}</p>
                            <p className="text-sm text-gray-600">{booking.flight.route.arrival.airport.name}</p>
                            <p className="text-sm text-gray-500">
                              {formatDate(booking.flight.route.arrival.time)} at {formatTime(booking.flight.route.arrival.time)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Passenger Info */}
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                          <span>
                            <FiUser className="inline w-4 h-4 mr-1" />
                            {booking.passengers.length} Passenger{booking.passengers.length > 1 ? 's' : ''}
                          </span>
                          <span>
                            Seats: {booking.passengers.map(p => p.seatNumber).join(', ')}
                          </span>
                          <span>
                            Class: {booking.passengers[0].seatClass.charAt(0).toUpperCase() + booking.passengers[0].seatClass.slice(1)}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg text-primary-600">
                            ${booking.pricing.totalAmount}
                          </p>
                          <p className="text-xs">Total Paid</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 lg:mt-0 lg:ml-6 flex-shrink-0">
                      <div className="flex flex-col space-y-2">
                        <Link
                          to={`/booking/${booking._id}`}
                          className="btn-primary flex items-center justify-center space-x-2 w-full lg:w-auto"
                        >
                          <FiEye className="w-4 h-4" />
                          <span>View Details</span>
                        </Link>
                        
                        {flightStatus === 'upcoming' && !booking.checkInStatus.isCheckedIn && (
                          <button className="btn-secondary w-full lg:w-auto text-sm">
                            Check In
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Bar */}
                <div className={`px-6 py-3 text-sm font-medium ${
                  flightStatus === 'upcoming' ? 'bg-blue-50 text-blue-700' :
                  flightStatus === 'in-flight' ? 'bg-green-50 text-green-700' :
                  flightStatus === 'completed' ? 'bg-gray-50 text-gray-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <span>
                      {flightStatus === 'upcoming' && 'Flight scheduled'}
                      {flightStatus === 'in-flight' && 'Flight in progress'}
                      {flightStatus === 'completed' && 'Flight completed'}
                      {flightStatus === 'cancelled' && 'Booking cancelled'}
                    </span>
                    <span className="text-xs">
                      Booked on {formatDate(booking.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-12 text-center">
        <p className="text-gray-600 mb-4">Looking for your next adventure?</p>
        <Link to="/search" className="btn-primary">
          Search New Flights
        </Link>
      </div>
    </div>
  );
};

export default MyBookings;