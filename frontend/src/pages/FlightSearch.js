import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiArrowRight, FiCalendar, FiClock, FiFilter, FiMapPin, FiNavigation, FiUser } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { flightsAPI } from '../utils/api';

const FlightSearch = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters] = useState({
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

  const searchFlights = useCallback(async (page = 1) => {
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
      setFlights(generateSampleFlights());
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  }, [searchCriteria.from, searchCriteria.to, searchCriteria.departureDate, sortBy, filters, navigate]);

  useEffect(() => {
    if (searchCriteria.from && searchCriteria.to && searchCriteria.departureDate) {
      searchFlights();
    } else {
      toast.error('Missing search criteria. Please search again from home page.');
      navigate('/');
    }
  }, [searchCriteria.from, searchCriteria.to, searchCriteria.departureDate, sortBy, filters, navigate, searchFlights]);

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
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleFlightSelect = (flightId) => {
    navigate(`/flights/${flightId}?${searchParams.toString()}`);
  };

  const filteredAndSortedFlights = () => {
    let filtered = flights.filter(flight => {
      const price = flight.pricing[searchCriteria.class];
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // Sort flights
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.pricing[searchCriteria.class] - b.pricing[searchCriteria.class];
        case 'duration':
          return a.duration - b.duration;
        case 'departure':
          return new Date(a.route.departure.time) - new Date(b.route.departure.time);
        default:
          return 0;
      }
    });

    return filtered;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">Searching for the best flights...</p>
        </div>
      </div>
    );
  }

  const displayFlights = filteredAndSortedFlights();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Search Summary */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-6 mb-4 lg:mb-0">
            <div className="flex items-center text-lg font-semibold text-gray-900">
              <FiMapPin className="w-5 h-5 mr-2 text-primary-600" />
              {searchCriteria.from} → {searchCriteria.to}
            </div>
            <div className="flex items-center text-gray-600">
              <FiCalendar className="w-4 h-4 mr-2" />
              {formatDate(searchCriteria.departureDate)}
            </div>
            <div className="flex items-center text-gray-600">
              <FiUser className="w-4 h-4 mr-2" />
              {searchCriteria.passengers} passenger{searchCriteria.passengers > 1 ? 's' : ''}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="price">Sort by Price</option>
              <option value="duration">Sort by Duration</option>
              <option value="departure">Sort by Departure</option>
            </select>
            
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <FiFilter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {displayFlights.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <FiNavigation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No flights found</h3>
          <p className="text-gray-600 mb-6">
            We couldn't find any flights matching your criteria. Try adjusting your search or filters.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            New Search
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {displayFlights.map((flight) => (
            <div 
              key={flight._id} 
              className="flight-card hover-lift cursor-pointer"
              onClick={() => handleFlightSelect(flight._id)}
            >
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                {/* Flight Info */}
                <div className="lg:col-span-2">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <FiNavigation className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{flight.airline.name}</h3>
                      <p className="text-sm text-gray-600">{flight.flightNumber} • {flight.aircraft.model}</p>
                    </div>
                  </div>

                  {/* Route */}
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatTime(flight.route.departure.time)}
                      </div>
                      <div className="text-sm text-gray-600">{flight.route.departure.airport.code}</div>
                    </div>
                    
                    <div className="flex-1 flex items-center">
                      <div className="h-px bg-gray-300 flex-1"></div>
                      <div className="px-3 py-1 bg-gray-100 rounded-full">
                        <FiNavigation className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="h-px bg-gray-300 flex-1"></div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatTime(flight.route.arrival.time)}
                      </div>
                      <div className="text-sm text-gray-600">{flight.route.arrival.airport.code}</div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <FiClock className="w-4 h-4 mr-1" />
                      {formatDuration(flight.duration)}
                    </div>
                    <div className="text-green-600 font-medium">Direct</div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600">
                    ${flight.pricing[searchCriteria.class]}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    {searchCriteria.class} class
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {flight.availability[searchCriteria.class]} seats left
                  </div>
                </div>

                {/* Select Button */}
                <div className="text-center lg:text-right">
                  <button 
                    className="btn-primary w-full lg:w-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFlightSelect(flight._id);
                    }}
                  >
                    Select Flight
                    <FiArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => searchFlights(page)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  page === currentPage
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightSearch;