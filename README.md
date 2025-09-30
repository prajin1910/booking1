# Flight Booking System 🛫

A modern, full-stack flight booking system built with React and Node.js, featuring BookMyShow-style seat selection, user authentication, admin dashboard, and email notifications.

## 🚀 Features

### User Features
- **Modern Search Interface**: Intuitive flight search with filters
- **Seat Selection**: Interactive seat map similar to BookMyShow
- **User Authentication**: Secure registration and login
- **Booking Management**: View, modify, and cancel bookings
- **Email Notifications**: Automated confirmations with QR codes
- **Responsive Design**: Works perfectly on all devices

### Admin Features
- **Admin Dashboard**: Comprehensive analytics and stats
- **Flight Management**: Add, edit, and manage flights
- **Booking Oversight**: Monitor all bookings and passengers
- **User Management**: Manage user accounts and permissions

### Technical Features
- **RESTful API**: Clean and documented backend API
- **JWT Authentication**: Secure token-based authentication
- **MongoDB Atlas**: Cloud database integration
- **Email Service**: Gmail SMTP with QR code generation
- **Modern UI**: Tailwind CSS with professional design
- **Error Handling**: Comprehensive error management

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **React Hot Toast**: Beautiful notifications
- **React Icons**: Feather icons library
- **Axios**: HTTP client for API calls

### Backend
- **Node.js**: JavaScript runtime
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **Nodemailer**: Email service
- **QRCode**: QR code generation
- **CORS**: Cross-origin resource sharing

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account
- Gmail account for email service

### 1. Clone the Repository
```bash
git clone <repository-url>
cd node
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in backend directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://reksitrajan01:8n4SHiaJfCZRrimg@cluster0.mperr.mongodb.net/flightbooking
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=reksit2005@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=reksit2005@gmail.com

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create `.env` file in frontend directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Start the Application
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔐 Admin Access

Use these credentials to access the admin dashboard:
- **Email**: admin@flights.com
- **Password**: trilogy123

## 📱 How to Use

### For Users
1. **Search Flights**: Enter departure/arrival cities, dates, and passengers
2. **Select Flight**: Choose from available flights with pricing
3. **Choose Seats**: Select seats using the interactive seat map
4. **Passenger Details**: Fill in passenger information
5. **Payment**: Complete mock payment process
6. **Confirmation**: Receive email with QR code and booking details

### For Admins
1. **Login**: Use admin credentials to access dashboard
2. **Monitor**: View real-time stats and recent activities
3. **Manage**: Add flights, view bookings, manage users
4. **Analytics**: Track revenue, user growth, and flight performance

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#2563eb) - Trust and reliability
- **Secondary**: Gray tones for balance
- **Success**: Green for confirmations
- **Warning**: Yellow for alerts
- **Error**: Red for problems

### Typography
- **Font**: Inter - Modern, readable typeface
- **Headings**: Bold, clear hierarchy
- **Body**: Comfortable reading experience

### Components
- **Cards**: Elevated surfaces with subtle shadows
- **Buttons**: Gradient backgrounds with hover effects
- **Forms**: Clean inputs with focus states
- **Navigation**: Intuitive menu structure

## 📧 Email Configuration

The system uses Gmail SMTP for email notifications. To set up:

1. Enable 2-factor authentication on your Gmail account
2. Generate an app-specific password
3. Update the `.env` file with your credentials

Email features:
- Booking confirmations with QR codes
- Cancellation notifications
- Check-in reminders
- Admin notifications

## 🗄️ Database Schema

### User Schema
```javascript
{
  username: String,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: String (user/admin),
  createdAt: Date
}
```

### Flight Schema
```javascript
{
  flightNumber: String,
  airline: Object,
  route: Object,
  aircraft: Object,
  duration: Number,
  pricing: Object,
  seatMap: Object,
  status: String
}
```

### Booking Schema
```javascript
{
  bookingId: String,
  user: ObjectId,
  flight: ObjectId,
  passengers: Array,
  contactDetails: Object,
  pricing: Object,
  paymentDetails: Object,
  bookingStatus: String,
  qrCode: String
}
```

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Flights
- `GET /api/flights/search` - Search flights
- `GET /api/flights/:id` - Get flight details
- `GET /api/flights/:id/seats` - Get seat map

### Bookings
- `POST /api/bookings/create` - Create booking
- `GET /api/bookings/my-bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/cancel` - Cancel booking

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/recent-bookings` - Recent bookings
- `GET /api/admin/recent-users` - Recent users

## 🚀 Deployment

### Frontend (Netlify/Vercel)
1. Build the production version:
```bash
cd frontend
npm run build
```
2. Deploy the `build` folder to your hosting service
3. Update environment variables for production

### Backend (Heroku/Railway)
1. Set up environment variables
2. Deploy using Git:
```bash
git add .
git commit -m "Deploy"
git push heroku main
```

## 🧪 Testing

### Running Tests
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test
```

### Test Coverage
- Unit tests for components
- Integration tests for API endpoints
- End-to-end tests for user flows

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Design inspiration from BookMyShow
- Icons from Feather Icons
- UI components from Tailwind CSS
- Email service powered by Nodemailer

## 📞 Support

For support, email reksit2005@gmail.com or create an issue in the repository.

---

**Made with ❤️ for modern flight booking experience**