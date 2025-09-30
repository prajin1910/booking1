import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiArrowRight, FiNavigation, FiStar, FiTv, FiUsers, FiWifi } from 'react-icons/fi';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { flightsAPI } from '../utils/api';

const FlightDetails = () => {
  const { flightId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  
  const [flight, setFlight] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('economy');

  const searchCriteria = location.state?.searchCriteria || {};

  useEffect(() => {
    fetchFlightDetails();
  }, [flightId]);

  useEffect(() => {
    if (searchCriteria.class) {
      setSelectedClass(searchCriteria.class);
    }
  }, [searchCriteria]);

  const fetchFlightDetails = async () => {
    try {
      const response = await flightsAPI.getById(flightId);
      setFlight(response.data.flight);
    } catch (error) {
      console.error('Error fetching flight details:', error);
      toast.error('Error loading flight details');
      navigate('/flights/search');
    } finally {
      setIsLoading(false);
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

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    return `${duration.hours}h ${duration.minutes}m`;
  };

  const getClassPrice = (className) => {
    return flight?.pricing[className]?.price || 0;
  };

  const getAvailableSeats = (className) => {
    return flight?.pricing[className]?.availableSeats || 0;
  };

  const handleBookNow = () => {
    if (!isAuthenticated()) {
      toast.error('Please login to book flights');
      navigate('/login', { state: { from: location } });
      return;
    }

    const requiredSeats = searchCriteria.passengers || 1;
    const availableSeats = getAvailableSeats(selectedClass);

    if (availableSeats < requiredSeats) {
      toast.error(`Not enough seats available in ${selectedClass} class`);
      return;
    }

    navigate(`/flights/${flightId}/seats`, {
      state: { 
        searchCriteria: {
          ...searchCriteria,
          class: selectedClass
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">Loading flight details...</p>
        </div>
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Flight not found</p>
        <button onClick={() => navigate('/flights/search')} className="btn-primary mt-4">
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Flight Header */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="bg-primary-100 p-4 rounded-lg">
              <FiNavigation className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{flight.airline.name}</h1>
              <p className="text-gray-600">{flight.flightNumber} • {flight.aircraft.model}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 text-yellow-500 mb-2">
              <FiStar className="w-5 h-5 fill-current" />
              <FiStar className="w-5 h-5 fill-current" />
              <FiStar className="w-5 h-5 fill-current" />
              <FiStar className="w-5 h-5 fill-current" />
              <FiStar className="w-5 h-5" />
              <span className="text-gray-600 ml-2">4.2</span>
            </div>
            <p className="text-sm text-gray-600">Based on 1,234 reviews</p>
          </div>
        </div>

        {/* Route Information */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Departure */}
          <div className="text-center lg:text-left">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {formatTime(flight.route.departure.time)}
            </div>
            <div className="text-xl font-semibold text-gray-700 mb-1">
              {flight.route.departure.airport.code}
            </div>
            <div className="text-gray-600 mb-1">
              {flight.route.departure.airport.name}
            </div>
            <div className="text-gray-600 mb-2">
              {flight.route.departure.airport.city}, {flight.route.departure.airport.country}
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(flight.route.departure.time)}
            </div>
            {flight.route.departure.terminal && (
              <div className="text-sm text-gray-500">
                Terminal {flight.route.departure.terminal}
              </div>
            )}
          </div>

          {/* Flight Path */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="h-px bg-gray-300 flex-1"></div>
              <div className="mx-4 bg-primary-100 p-3 rounded-full">
                <FiNavigation className="w-6 h-6 text-primary-600" />
              </div>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>
            <div className="text-lg font-semibold text-gray-700 mb-1">
              {formatDuration(flight.duration)}
            </div>
            <div className="text-green-600 font-medium">Non-stop</div>
          </div>

          {/* Arrival */}
          <div className="text-center lg:text-right">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {formatTime(flight.route.arrival.time)}
            </div>
            <div className="text-xl font-semibold text-gray-700 mb-1">
              {flight.route.arrival.airport.code}
            </div>
            <div className="text-gray-600 mb-1">
              {flight.route.arrival.airport.name}
            </div>
            <div className="text-gray-600 mb-2">
              {flight.route.arrival.airport.city}, {flight.route.arrival.airport.country}
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(flight.route.arrival.time)}
            </div>
            {flight.route.arrival.terminal && (
              <div className="text-sm text-gray-500">
                Terminal {flight.route.arrival.terminal}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Aircraft Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Aircraft Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Aircraft Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Model:</span>
                    <span className="font-medium">{flight.aircraft.model || 'Boeing 737-800'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Seats:</span>
                    <span className="font-medium">{flight.aircraft.totalSeats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Seat Layout:</span>
                    <span className="font-medium">{flight.seatMap.layout}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Amenities</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FiWifi className="w-4 h-4 text-primary-600" />
                    <span className="text-sm">Free Wi-Fi</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiTv className="w-4 h-4 text-primary-600" />
                    <span className="text-sm">In-flight Entertainment</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiUsers className="w-4 h-4 text-primary-600" />
                    <span className="text-sm">Meal Service</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fare Options */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Choose Your Fare</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Economy */}
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedClass === 'economy' 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedClass('economy')}
              >
                <div className="text-center">
                  <h3 className="font-semibold text-gray-900 mb-2">Economy</h3>
                  <div className="text-2xl font-bold text-primary-600 mb-2">
                    ${getClassPrice('economy')}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {getAvailableSeats('economy')} seats available
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• Standard seat</li>
                    <li>• 1 carry-on bag</li>
                    <li>• Basic meal</li>
                    <li>• Standard check-in</li>
                  </ul>
                </div>
              </div>

              {/* Business */}
              {flight.pricing.business?.price > 0 && (
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedClass === 'business' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedClass('business')}
                >
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 mb-2">Business</h3>
                    <div className="text-2xl font-bold text-primary-600 mb-2">
                      ${getClassPrice('business')}
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      {getAvailableSeats('business')} seats available
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Extra legroom</li>
                      <li>• 2 carry-on bags</li>
                      <li>• Premium meal</li>
                      <li>• Priority check-in</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* First Class */}
              {flight.pricing.firstClass?.price > 0 && (
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedClass === 'first' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedClass('first')}
                >
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-900 mb-2">First Class</h3>
                    <div className="text-2xl font-bold text-primary-600 mb-2">
                      ${getClassPrice('first')}
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      {getAvailableSeats('first')} seats available
                    </div>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Luxury seating</li>
                      <li>• Unlimited baggage</li>
                      <li>• Gourmet dining</li>
                      <li>• Concierge service</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Important Information */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Important Information</h2>
            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Check-in Information</h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• Online check-in opens 24 hours before departure</li>
                  <li>• Airport check-in counter opens 3 hours before departure</li>
                  <li>• Recommended arrival: 2 hours for domestic, 3 hours for international</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Baggage Policy</h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• Carry-on: 1 bag up to 7kg (Economy), 2 bags up to 14kg (Business/First)</li>
                  <li>• Checked baggage: 1 bag up to 23kg included</li>
                  <li>• Excess baggage charges apply for additional weight</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Cancellation Policy</h3>
                <ul className="space-y-1 text-gray-600">
                  <li>• Free cancellation up to 24 hours before departure</li>
                  <li>• Cancellation fee applies for last-minute changes</li>
                  <li>• Refund processing time: 7-10 business days</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
            <h3 className="text-lg font-semibold mb-4">Book This Flight</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Selected Class:</span>
                <span className="font-medium capitalize">{selectedClass}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Price per person:</span>
                <span className="text-xl font-bold text-primary-600">
                  ${getClassPrice(selectedClass)}
                </span>
              </div>
              
              {searchCriteria.passengers && searchCriteria.passengers > 1 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">
                    Total ({searchCriteria.passengers} passengers):
                  </span>
                  <span className="text-xl font-bold text-primary-600">
                    ${getClassPrice(selectedClass) * searchCriteria.passengers}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Available seats:</span>
                <span className="font-medium">
                  {getAvailableSeats(selectedClass)} left
                </span>
              </div>
              
              <div className="border-t pt-4">
                <button
                  onClick={handleBookNow}
                  disabled={getAvailableSeats(selectedClass) < (searchCriteria.passengers || 1)}
                  className="btn-primary w-full py-3 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Select Seats</span>
                  <FiArrowRight className="w-4 h-4" />
                </button>
                
                {getAvailableSeats(selectedClass) < (searchCriteria.passengers || 1) && (
                  <p className="text-xs text-red-500 mt-2 text-center">
                    Not enough seats available for your group
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/flights/search')}
                className="btn-secondary w-full py-2"
              >
                Back to Search
              </button>
              <button className="btn-secondary w-full py-2">
                Compare Prices
              </button>
              <button className="btn-secondary w-full py-2">
                Share Flight
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightDetails;