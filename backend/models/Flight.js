const mongoose = require('mongoose');

const flightSchema = new mongoose.Schema({
  flightNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  airline: {
    name: {
      type: String,
      required: true
    },
    logo: String,
    code: {
      type: String,
      required: true,
      uppercase: true
    }
  },
  aircraft: {
    model: String,
    totalSeats: {
      type: Number,
      required: true,
      min: 50,
      max: 500
    }
  },
  route: {
    departure: {
      airport: {
        code: {
          type: String,
          required: true,
          uppercase: true
        },
        name: String,
        city: String,
        country: String
      },
      time: {
        type: Date,
        required: true
      },
      gate: String,
      terminal: String
    },
    arrival: {
      airport: {
        code: {
          type: String,
          required: true,
          uppercase: true
        },
        name: String,
        city: String,
        country: String
      },
      time: {
        type: Date,
        required: true
      },
      gate: String,
      terminal: String
    }
  },
  duration: {
    hours: Number,
    minutes: Number
  },
  pricing: {
    economy: {
      price: {
        type: Number,
        required: true,
        min: 0
      },
      availableSeats: {
        type: Number,
        required: true,
        min: 0
      }
    },
    business: {
      price: {
        type: Number,
        min: 0
      },
      availableSeats: {
        type: Number,
        min: 0,
        default: 0
      }
    },
    firstClass: {
      price: {
        type: Number,
        min: 0
      },
      availableSeats: {
        type: Number,
        min: 0,
        default: 0
      }
    }
  },
  seatMap: {
    layout: {
      type: String,
      enum: ['3-3', '3-4-3', '2-4-2', '2-3-2'],
      default: '3-3'
    },
    rows: {
      type: Number,
      required: true,
      min: 10,
      max: 60
    },
    seats: [{
      seatNumber: {
        type: String,
        required: true
      },
      class: {
        type: String,
        enum: ['economy', 'business', 'first'],
        default: 'economy'
      },
      isAvailable: {
        type: Boolean,
        default: true
      },
      isBlocked: {
        type: Boolean,
        default: false
      },
      price: Number,
      position: {
        row: Number,
        column: String
      },
      features: [String] // ['window', 'aisle', 'extra-legroom', 'emergency-exit']
    }]
  },
  status: {
    type: String,
    enum: ['scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed'],
    default: 'scheduled'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  bookingDetails: {
    totalBookings: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
flightSchema.index({ 'route.departure.airport.code': 1, 'route.arrival.airport.code': 1, 'route.departure.time': 1 });
flightSchema.index({ flightNumber: 1 });
flightSchema.index({ status: 1, isActive: 1 });

// Virtual for available seats count
flightSchema.virtual('totalAvailableSeats').get(function() {
  return this.pricing.economy.availableSeats + 
         this.pricing.business.availableSeats + 
         this.pricing.firstClass.availableSeats;
});

// Method to update seat availability
flightSchema.methods.updateSeatAvailability = function(seatNumber, isAvailable = false) {
  const seat = this.seatMap.seats.find(s => s.seatNumber === seatNumber);
  if (seat) {
    seat.isAvailable = isAvailable;
    
    // Update class-wise availability count
    if (!isAvailable) {
      switch (seat.class) {
        case 'economy':
          this.pricing.economy.availableSeats = Math.max(0, this.pricing.economy.availableSeats - 1);
          break;
        case 'business':
          this.pricing.business.availableSeats = Math.max(0, this.pricing.business.availableSeats - 1);
          break;
        case 'first':
          this.pricing.firstClass.availableSeats = Math.max(0, this.pricing.firstClass.availableSeats - 1);
          break;
      }
    }
  }
  return seat;
};

module.exports = mongoose.model('Flight', flightSchema);