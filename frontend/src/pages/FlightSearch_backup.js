import { useEffect, useState } fro  const searchFlights = async (page = 1) => {
    if (!searchCriteria.from || !searchCriteria.to || !searchCriteria.departureDate) {
      toast.error('Missing search criteria. Please search again from home page.');
      navigate('/');
      return;
    }

    setLoading(true);
    try {
      const params = {
        ...searchCriteria,
        page,
        limit: 10,
        sortBy,
        ...filters
      };

      const response = await flightsAPI.search(params);
      
      if (response.data && response.data.flights) {
        setFlights(response.data.flights);
        setTotalPages(Math.ceil(response.data.total / 10));
        setCurrentPage(page);
        
        if (response.data.flights.length === 0) {
          toast.info('No flights found for your search criteria. Try adjusting your filters.');
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Search error:', error);
      
      // Show user-friendly error messages
      if (error.response?.status === 404) {
        toast.error('No flights found for this route. Please try different cities or dates.');
      } else if (error.response?.status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error('Unable to search flights. Please check your connection and try again.');
      }
      
      // Set sample data for demonstration if in development
      if (process.env.NODE_ENV === 'development') {
        setFlights(generateSampleFlights());
        setTotalPages(1);
        setCurrentPage(1);
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate sample flights for development/demo purposes
  const generateSampleFlights = () => {
    const airlines = ['SkyWings', 'AeroFly', 'CloudJet', 'SwiftAir', 'BlueWing'];
    const sampleFlights = [];
    
    for (let i = 0; i < 5; i++) {
      const basePrice = 200 + Math.random() * 800;
      const departureTime = new Date();
      departureTime.setHours(6 + Math.random() * 12);
      
      const arrivalTime = new Date(departureTime);
      arrivalTime.setHours(departureTime.getHours() + 2 + Math.random() * 6);
      
      sampleFlights.push({
        _id: `sample-${i}`,
        flightNumber: `${airlines[i % airlines.length].substring(0, 2).toUpperCase()}${100 + i}`,
        airline: {
          name: airlines[i % airlines.length],
          code: airlines[i % airlines.length].substring(0, 2).toUpperCase()
        },
        route: {
          departure: {
            airport: {
              code: searchCriteria.from,
              name: `${searchCriteria.from} International Airport`
            },
            time: departureTime.toISOString()
          },
          arrival: {
            airport: {
              code: searchCriteria.to,
              name: `${searchCriteria.to} International Airport`
            },
            time: arrivalTime.toISOString()
          }
        },
        duration: Math.floor((arrivalTime - departureTime) / (1000 * 60)),
        aircraft: {
          model: ['Boeing 737', 'Airbus A320', 'Boeing 777'][Math.floor(Math.random() * 3)]
        },
        pricing: {
          economy: Math.floor(basePrice),
          business: Math.floor(basePrice * 2.5),
          first: Math.floor(basePrice * 4)
        },
        availability: {
          economy: Math.floor(Math.random() * 50) + 10,
          business: Math.floor(Math.random() * 20) + 5,
          first: Math.floor(Math.random() * 10) + 2
        },
        status: 'active'
      });
    }
    
    return sampleFlights;
  };ast from 'react-hot-toast';
import { FiArrowRight, FiCalendar, FiFilter, FiMapPin, FiNavigation, FiUser } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { flightsAPI } from '../utils/api';

const FlightSearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    priceRange: [0, 2000],
    airlines: [],
    departureTime: 'all',
    stops: 'all'
  });
  const [sortBy, setSortBy] = useState('price');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const searchCriteria = {
    from: searchParams.get('from') || '',
    to: searchParams.get('to') || '',
    departureDate: searchParams.get('departureDate') || '',
    passengers: parseInt(searchParams.get('passengers')) || 1,
    class: searchParams.get('class') || 'economy'
  };

  useEffect(() => {
    searchFlights();
  }, [searchParams, currentPage, sortBy]);

  const searchFlights = async () => {
    setLoading(true);
    try {
      const params = {
        ...searchCriteria,
        page: currentPage,
        limit: 10,
        sortBy
      };

      const response = await flightsAPI.search(params);
      setFlights(response.data.flights);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error searching flights');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    return `${duration.hours}h ${duration.minutes}m`;
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
      month: 'short',
      day: 'numeric'
    });
  };

  const getClassPrice = (flight, travelClass) => {
    return flight.pricing[travelClass]?.price || flight.pricing.economy.price;
  };

  const getAvailableSeats = (flight, travelClass) => {
    return flight.pricing[travelClass]?.availableSeats || 0;
  };

  const handleFlightSelect = (flightId) => {
    navigate(`/flights/${flightId}`, {
      state: { searchCriteria }
    });
  };

  const FlightCard = ({ flight }) => {
    const price = getClassPrice(flight, searchCriteria.class);
    const availableSeats = getAvailableSeats(flight, searchCriteria.class);

    return (
      <div className="card-hover mb-4 transition-all duration-300 hover:shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          {/* Flight Info */}
          <div className="flex-1">
            <div className="flex items-center mb-4">
              <div className="bg-primary-100 p-2 rounded-lg mr-4">
                <FiNavigation className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {flight.airline.name}
                </h3>
                <p className="text-sm text-gray-600">{flight.flightNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Departure */}
              <div className="text-center md:text-left">
                <div className="text-2xl font-bold text-gray-900">
                  {formatTime(flight.route.departure.time)}
                </div>
                <div className="text-sm text-gray-600">
                  {flight.route.departure.airport.code}
                </div>
                <div className="text-xs text-gray-500">
                  {flight.route.departure.airport.city}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(flight.route.departure.time)}
                </div>
              </div>

              {/* Duration */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="h-px bg-gray-300 flex-1"></div>
                  <FiNavigation className="mx-2 text-primary-600" />
                  <div className="h-px bg-gray-300 flex-1"></div>
                </div>
                <div className="text-sm text-gray-600">
                  {formatDuration(flight.duration)}
                </div>
                <div className="text-xs text-green-600">Non-stop</div>
              </div>

              {/* Arrival */}
              <div className="text-center md:text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {formatTime(flight.route.arrival.time)}
                </div>
                <div className="text-sm text-gray-600">
                  {flight.route.arrival.airport.code}
                </div>
                <div className="text-xs text-gray-500">
                  {flight.route.arrival.airport.city}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(flight.route.arrival.time)}
                </div>
              </div>
            </div>
          </div>

          {/* Price and Book */}
          <div className="lg:ml-8 mt-4 lg:mt-0 flex flex-col items-center lg:items-end">
            <div className="text-center lg:text-right mb-4">
              <div className="text-3xl font-bold text-primary-600">
                ${price}
              </div>
              <div className="text-sm text-gray-600 capitalize">
                per person • {searchCriteria.class}
              </div>
              <div className="text-xs text-gray-500">
                {availableSeats} seats left
              </div>
            </div>

            <button
              onClick={() => handleFlightSelect(flight._id)}
              className="btn-primary w-full lg:w-auto px-6 py-3 flex items-center justify-center space-x-2"
              disabled={availableSeats < searchCriteria.passengers}
            >
              <span>Select Flight</span>
              <FiArrowRight className="w-4 h-4" />
            </button>

            {availableSeats < searchCriteria.passengers && (
              <p className="text-xs text-red-500 mt-1">
                Not enough seats available
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">Searching for flights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Search Summary */}
      <div className="bg-primary-50 rounded-xl p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex items-center space-x-6 mb-4 lg:mb-0">
            <div className="flex items-center space-x-2">
              <FiMapPin className="text-primary-600" />
              <span className="font-medium">
                {searchCriteria.from} → {searchCriteria.to}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <FiCalendar className="text-primary-600" />
              <span>{new Date(searchCriteria.departureDate).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <FiUser className="text-primary-600" />
              <span>{searchCriteria.passengers} passenger{searchCriteria.passengers > 1 ? 's' : ''}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="price">Sort by Price</option>
              <option value="duration">Sort by Duration</option>
              <option value="departure">Sort by Departure</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-80">
          <div className="card sticky top-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FiFilter className="mr-2" />
              Filters
            </h3>
            
            {/* Price Range */}
            <div className="mb-6">
              <h4 className="font-medium mb-2">Price Range</h4>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">$0</span>
                <div className="flex-1 h-2 bg-gray-200 rounded"></div>
                <span className="text-sm text-gray-600">$2000+</span>
              </div>
            </div>

            {/* Departure Time */}
            <div className="mb-6">
              <h4 className="font-medium mb-2">Departure Time</h4>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'Any time' },
                  { value: 'morning', label: 'Morning (6AM - 12PM)' },
                  { value: 'afternoon', label: 'Afternoon (12PM - 6PM)' },
                  { value: 'evening', label: 'Evening (6PM - 12AM)' },
                  { value: 'night', label: 'Night (12AM - 6AM)' }
                ].map(time => (
                  <label key={time.value} className="flex items-center">
                    <input
                      type="radio"
                      name="departureTime"
                      value={time.value}
                      checked={filters.departureTime === time.value}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        departureTime: e.target.value
                      }))}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm">{time.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Flight Results */}
        <div className="flex-1">
          {flights.length > 0 ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {flights.length} flight{flights.length > 1 ? 's' : ''} found
                </h2>
              </div>

              <div className="space-y-4">
                {flights.map(flight => (
                  <FlightCard key={flight._id} flight={flight} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          page === currentPage
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <FiNavigation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No flights found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search criteria or dates
              </p>
              <button
                onClick={() => navigate('/')}
                className="btn-primary"
              >
                New Search
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlightSearch;