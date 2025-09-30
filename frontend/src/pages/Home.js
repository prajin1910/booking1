import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiArrowRight, FiCalendar, FiClock, FiMap, FiMapPin, FiSearch, FiStar, FiUsers } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { flightsAPI } from '../utils/api';

const Home = () => {
  const navigate = useNavigate();
  const [searchForm, setSearchForm] = useState({
    from: '',
    to: '',
    departureDate: '',
    returnDate: '',
    passengers: 1,
    class: 'economy'
  });
  const [popularDestinations, setPopularDestinations] = useState([]);

  useEffect(() => {
    fetchPopularDestinations();
  }, []);

  const fetchPopularDestinations = async () => {
    try {
      const response = await flightsAPI.getPopularDestinations();
      setPopularDestinations(response.data.destinations.slice(0, 6));
    } catch (error) {
      console.error('Error fetching popular destinations:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!searchForm.from || !searchForm.to || !searchForm.departureDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (searchForm.from === searchForm.to) {
      toast.error('Departure and arrival cities must be different');
      return;
    }

    // Build search params
    const searchParams = new URLSearchParams({
      from: searchForm.from,
      to: searchForm.to,
      departureDate: searchForm.departureDate,
      passengers: searchForm.passengers,
      class: searchForm.class
    });

    if (searchForm.returnDate) {
      searchParams.append('returnDate', searchForm.returnDate);
    }

    // Navigate to search results
    navigate(`/flights/search?${searchParams.toString()}`);
  };

  const cities = [
    { code: 'JFK', name: 'New York' },
    { code: 'LAX', name: 'Los Angeles' },
    { code: 'ORD', name: 'Chicago' },
    { code: 'MIA', name: 'Miami' },
    { code: 'SFO', name: 'San Francisco' },
    { code: 'SEA', name: 'Seattle' },
    { code: 'BOS', name: 'Boston' },
    { code: 'DEN', name: 'Denver' },
    { code: 'ATL', name: 'Atlanta' },
    { code: 'DFW', name: 'Dallas' },
    { code: 'PHX', name: 'Phoenix' },
    { code: 'LAS', name: 'Las Vegas' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Find Your Perfect Flight
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Book flights to anywhere in the world with our easy-to-use platform. 
              Compare prices, choose your seats, and fly with confidence.
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-4xl mx-auto mt-12">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <form onSubmit={handleSearch} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* From */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <FiMapPin className="mr-2 text-blue-500" />
                      From
                    </label>
                    <select
                      name="from"
                      value={searchForm.from}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    >
                      <option value="">Select departure city</option>
                      {cities.map(city => (
                        <option key={city.code} value={city.name}>{city.name} ({city.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* To */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <FiMap className="mr-2 text-blue-500" />
                      To
                    </label>
                    <select
                      name="to"
                      value={searchForm.to}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    >
                      <option value="">Select destination</option>
                      {cities.map(city => (
                        <option key={city.code} value={city.name}>{city.name} ({city.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* Departure Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <FiCalendar className="mr-2 text-blue-500" />
                      Departure
                    </label>
                    <input
                      type="date"
                      name="departureDate"
                      value={searchForm.departureDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="input-field"
                      required
                    />
                  </div>

                  {/* Return Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <FiCalendar className="mr-2 text-blue-500" />
                      Return (Optional)
                    </label>
                    <input
                      type="date"
                      name="returnDate"
                      value={searchForm.returnDate}
                      onChange={handleInputChange}
                      min={searchForm.departureDate || new Date().toISOString().split('T')[0]}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Passengers */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <FiUsers className="mr-2 text-blue-500" />
                      Passengers
                    </label>
                    <select
                      name="passengers"
                      value={searchForm.passengers}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <option key={num} value={num}>{num} Passenger{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>

                  {/* Class */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Travel Class</label>
                    <select
                      name="class"
                      value={searchForm.class}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="economy">Economy</option>
                      <option value="premium">Premium Economy</option>
                      <option value="business">Business</option>
                      <option value="first">First Class</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary px-8 py-3 text-lg font-semibold flex items-center space-x-2 w-full md:w-auto mx-auto"
                >
                  <FiSearch className="text-xl" />
                  <span>Search Flights</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Destinations */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Popular Destinations</h2>
            <p className="text-xl text-gray-600">Discover amazing places around the world</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                city: 'Paris',
                country: 'France',
                price: 'From $599',
                image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                description: 'City of Light and Love'
              },
              {
                city: 'Tokyo',
                country: 'Japan',
                price: 'From $899',
                image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                description: 'Modern meets traditional'
              },
              {
                city: 'New York',
                country: 'USA',
                price: 'From $399',
                image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                description: 'The city that never sleeps'
              },
              {
                city: 'London',
                country: 'UK',
                price: 'From $549',
                image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                description: 'Rich history and culture'
              },
              {
                city: 'Dubai',
                country: 'UAE',
                price: 'From $799',
                image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                description: 'Luxury and innovation'
              },
              {
                city: 'Sydney',
                country: 'Australia',
                price: 'From $1199',
                image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
                description: 'Harbor city beauty'
              }
            ].map((destination, index) => (
              <div key={index} className="group cursor-pointer transform transition-all duration-300 hover:scale-105">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={destination.image}
                      alt={destination.city}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="text-xl font-bold">{destination.city}</h3>
                      <p className="text-sm opacity-90">{destination.country}</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 mb-2">{destination.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-600">{destination.price}</span>
                      <FiArrowRight className="text-blue-600 group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose FlightBooker?</h2>
            <p className="text-xl text-gray-600">Experience the best in flight booking</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                <FiSearch className="text-2xl text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Easy Search</h3>
              <p className="text-gray-600">Find flights quickly with our advanced search filters and real-time results.</p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
                <FiStar className="text-2xl text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Best Prices</h3>
              <p className="text-gray-600">We guarantee the best prices with our price-match promise and exclusive deals.</p>
            </div>

            <div className="text-center p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
                <FiClock className="text-2xl text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">24/7 Support</h3>
              <p className="text-gray-600">Our customer service team is available around the clock to assist you.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join millions of travelers who trust us for their flight bookings
          </p>
          <Link
            to="/register"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transform hover:scale-105 transition-all duration-300 shadow-lg"
          >
            Get Started Today
            <FiArrowRight className="ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;