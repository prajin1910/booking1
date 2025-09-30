const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Generate QR Code
const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Send booking confirmation email
const sendBookingConfirmation = async (booking, user, flight) => {
  try {
    const transporter = createTransporter();
    
    // Generate QR code with booking information
    const qrData = JSON.stringify({
      bookingId: booking.bookingId,
      pnr: booking.bookingReference.pnr,
      flightNumber: flight.flightNumber,
      passenger: booking.passengers[0].firstName + ' ' + booking.passengers[0].lastName,
      departure: flight.route.departure.airport.code,
      arrival: flight.route.arrival.airport.code,
      date: flight.route.departure.time,
      seat: booking.passengers[0].seatNumber
    });
    
    const qrCodeImage = await generateQRCode(qrData);
    
    // Format departure and arrival times
    const departureTime = new Date(flight.route.departure.time).toLocaleString();
    const arrivalTime = new Date(flight.route.arrival.time).toLocaleString();
    
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Flight Booking Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .flight-info { display: flex; justify-content: space-between; align-items: center; margin: 20px 0; }
        .airport { text-align: center; }
        .airport-code { font-size: 24px; font-weight: bold; color: #667eea; }
        .airport-name { font-size: 12px; color: #666; }
        .flight-arrow { font-size: 20px; color: #667eea; }
        .passenger-info { margin: 20px 0; }
        .qr-code { text-align: center; margin: 30px 0; }
        .qr-code img { border: 2px solid #667eea; border-radius: 8px; }
        .important { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        .btn { display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .row { display: flex; justify-content: space-between; margin: 10px 0; }
        .label { font-weight: bold; color: #555; }
        .value { color: #333; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✈️ Booking Confirmed!</h1>
          <p>Your flight has been successfully booked</p>
        </div>
        
        <div class="content">
          <div class="booking-details">
            <h2>Booking Details</h2>
            <div class="row">
              <span class="label">Booking ID:</span>
              <span class="value">${booking.bookingId}</span>
            </div>
            <div class="row">
              <span class="label">PNR:</span>
              <span class="value">${booking.bookingReference.pnr}</span>
            </div>
            <div class="row">
              <span class="label">Confirmation Code:</span>
              <span class="value">${booking.bookingReference.confirmationCode}</span>
            </div>
          </div>

          <div class="booking-details">
            <h2>Flight Information</h2>
            <div class="row">
              <span class="label">Flight:</span>
              <span class="value">${flight.flightNumber} - ${flight.airline.name}</span>
            </div>
            
            <div class="flight-info">
              <div class="airport">
                <div class="airport-code">${flight.route.departure.airport.code}</div>
                <div class="airport-name">${flight.route.departure.airport.city}</div>
                <div>${departureTime}</div>
              </div>
              <div class="flight-arrow">✈️</div>
              <div class="airport">
                <div class="airport-code">${flight.route.arrival.airport.code}</div>
                <div class="airport-name">${flight.route.arrival.airport.city}</div>
                <div>${arrivalTime}</div>
              </div>
            </div>
          </div>

          <div class="booking-details">
            <h2>Passenger Information</h2>
            ${booking.passengers.map((passenger, index) => `
              <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                <div class="row">
                  <span class="label">Passenger ${index + 1}:</span>
                  <span class="value">${passenger.title} ${passenger.firstName} ${passenger.lastName}</span>
                </div>
                <div class="row">
                  <span class="label">Seat:</span>
                  <span class="value">${passenger.seatNumber} (${passenger.seatClass})</span>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="booking-details">
            <h2>Payment Information</h2>
            <div class="row">
              <span class="label">Total Amount:</span>
              <span class="value">$${booking.pricing.totalAmount}</span>
            </div>
            <div class="row">
              <span class="label">Payment Status:</span>
              <span class="value" style="color: green; font-weight: bold;">✅ CONFIRMED</span>
            </div>
          </div>

          <div class="qr-code">
            <h3>Your Boarding Pass QR Code</h3>
            <img src="${qrCodeImage}" alt="Boarding Pass QR Code" width="200" height="200">
            <p style="font-size: 12px; color: #666;">Show this QR code at the airport for check-in</p>
          </div>

          <div class="important">
            <h4>Important Information:</h4>
            <ul>
              <li>Please arrive at the airport at least 2 hours before domestic flights and 3 hours before international flights</li>
              <li>Ensure you have valid identification documents</li>
              <li>Check-in opens 24 hours before departure</li>
              <li>Save this email and QR code for easy check-in</li>
            </ul>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/booking/${booking.bookingId}" class="btn">View Booking Details</a>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for choosing our flight booking service!</p>
          <p>For any queries, contact us at support@flights.com</p>
          <p>&copy; 2025 Flight Booking System. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: {
        name: 'Flight Booking System',
        address: process.env.EMAIL_USER
      },
      to: user.email,
      subject: `Flight Booking Confirmation - ${booking.bookingId}`,
      html: emailHtml,
      attachments: [{
        filename: 'boarding-pass-qr.png',
        content: qrCodeImage.split('base64,')[1],
        encoding: 'base64',
        cid: 'qrcode'
      }]
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Booking confirmation email sent:', result.messageId);
    
    // Store QR code in booking
    booking.checkInStatus.boardingPass.qrCode = qrCodeImage;
    booking.checkInStatus.boardingPass.barcodeData = qrData;
    booking.notifications.emailSent = true;
    await booking.save();
    
    return result;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send booking confirmation email');
  }
};

// Send booking cancellation email
const sendBookingCancellation = async (booking, user, flight) => {
  try {
    const transporter = createTransporter();
    
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Cancellation Confirmation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
        .content { background: #f8f9fa; padding: 20px; }
        .booking-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Booking Cancelled</h1>
        </div>
        <div class="content">
          <p>Dear ${user.username},</p>
          <p>Your booking has been successfully cancelled.</p>
          
          <div class="booking-details">
            <h3>Cancelled Booking Details:</h3>
            <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
            <p><strong>Flight:</strong> ${flight.flightNumber}</p>
            <p><strong>Route:</strong> ${flight.route.departure.airport.code} → ${flight.route.arrival.airport.code}</p>
            <p><strong>Cancellation Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p>If you have any questions, please contact our support team.</p>
          <p>Thank you for using our service.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Booking Cancellation - ${booking.bookingId}`,
      html: emailHtml
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Cancellation email error:', error);
    throw new Error('Failed to send cancellation email');
  }
};

module.exports = {
  generateQRCode,
  sendBookingConfirmation,
  sendBookingCancellation,
  createTransporter
};