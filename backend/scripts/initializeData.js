require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Flight = require('../models/Flight');

const initializeData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://reksitrajan01:8n4SHiaJfCZRrimg@cluster0.mperr.mongodb.net/flightbooking?retryWrites=true&w=majority');
    console.log('Connected to MongoDB');

    // Check if admin user exists
    const adminExists = await User.findOne({ email: 'admin@flights.com' });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@flights.com',
        password: 'trilogy123',
        role: 'admin',
        isActive: true
      });
      console.log('Admin user created');
    }

    // Check if sample flights exist
    const flightCount = await Flight.countDocuments();
    if (flightCount === 0) {
      const sampleFlights = [
        {
          flightNumber: 'SW101',
          airline: {
            name: 'SkyWings',
            code: 'SW',
            logo: 'https://via.placeholder.com/50'
          },
          aircraft: {
            model: 'Boeing 737-800',
            totalSeats: 180
          },
          route: {
            departure: {
              airport: {
                code: 'JFK',
                name: 'John F. Kennedy International',
                city: 'New York',
                country: 'USA'
              },
              time: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
              terminal: 'Terminal 4'
            },
            arrival: {
              airport: {
                code: 'LAX',
                name: 'Los Angeles International',
                city: 'Los Angeles',
                country: 'USA'
              },
              time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // Tomorrow + 6 hours
              terminal: 'Terminal 3'
            }
          },
          duration: {
            hours: 6,
            minutes: 0
          },
          pricing: {
            economy: {
              price: 299,
              availableSeats: 120
            },
            business: {
              price: 799,
              availableSeats: 20
            },
            firstClass: {
              price: 1299,
              availableSeats: 8
            }
          },
          status: 'scheduled',
          isActive: true,
          seatMap: generateSeatMap('3-3', 25, {
            economy: { price: 299 },
            business: { price: 799 },
            firstClass: { price: 1299 }
          })
        },
        {
          flightNumber: 'AF205',
          airline: {
            name: 'AeroFly',
            code: 'AF',
            logo: 'https://via.placeholder.com/50'
          },
          aircraft: {
            model: 'Airbus A320-200',
            totalSeats: 164
          },
          route: {
            departure: {
              airport: {
                code: 'ORD',
                name: 'Chicago O\'Hare International',
                city: 'Chicago',
                country: 'USA'
              },
              time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
              terminal: 'Terminal 1'
            },
            arrival: {
              airport: {
                code: 'MIA',
                name: 'Miami International Airport',
                city: 'Miami',
                country: 'USA'
              },
              time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // Day after tomorrow + 3 hours
              terminal: 'Terminal 2'
            }
          },
          duration: {
            hours: 3,
            minutes: 0
          },
          pricing: {
            economy: {
              price: 189,
              availableSeats: 100
            },
            business: {
              price: 599,
              availableSeats: 15
            },
            firstClass: {
              price: 0,
              availableSeats: 0
            }
          },
          status: 'scheduled',
          isActive: true,
          seatMap: generateSeatMap('3-3', 20, {
            economy: { price: 189 },
            business: { price: 599 }
          })
        },
        {
          flightNumber: 'CJ301',
          airline: {
            name: 'CloudJet',
            code: 'CJ',
            logo: 'https://via.placeholder.com/50'
          },
          aircraft: {
            model: 'Boeing 787-9',
            totalSeats: 292
          },
          route: {
            departure: {
              airport: {
                code: 'SFO',
                name: 'San Francisco International',
                city: 'San Francisco',
                country: 'USA'
              },
              time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
              terminal: 'Terminal 3'
            },
            arrival: {
              airport: {
                code: 'SEA',
                name: 'Seattle-Tacoma International',
                city: 'Seattle',
                country: 'USA'
              },
              time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 3 days + 2 hours
              terminal: 'Main Terminal'
            }
          },
          duration: {
            hours: 2,
            minutes: 0
          },
          pricing: {
            economy: {
              price: 149,
              availableSeats: 200
            },
            business: {
              price: 449,
              availableSeats: 30
            },
            firstClass: {
              price: 899,
              availableSeats: 10
            }
          },
          status: 'scheduled',
          isActive: true,
          seatMap: generateSeatMap('3-4-3', 30, {
            economy: { price: 149 },
            business: { price: 449 },
            firstClass: { price: 899 }
          })
        },
        {
          flightNumber: 'BA456',
          airline: {
            name: 'BlueAir',
            code: 'BA',
            logo: 'https://via.placeholder.com/50'
          },
          aircraft: {
            model: 'Airbus A330-300',
            totalSeats: 250
          },
          route: {
            departure: {
              airport: {
                code: 'BOS',
                name: 'Boston Logan International',
                city: 'Boston',
                country: 'USA'
              },
              time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
              terminal: 'Terminal A'
            },
            arrival: {
              airport: {
                code: 'DEN',
                name: 'Denver International Airport',
                city: 'Denver',
                country: 'USA'
              },
              time: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
              terminal: 'Terminal B'
            }
          },
          duration: {
            hours: 4,
            minutes: 0
          },
          pricing: {
            economy: {
              price: 249,
              availableSeats: 150
            },
            business: {
              price: 649,
              availableSeats: 25
            },
            firstClass: {
              price: 1199,
              availableSeats: 12
            }
          },
          status: 'scheduled',
          isActive: true,
          seatMap: generateSeatMap('2-4-2', 28, {
            economy: { price: 249 },
            business: { price: 649 },
            firstClass: { price: 1199 }
          })
        }
        {
          flightNumber: 'CJ301',
          airline: {
            name: 'CloudJet',
            code: 'CJ',
            logo: 'https://via.placeholder.com/50'
          },
          aircraft: {
            model: 'Boeing 787-9',
            totalSeats: 292
          },
          route: {
            departure: {
              airport: {
                code: 'SFO',
                name: 'San Francisco International',
                city: 'San Francisco',
                country: 'USA'
              },
              time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
              terminal: 'Terminal 3'
            },
            arrival: {
              airport: {
                code: 'SEA',
                name: 'Seattle-Tacoma International',
                city: 'Seattle',
                country: 'USA'
              },
              time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 3 days + 2 hours
              terminal: 'Main Terminal'
            }
          },
          duration: {
            hours: 2,
            minutes: 0
          },
          pricing: {
            economy: {
              price: 149,
              availableSeats: 200
            },
            business: {
              price: 449,
              availableSeats: 30
            },
            firstClass: {
              price: 899,
              availableSeats: 10
            }
          },
          status: 'scheduled',
          isActive: true,
          seatMap: generateSeatMap('3-4-3', 30, {
            economy: { price: 149 },
            business: { price: 449 },
            firstClass: { price: 899 }
          })
        }
      ];

      await Flight.insertMany(sampleFlights);
      console.log('Sample flights created');
    }

    // Create sample user if none exists
    const userCount = await User.countDocuments({ role: 'user' });
    if (userCount === 0) {
      await User.create({
        username: 'testuser',
        email: 'user@example.com',
        password: 'password123',
        role: 'user',
        profile: {
          firstName: 'Test',
          lastName: 'User',
          phone: '+1234567890'
        },
        isActive: true
      });
      console.log('Sample user created');
    }

    console.log('Database initialization complete');
    process.exit(0);

  } catch (error) {
    console.error('Initialization error:', error);
    process.exit(1);
  }
};

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
      if (row <= 3 && pricing.firstClass) {
        seatClass = 'first';
        seatPrice = pricing.firstClass.price;
        features.push('first-class');
      } else if (row <= 8 && pricing.business) {
        seatClass = 'business';
        seatPrice = pricing.business.price;
        features.push('business-class');
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
        status: 'available',
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

initializeData();