const express = require('express');
const Flight = require('../models/Flight');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Search flights
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const {
      from,
      to,
      departureDate,
      returnDate,
      passengers = 1,
      class: travelClass = 'economy',
      page = 1,
      limit = 10
    } = req.query;

    console.log('Search params:', { from, to, departureDate, passengers, travelClass });

    // Build search query
    const searchQuery = {
      isActive: true,
      status: { $in: ['scheduled', 'boarding'] }
    };

    if (from) {
      searchQuery.$or = [
        { 'route.departure.airport.code': new RegExp(from, 'i') },
        { 'route.departure.airport.city': new RegExp(from, 'i') }
      ];
    }

    if (to) {
      if (!searchQuery.$or) searchQuery.$or = [];
      const arrivalQuery = [
        { 'route.arrival.airport.code': new RegExp(to, 'i') },
        { 'route.arrival.airport.city': new RegExp(to, 'i') }
      ];
      
      if (searchQuery.$or.length > 0) {
        searchQuery.$and = [
          { $or: searchQuery.$or },
          { $or: arrivalQuery }
        ];
        delete searchQuery.$or;
      } else {
        searchQuery.$or = arrivalQuery;
      }
    }

    if (departureDate) {
      const startDate = new Date(departureDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      searchQuery['route.departure.time'] = {
        $gte: startDate,
        $lt: endDate
      };
    }

    // Ensure flights have available seats for the requested class
    if (travelClass && passengers) {
      const classField = `pricing.${travelClass}.availableSeats`;
      searchQuery[classField] = { $gte: parseInt(passengers) };
    }

    console.log('Final search query:', JSON.stringify(searchQuery, null, 2));

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const flights = await Flight.find(searchQuery)
      .sort({ 'route.departure.time': 1, 'pricing.economy.price': 1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log('Found flights:', flights.length);

    const totalFlights = await Flight.countDocuments(searchQuery);

    // Calculate flight duration for each flight
    const flightsWithDuration = flights.map(flight => {
      const departure = new Date(flight.route.departure.time);
      const arrival = new Date(flight.route.arrival.time);
      const durationMs = arrival - departure;
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return {
        ...flight.toObject(),
        duration: { hours, minutes }
      };
    });

    res.json({
      success: true,
      flights: flightsWithDuration,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalFlights / parseInt(limit)),
        totalFlights,
        hasNext: skip + flights.length < totalFlights,
        hasPrev: parseInt(page) > 1
      },
      searchCriteria: {
        from,
        to,
        departureDate,
        returnDate,
        passengers: parseInt(passengers),
        class: travelClass
      }
    });
  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching flights'
    });
  }
});

// Get all airports/cities for autocomplete
router.get('/airports', async (req, res) => {
  try {
    const { search } = req.query;
    
    // Get unique airports from flights
    const pipeline = [
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          departures: { $addToSet: '$route.departure.airport' },
          arrivals: { $addToSet: '$route.arrival.airport' }
        }
      }
    ];

    const result = await Flight.aggregate(pipeline);
    
    if (!result.length) {
      return res.json({
        success: true,
        airports: []
      });
    }

    // Combine and deduplicate airports
    const allAirports = [...result[0].departures, ...result[0].arrivals];
    const uniqueAirports = Array.from(
      new Map(allAirports.map(airport => [airport.code, airport])).values()
    );

    // Filter by search term if provided
    let filteredAirports = uniqueAirports;
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredAirports = uniqueAirports.filter(airport => 
        airport.code.toLowerCase().includes(searchTerm) ||
        airport.name.toLowerCase().includes(searchTerm) ||
        airport.city.toLowerCase().includes(searchTerm)
      );
    }

    res.json({
      success: true,
      airports: filteredAirports.slice(0, 50) // Limit results
    });
  } catch (error) {
    console.error('Airports fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching airports'
    });
  }
});

// Get flight details by ID
router.get('/:flightId', optionalAuth, async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.flightId);

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }

    if (!flight.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Flight is no longer available'
      });
    }

    // Calculate flight duration
    const departure = new Date(flight.route.departure.time);
    const arrival = new Date(flight.route.arrival.time);
    const durationMs = arrival - departure;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    const flightDetails = {
      ...flight.toObject(),
      duration: { hours, minutes }
    };

    res.json({
      success: true,
      flight: flightDetails
    });
  } catch (error) {
    console.error('Flight details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching flight details'
    });
  }
});

// Get seat map for a flight
router.get('/:flightId/seats', optionalAuth, async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.flightId);

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }

    if (!flight.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Flight is no longer available'
      });
    }

    // Return seat map with availability
    const seatMap = {
      layout: flight.seatMap.layout,
      rows: flight.seatMap.rows,
      seats: flight.seatMap.seats.map(seat => ({
        seatNumber: seat.seatNumber,
        class: seat.class,
        isAvailable: seat.isAvailable && !seat.isBlocked,
        price: seat.price,
        position: seat.position,
        features: seat.features
      }))
    };

    res.json({
      success: true,
      seatMap,
      flightNumber: flight.flightNumber,
      aircraft: flight.aircraft
    });
  } catch (error) {
    console.error('Seat map error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seat map'
    });
  }
});

// Get popular destinations
router.get('/destinations/popular', async (req, res) => {
  try {
    const pipeline = [
      { $match: { isActive: true, status: 'scheduled' } },
      {
        $group: {
          _id: '$route.arrival.airport',
          flightCount: { $sum: 1 },
          minPrice: { $min: '$pricing.economy.price' }
        }
      },
      { $sort: { flightCount: -1 } },
      { $limit: 10 }
    ];

    const popularDestinations = await Flight.aggregate(pipeline);

    res.json({
      success: true,
      destinations: popularDestinations.map(dest => ({
        airport: dest._id,
        flightCount: dest.flightCount,
        startingPrice: dest.minPrice
      }))
    });
  } catch (error) {
    console.error('Popular destinations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching popular destinations'
    });
  }
});

module.exports = router;