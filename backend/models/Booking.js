const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  flight: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flight',
    required: true
  },
  passengers: [{
    title: {
      type: String,
      enum: ['Mr', 'Mrs', 'Ms', 'Dr'],
      required: true
    },
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    dateOfBirth: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true
    },
    nationality: String,
    passportNumber: String,
    seatNumber: {
      type: String,
      required: true
    },
    seatClass: {
      type: String,
      enum: ['economy', 'business', 'first'],
      required: true
    },
    specialRequests: [String],
    mealPreference: {
      type: String,
      enum: ['vegetarian', 'non-vegetarian', 'vegan', 'kosher', 'halal', 'none'],
      default: 'none'
    }
  }],
  contactDetails: {
    email: {
      type: String,
      required: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String
    }
  },
  pricing: {
    basePrice: {
      type: Number,
      required: true
    },
    taxes: {
      type: Number,
      default: 0
    },
    fees: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  paymentDetails: {
    method: {
      type: String,
      enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'mock'],
      default: 'mock'
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'completed'
    },
    transactionId: String,
    paymentDate: {
      type: Date,
      default: Date.now
    }
  },
  bookingStatus: {
    type: String,
    enum: ['confirmed', 'cancelled', 'pending', 'completed', 'no-show'],
    default: 'confirmed'
  },
  checkInStatus: {
    isCheckedIn: {
      type: Boolean,
      default: false
    },
    checkInTime: Date,
    boardingPass: {
      isGenerated: {
        type: Boolean,
        default: false
      },
      qrCode: String,
      barcodeData: String
    }
  },
  bookingReference: {
    pnr: {
      type: String,
      required: true,
      uppercase: true
    },
    confirmationCode: String
  },
  notifications: {
    emailSent: {
      type: Boolean,
      default: false
    },
    smsSent: {
      type: Boolean,
      default: false
    },
    reminderSent: {
      type: Boolean,
      default: false
    }
  },
  specialServices: [{
    type: {
      type: String,
      enum: ['wheelchair', 'extra_baggage', 'pet_travel', 'unaccompanied_minor', 'meal_upgrade']
    },
    description: String,
    price: {
      type: Number,
      default: 0
    }
  }],
  cancellation: {
    isCancelled: {
      type: Boolean,
      default: false
    },
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    refundAmount: Number,
    refundStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed', 'not_applicable'],
      default: 'not_applicable'
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ flight: 1 });
bookingSchema.index({ 'bookingReference.pnr': 1 });
bookingSchema.index({ bookingStatus: 1 });

// Generate booking ID before saving
bookingSchema.pre('save', async function(next) {
  if (!this.bookingId) {
    // Generate unique booking ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.bookingId = `FB${timestamp}${random}`;
  }
  
  if (!this.bookingReference.pnr) {
    // Generate PNR
    const pnrLength = 6;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let pnr = '';
    for (let i = 0; i < pnrLength; i++) {
      pnr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.bookingReference.pnr = pnr;
  }
  
  next();
});

// Method to calculate total passengers
bookingSchema.virtual('totalPassengers').get(function() {
  return this.passengers.length;
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  if (this.bookingStatus === 'cancelled' || this.cancellation.isCancelled) {
    return false;
  }
  
  // Check if flight departure is more than 2 hours away
  return this.populated('flight') && 
         new Date(this.flight.route.departure.time) > new Date(Date.now() + 2 * 60 * 60 * 1000);
};

// Method to generate confirmation code
bookingSchema.methods.generateConfirmationCode = function() {
  if (!this.bookingReference.confirmationCode) {
    const code = Math.random().toString(36).substr(2, 8).toUpperCase();
    this.bookingReference.confirmationCode = code;
  }
  return this.bookingReference.confirmationCode;
};

module.exports = mongoose.model('Booking', bookingSchema);