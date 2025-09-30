const express = require('express');
const Flight = require('../models/Flight');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Admin Dashboard Stats
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    // Get comprehensive stats
    const [totalFlights, totalUsers, totalBookings, totalRevenue] = await Promise.all([
      Flight.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'user', isActive: true }),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { bookingStatus: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
      ])
    ]);
    
    // Get monthly stats (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const [monthlyUsers, monthlyBookings, monthlyRevenue] = await Promise.all([
      User.countDocuments({ 
        role: 'user', 
        createdAt: { $gte: sixMonthsAgo } 
      }),
      Booking.countDocuments({ 
        createdAt: { $gte: sixMonthsAgo } 
      }),
      Booking.aggregate([
        { 
          $match: { 
            bookingStatus: 'confirmed',
            createdAt: { $gte: sixMonthsAgo }
          } 
        },
        { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
      ])
    ]);

    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate('user', 'username email')
      .populate('flight', 'flightNumber airline route')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent users
    const recentUsers = await User.find({ role: 'user' })
      .select('username email profile createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get booking stats by status
    const bookingStats = await Booking.aggregate([
      {
        $group: {
          _id: '$bookingStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const monthlyBookings = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get top routes
    const topRoutes = await Booking.aggregate([
      { $match: { bookingStatus: 'confirmed' } },
      {
        $lookup: {
          from: 'flights',
          localField: 'flight',
          foreignField: '_id',
          as: 'flightInfo'
        }
      },
      { $unwind: '$flightInfo' },
      {
        $group: {
          _id: {
            from: '$flightInfo.route.departure.airport.code',
            to: '$flightInfo.route.arrival.airport.code',
            fromCity: '$flightInfo.route.departure.airport.city',
            toCity: '$flightInfo.route.arrival.airport.city'
          },
          bookings: { $sum: 1 },
          revenue: { $sum: '$pricing.totalAmount' }
        }
      },
      { $sort: { bookings: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      dashboard: {
        stats: {
          flights: {
            total: totalFlights,
            active: totalFlights
          },
          users: {
            total: totalUsers,
            thisMonth: monthlyUsers
          },
          bookings: {
            total: totalBookings,
            thisMonth: monthlyBookings
          },
          revenue: {
            total: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
            thisMonth: monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0
          }
        },
        recentBookings,
        recentUsers,
        bookingStats,
        topRoutes
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
});

// Get all flights with pagination
router.get('/flights', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { flightNumber: new RegExp(search, 'i') },
        { 'airline.name': new RegExp(search, 'i') },
        { 'route.departure.airport.code': new RegExp(search, 'i') },
        { 'route.arrival.airport.code': new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const flights = await Flight.find(query)
      .sort({ 'route.departure.time': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalFlights = await Flight.countDocuments(query);

    res.json({
      success: true,
      flights,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalFlights / parseInt(limit)),
        totalFlights
      }
    });

  } catch (error) {
    console.error('Admin flights error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching flights'
    });
  }
});

// Create new flight
router.post('/flights', adminAuth, async (req, res) => {
  try {
    const flightData = req.body;
    
    // Validate required fields
    if (!flightData.flightNumber || !flightData.route || !flightData.pricing) {
      return res.status(400).json({
        success: false,
        message: 'Missing required flight information'
      });
    }

    // Check for duplicate flight number
    const existingFlight = await Flight.findOne({ 
      flightNumber: flightData.flightNumber.toUpperCase() 
    });

    if (existingFlight) {
      return res.status(400).json({
        success: false,
        message: 'Flight number already exists'
      });
    }

    // Generate seat map if not provided
    if (!flightData.seatMap || !flightData.seatMap.seats) {
      flightData.seatMap = generateSeatMap(
        flightData.seatMap?.layout || '3-3',
        flightData.seatMap?.rows || 20,
        flightData.pricing
      );
    }

    const flight = new Flight(flightData);
    await flight.save();

    res.status(201).json({
      success: true,
      message: 'Flight created successfully',
      flight
    });

  } catch (error) {
    console.error('Flight creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating flight'
    });
  }
});

// Update flight
router.put('/flights/:flightId', adminAuth, async (req, res) => {
  try {
    const flight = await Flight.findByIdAndUpdate(
      req.params.flightId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }

    res.json({
      success: true,
      message: 'Flight updated successfully',
      flight
    });

  } catch (error) {
    console.error('Flight update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating flight'
    });
  }
});

// Delete flight
router.delete('/flights/:flightId', adminAuth, async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.flightId);

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }

    // Check if flight has bookings
    const bookingCount = await Booking.countDocuments({ 
      flight: req.params.flightId,
      bookingStatus: { $in: ['confirmed', 'pending'] }
    });

    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete flight with active bookings'
      });
    }

    flight.isActive = false;
    await flight.save();

    res.json({
      success: true,
      message: 'Flight deactivated successfully'
    });

  } catch (error) {
    console.error('Flight deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting flight'
    });
  }
});

// Get all bookings with pagination
router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    const query = {};
    if (status) query.bookingStatus = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let bookings = await Booking.find(query)
      .populate('user', 'username email')
      .populate('flight', 'flightNumber airline route')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Apply search filter after population if needed
    if (search) {
      const searchTerm = search.toLowerCase();
      bookings = bookings.filter(booking => 
        booking.bookingId.toLowerCase().includes(searchTerm) ||
        booking.bookingReference.pnr.toLowerCase().includes(searchTerm) ||
        booking.user.username.toLowerCase().includes(searchTerm) ||
        booking.user.email.toLowerCase().includes(searchTerm) ||
        booking.flight.flightNumber.toLowerCase().includes(searchTerm)
      );
    }

    const totalBookings = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalBookings / parseInt(limit)),
        totalBookings
      }
    });

  } catch (error) {
    console.error('Admin bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings'
    });
  }
});

// Get all users with pagination
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const query = { role: 'user' };
    if (search) {
      query.$or = [
        { username: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalUsers = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / parseInt(limit)),
        totalUsers
      }
    });

  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
});

// Toggle user active status
router.put('/users/:userId/toggle-status', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify admin user'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('User status toggle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status'
    });
  }
});

// Helper function to generate seat map
function generateSeatMap(layout, rows, pricing) {
  const seats = [];
  const columns = layout === '3-3' ? ['A', 'B', 'C', 'D', 'E', 'F'] :
                  layout === '3-4-3' ? ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'] :
                  layout === '2-4-2' ? ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] :
                  ['A', 'B', 'C', 'D', 'E', 'F', 'G']; // 2-3-2

  for (let row = 1; row <= rows; row++) {
    columns.forEach((col, index) => {
      let seatClass = 'economy';
      let seatPrice = pricing.economy.price;
      let features = [];

      // Assign classes based on row
      if (row <= 3) {
        seatClass = 'first';
        seatPrice = pricing.firstClass?.price || pricing.economy.price * 3;
      } else if (row <= 8) {
        seatClass = 'business';
        seatPrice = pricing.business?.price || pricing.economy.price * 2;
      }

      // Add features
      if (index === 0 || index === columns.length - 1) {
        features.push('window');
      }
      if (layout === '3-3' && (index === 2 || index === 3)) {
        features.push('aisle');
      }
      if (row === 1 || (row > 1 && row <= 3)) {
        features.push('extra-legroom');
      }

      seats.push({
        seatNumber: `${row}${col}`,
        class: seatClass,
        isAvailable: true,
        isBlocked: false,
        price: seatPrice,
        position: { row, column: col },
        features
      });
    });
  }

  return {
    layout,
    rows,
    seats
  };
}

module.exports = router;