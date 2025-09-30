const express = require('express');
const Booking = require('../models/Booking');
const Flight = require('../models/Flight');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { sendBookingConfirmation, sendBookingCancellation } = require('../utils/emailService');

const router = express.Router();

// Create new booking
router.post('/create', auth, async (req, res) => {
  try {
    const {
      flightId,
      passengers,
      contactDetails,
      selectedSeats,
      specialServices = []
    } = req.body;

    // Validation
    if (!flightId || !passengers || !passengers.length || !contactDetails) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking information'
      });
    }

    // Get flight details
    const flight = await Flight.findById(flightId);
    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Flight not found'
      });
    }

    if (!flight.isActive || flight.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Flight is not available for booking'
      });
    }

    // Validate seat selection
    const selectedSeatNumbers = selectedSeats || passengers.map(p => p.seatNumber);
    
    for (let seatNumber of selectedSeatNumbers) {
      const seat = flight.seatMap.seats.find(s => s.seatNumber === seatNumber);
      if (!seat) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seatNumber} does not exist`
        });
      }
      if (!seat.isAvailable || seat.isBlocked) {
        return res.status(400).json({
          success: false,
          message: `Seat ${seatNumber} is not available`
        });
      }
    }

    // Calculate pricing
    let totalAmount = 0;
    let basePrice = 0;

    passengers.forEach((passenger, index) => {
      const seatNumber = selectedSeatNumbers[index];
      const seat = flight.seatMap.seats.find(s => s.seatNumber === seatNumber);
      const classPrice = flight.pricing[seat.class]?.price || flight.pricing.economy.price;
      
      basePrice += classPrice;
      totalAmount += seat.price || classPrice;
      
      // Add passenger seat info
      passenger.seatNumber = seatNumber;
      passenger.seatClass = seat.class;
    });

    // Add special services cost
    const servicesTotal = specialServices.reduce((sum, service) => sum + (service.price || 0), 0);
    totalAmount += servicesTotal;

    // Add taxes and fees (10% of base price)
    const taxes = Math.round(basePrice * 0.1);
    const fees = 25; // Fixed booking fee
    totalAmount += taxes + fees;

    // Create booking
    const booking = new Booking({
      user: req.user._id,
      flight: flightId,
      passengers,
      contactDetails,
      pricing: {
        basePrice,
        taxes,
        fees,
        totalAmount
      },
      paymentDetails: {
        method: 'mock',
        status: 'completed',
        transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        paymentDate: new Date()
      },
      specialServices,
      bookingStatus: 'confirmed'
    });

    // Generate confirmation code
    booking.generateConfirmationCode();

    // Save booking
    await booking.save();

    // Update seat availability in flight
    selectedSeatNumbers.forEach(seatNumber => {
      flight.updateSeatAvailability(seatNumber, false);
    });

    // Update flight booking stats
    flight.bookingDetails.totalBookings += 1;
    flight.bookingDetails.revenue += totalAmount;

    await flight.save();

    // Send confirmation email
    try {
      await sendBookingConfirmation(booking, req.user, flight);
      booking.notifications.emailSent = true;
      await booking.save();
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the booking if email fails
    }

    // Populate booking details for response
    const populatedBooking = await Booking.findById(booking._id)
      .populate('flight', 'flightNumber airline route')
      .populate('user', 'username email');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: populatedBooking,
      paymentStatus: 'success'
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking'
    });
  }
});

// Get user's bookings
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { user: req.user._id };
    if (status) {
      query.bookingStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const bookings = await Booking.find(query)
      .populate('flight', 'flightNumber airline route status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalBookings = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalBookings / parseInt(limit)),
        totalBookings,
        hasNext: skip + bookings.length < totalBookings,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('User bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings'
    });
  }
});

// Get booking details by ID
router.get('/:bookingId', auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      $or: [
        { bookingId: req.params.bookingId },
        { _id: req.params.bookingId }
      ]
    })
    .populate('flight')
    .populate('user', 'username email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user owns this booking or is admin
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Booking details error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking details'
    });
  }
});

// Cancel booking
router.put('/:bookingId/cancel', auth, async (req, res) => {
  try {
    const { reason } = req.body;

    const booking = await Booking.findOne({
      $or: [
        { bookingId: req.params.bookingId },
        { _id: req.params.bookingId }
      ]
    }).populate('flight').populate('user');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check ownership
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if booking can be cancelled
    if (!booking.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled. Flight is too close to departure time or already cancelled.'
      });
    }

    // Update booking status
    booking.bookingStatus = 'cancelled';
    booking.cancellation = {
      isCancelled: true,
      cancelledAt: new Date(),
      cancelledBy: req.user._id,
      reason: reason || 'Cancelled by user',
      refundAmount: booking.pricing.totalAmount * 0.8, // 80% refund
      refundStatus: 'pending'
    };

    await booking.save();

    // Release seats back to flight
    const flight = booking.flight;
    booking.passengers.forEach(passenger => {
      const seat = flight.seatMap.seats.find(s => s.seatNumber === passenger.seatNumber);
      if (seat) {
        seat.isAvailable = true;
        // Update class-wise availability count
        switch (passenger.seatClass) {
          case 'economy':
            flight.pricing.economy.availableSeats += 1;
            break;
          case 'business':
            flight.pricing.business.availableSeats += 1;
            break;
          case 'first':
            flight.pricing.firstClass.availableSeats += 1;
            break;
        }
      }
    });

    // Update flight stats
    flight.bookingDetails.totalBookings = Math.max(0, flight.bookingDetails.totalBookings - 1);
    flight.bookingDetails.revenue = Math.max(0, flight.bookingDetails.revenue - booking.pricing.totalAmount);

    await flight.save();

    // Send cancellation email
    try {
      await sendBookingCancellation(booking, booking.user, flight);
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      refundAmount: booking.cancellation.refundAmount
    });

  } catch (error) {
    console.error('Booking cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking'
    });
  }
});

// Check-in for flight
router.put('/:bookingId/checkin', auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      $or: [
        { bookingId: req.params.bookingId },
        { _id: req.params.bookingId }
      ]
    }).populate('flight').populate('user');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check ownership
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (booking.bookingStatus !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot check-in for this booking'
      });
    }

    if (booking.checkInStatus.isCheckedIn) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in'
      });
    }

    // Check if check-in is allowed (24 hours before departure)
    const departureTime = new Date(booking.flight.route.departure.time);
    const now = new Date();
    const hoursDifference = (departureTime - now) / (1000 * 60 * 60);

    if (hoursDifference > 24) {
      return res.status(400).json({
        success: false,
        message: 'Check-in opens 24 hours before departure'
      });
    }

    if (hoursDifference < 0) {
      return res.status(400).json({
        success: false,
        message: 'Flight has already departed'
      });
    }

    // Update check-in status
    booking.checkInStatus.isCheckedIn = true;
    booking.checkInStatus.checkInTime = new Date();
    booking.checkInStatus.boardingPass.isGenerated = true;

    await booking.save();

    res.json({
      success: true,
      message: 'Check-in successful',
      boardingPass: {
        qrCode: booking.checkInStatus.boardingPass.qrCode,
        checkInTime: booking.checkInStatus.checkInTime
      }
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during check-in'
    });
  }
});

// Search booking by PNR
router.get('/search/pnr/:pnr', async (req, res) => {
  try {
    const { pnr } = req.params;
    
    if (!pnr || pnr.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PNR format'
      });
    }

    const booking = await Booking.findOne({
      'bookingReference.pnr': pnr.toUpperCase()
    })
    .populate('flight', 'flightNumber airline route status')
    .populate('user', 'username email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found with this PNR'
      });
    }

    // Return limited information for security
    const publicBookingInfo = {
      bookingId: booking.bookingId,
      pnr: booking.bookingReference.pnr,
      status: booking.bookingStatus,
      flight: {
        flightNumber: booking.flight.flightNumber,
        airline: booking.flight.airline.name,
        route: booking.flight.route,
        status: booking.flight.status
      },
      passengers: booking.passengers.map(p => ({
        name: `${p.firstName} ${p.lastName}`,
        seatNumber: p.seatNumber,
        seatClass: p.seatClass
      })),
      checkInStatus: booking.checkInStatus
    };

    res.json({
      success: true,
      booking: publicBookingInfo
    });

  } catch (error) {
    console.error('PNR search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching booking'
    });
  }
});

module.exports = router;