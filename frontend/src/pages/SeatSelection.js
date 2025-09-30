import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiArrowRight, FiClock, FiMapPin, FiNavigation, FiUser } from 'react-icons/fi';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingsAPI, flightsAPI } from '../utils/api';

const SeatSelection = () => {
  const { flightId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [flight, setFlight] = useState(null);
  const [seatMap, setSeatMap] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengers, setPassengers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  const searchCriteria = location.state?.searchCriteria || {};
  const requiredPassengers = searchCriteria.passengers || 1;

  const fetchFlightAndSeats = useCallback(async () => {
    try {
      const [flightResponse, seatResponse] = await Promise.all([
        flightsAPI.getById(flightId),
        flightsAPI.getSeatMap(flightId)
      ]);

      setFlight(flightResponse.data.flight);
      setSeatMap(seatResponse.data.seatMap);
    } catch (error) {
      console.error('Error fetching flight data:', error);
      toast.error('Error loading flight information');
      navigate('/flights/search');
    } finally {
      setIsLoading(false);
    }
  }, [flightId, navigate]);

  const initializePassengers = useCallback(() => {
    const passengerList = Array.from({ length: requiredPassengers }, (_, index) => ({
      title: 'Mr',
      firstName: index === 0 ? user?.username || '' : '',
      lastName: '',
      dateOfBirth: '',
      gender: 'male',
      nationality: 'US',
      passportNumber: '',
      mealPreference: 'none'
    }));
    setPassengers(passengerList);
  }, [requiredPassengers, user?.username]);

  useEffect(() => {
    fetchFlightAndSeats();
    initializePassengers();
  }, [flightId, fetchFlightAndSeats, initializePassengers]);

  const getSeatIcon = (seat) => {
    if (!seat.isAvailable) return '✗';
    if (selectedSeats.includes(seat.seatNumber)) {
      const index = selectedSeats.indexOf(seat.seatNumber);
      return index + 1;
    }
    return seat.seatNumber.slice(-1);
  };

  const handleSeatClick = (seatNumber) => {
    const seat = getSeatDetails(seatNumber);
    
    if (!seat || seat.status !== 'available') {
      toast.error('This seat is not available');
      return;
    }

    const isSelected = selectedSeats.includes(seatNumber);

    if (isSelected) {
      // Deselect seat
      setSelectedSeats(prev => prev.filter(s => s !== seatNumber));
    } else {
      // Select seat
      if (selectedSeats.length >= requiredPassengers) {
        toast.error(`You can only select ${requiredPassengers} seat${requiredPassengers > 1 ? 's' : ''}`);
        return;
      }
      setSelectedSeats(prev => [...prev, seatNumber]);
    }
  };

  const getSeatDetails = (seatNumber) => {
    if (!seatMap) return null;
    
    for (const section of seatMap.sections) {
      for (const row of section.rows) {
        const seat = row.seats.find(s => s.number === seatNumber);
        if (seat) {
          return {
            ...seat,
            section: section.class,
            price: section.pricing
          };
        }
      }
    }
    return null;
  };

  const getSeatClass = (seatNumber) => {
    const isSelected = selectedSeats.includes(seatNumber);
    const seat = getSeatDetails(seatNumber);
    
    if (!seat) return 'seat seat-blocked';
    
    if (isSelected) return 'seat seat-selected';
    
    switch (seat.status) {
      case 'available':
        return 'seat seat-available';
      case 'occupied':
        return 'seat seat-occupied';
      case 'blocked':
      default:
        return 'seat seat-blocked';
    }
  };

  // const calculateTotal = () => {
  //   let total = 0;
  //   selectedSeats.forEach(seatNumber => {
  //     const seat = getSeatDetails(seatNumber);
  //     if (seat) {
  //       total += seat.price || flight?.pricing?.[searchCriteria.class] || 0;
  //     }
  //   });
  //   return total;
  // };

  // const isReadyToProceed = () => {
  //   return selectedSeats.length === requiredPassengers && 
  //          passengers.every(p => p.firstName && p.lastName && p.gender && p.dateOfBirth);
  // };

  const getSeatPrice = (seat) => {
    return seat.price || flight?.pricing[seat.class]?.price || 0;
  };

  const getTotalPrice = () => {
    if (!seatMap || selectedSeats.length === 0) return 0;
    
    return selectedSeats.reduce((total, seatNumber) => {
      const seat = seatMap.seats.find(s => s.seatNumber === seatNumber);
      return total + getSeatPrice(seat);
    }, 0);
  };

  const handlePassengerChange = (index, field, value) => {
    setPassengers(prev => prev.map((passenger, i) => 
      i === index ? { ...passenger, [field]: value } : passenger
    ));
  };

  const validatePassengerInfo = () => {
    for (let i = 0; i < requiredPassengers; i++) {
      const passenger = passengers[i];
      if (!passenger.firstName || !passenger.lastName || !passenger.dateOfBirth) {
        toast.error(`Please fill in all required information for passenger ${i + 1}`);
        return false;
      }
    }
    return true;
  };

  const handleBooking = async () => {
    if (selectedSeats.length !== requiredPassengers) {
      toast.error(`Please select ${requiredPassengers} seat${requiredPassengers > 1 ? 's' : ''}`);
      return;
    }

    if (!validatePassengerInfo()) {
      return;
    }

    setIsBooking(true);

    try {
      const bookingData = {
        flightId,
        passengers: passengers.slice(0, requiredPassengers).map((passenger, index) => ({
          ...passenger,
          seatNumber: selectedSeats[index]
        })),
        contactDetails: {
          email: user.email,
          phone: user.profile?.phone || '',
          emergencyContact: {
            name: '',
            phone: '',
            relation: ''
          }
        },
        selectedSeats,
        specialServices: []
      };

      const response = await bookingsAPI.create(bookingData);
      
      if (response.data.success) {
        toast.success('Booking confirmed successfully!');
        navigate('/booking/confirmation', {
          state: {
            booking: response.data.booking,
            paymentStatus: 'success'
          }
        });
      }
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const renderSeatMap = () => {
    if (!seatMap) return null;

    const rows = {};
    seatMap.seats.forEach(seat => {
      const row = seat.position.row;
      if (!rows[row]) rows[row] = [];
      rows[row].push(seat);
    });

    const sortedRows = Object.keys(rows).sort((a, b) => parseInt(a) - parseInt(b));

    return (
      <div className="bg-white rounded-xl p-6 shadow-lg">
        <div className="text-center mb-6">
          <div className="bg-gray-800 text-white py-2 px-8 rounded-t-2xl inline-block">
            <FiNavigation className="inline mr-2" />
            Cockpit
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {sortedRows.map(rowNum => {
            const rowSeats = rows[rowNum].sort((a, b) => 
              a.position.column.localeCompare(b.position.column)
            );

            return (
              <div key={rowNum} className="flex items-center justify-center space-x-1">
                <div className="w-8 text-center text-sm font-medium text-gray-600">
                  {rowNum}
                </div>
                
                {rowSeats.map((seat, index) => {
                  const isAisle = seatMap.layout === '3-3' && index === 2;
                  
                  return (
                    <React.Fragment key={seat.seatNumber}>
                      <button
                        onClick={() => handleSeatClick(seat)}
                        className={`seat ${getSeatClass(seat)} relative group`}
                        disabled={!seat.isAvailable || seat.isBlocked}
                        title={`${seat.seatNumber} - ${seat.class} - $${getSeatPrice(seat)}`}
                      >
                        {getSeatIcon(seat)}
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                          <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                            {seat.seatNumber} • {seat.class} • ${getSeatPrice(seat)}
                            {seat.features.length > 0 && (
                              <div className="text-gray-300">
                                {seat.features.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                      
                      {isAisle && <div className="w-4"></div>}
                    </React.Fragment>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="seat seat-available">A</div>
            <span>Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="seat seat-selected">1</div>
            <span>Selected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="seat seat-occupied">✗</div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="seat seat-blocked">✗</div>
            <span>Blocked</span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">Loading seat map...</p>
        </div>
      </div>
    );
  }

  if (!flight || !seatMap) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Flight information not available</p>
        <button onClick={() => navigate('/flights/search')} className="btn-primary mt-4">
          Back to Search
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Flight Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4 mb-4 lg:mb-0">
            <div className="bg-primary-100 p-3 rounded-lg">
              <FiNavigation className="w-8 h-8 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {flight.airline.name} - {flight.flightNumber}
              </h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <div className="flex items-center space-x-1">
                  <FiMapPin className="w-4 h-4" />
                  <span>{flight.route.departure.airport.code} → {flight.route.arrival.airport.code}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FiClock className="w-4 h-4" />
                  <span>
                    {new Date(flight.route.departure.time).toLocaleDateString()} • 
                    {new Date(flight.route.departure.time).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">
              Total: ${getTotalPrice()}
            </div>
            <div className="text-sm text-gray-600">
              {selectedSeats.length} of {requiredPassengers} seats selected
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Seat Map */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Select Your Seats</h2>
          {renderSeatMap()}
        </div>

        {/* Passenger Information */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Passenger Information</h3>
            
            {passengers.slice(0, requiredPassengers).map((passenger, index) => (
              <div key={index} className="mb-6 last:mb-0">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <FiUser className="mr-2" />
                  Passenger {index + 1}
                  {selectedSeats[index] && (
                    <span className="ml-2 bg-primary-100 text-primary-800 px-2 py-1 rounded text-xs">
                      Seat {selectedSeats[index]}
                    </span>
                  )}
                </h4>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <select
                        value={passenger.title}
                        onChange={(e) => handlePassengerChange(index, 'title', e.target.value)}
                        className="input-field text-sm"
                      >
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Ms">Ms</option>
                        <option value="Dr">Dr</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <select
                        value={passenger.gender}
                        onChange={(e) => handlePassengerChange(index, 'gender', e.target.value)}
                        className="input-field text-sm"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={passenger.firstName}
                      onChange={(e) => handlePassengerChange(index, 'firstName', e.target.value)}
                      className="input-field text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={passenger.lastName}
                      onChange={(e) => handlePassengerChange(index, 'lastName', e.target.value)}
                      className="input-field text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={passenger.dateOfBirth}
                      onChange={(e) => handlePassengerChange(index, 'dateOfBirth', e.target.value)}
                      className="input-field text-sm"
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Meal Preference
                    </label>
                    <select
                      value={passenger.mealPreference}
                      onChange={(e) => handlePassengerChange(index, 'mealPreference', e.target.value)}
                      className="input-field text-sm"
                    >
                      <option value="none">No preference</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="non-vegetarian">Non-vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="kosher">Kosher</option>
                      <option value="halal">Halal</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Booking Summary */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Price ({requiredPassengers} × ${flight.pricing[searchCriteria.class || 'economy']?.price || 0})</span>
                <span className="font-medium">${(flight.pricing[searchCriteria.class || 'economy']?.price || 0) * requiredPassengers}</span>
              </div>
              
              {selectedSeats.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Seat Selection</span>
                  <span className="font-medium">${getTotalPrice() - (flight.pricing[searchCriteria.class || 'economy']?.price || 0) * requiredPassengers}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">Taxes & Fees</span>
                <span className="font-medium">${Math.round((getTotalPrice() || (flight.pricing[searchCriteria.class || 'economy']?.price || 0) * requiredPassengers) * 0.1) + 25}</span>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="text-primary-600">
                    ${getTotalPrice() + Math.round((getTotalPrice() || (flight.pricing[searchCriteria.class || 'economy']?.price || 0) * requiredPassengers) * 0.1) + 25}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleBooking}
              disabled={selectedSeats.length !== requiredPassengers || isBooking}
              className="btn-primary w-full py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBooking ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="spinner"></div>
                  <span>Processing Payment...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Proceed to Payment</span>
                  <FiArrowRight className="w-5 h-5" />
                </div>
              )}
            </button>
            
            <button
              onClick={() => navigate(-1)}
              className="btn-secondary w-full py-3 flex items-center justify-center space-x-2"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span>Back to Flight Details</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;