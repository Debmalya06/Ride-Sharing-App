/**
 * Firebase Cloud Function for sending OTP via SMS
 * Uses Twilio to send SMS messages
 */

const functions = require("firebase-functions");
const twilio = require("twilio");

// Get Twilio credentials from environment variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * HTTP Cloud Function to send OTP via SMS
 *
 * Request body:
 * {
 *   "phoneNumber": "+919876543210",
 *   "otp": "123456"
 * }
 */
exports.sendOtp = functions.https.onRequest(async (req, res) => {
  try {
    // Handle CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    // Get data from request
    const {phoneNumber, otp} = req.body;

    // Validate request
    if (!phoneNumber) {
      res.status(400).json({
        success: false,
        error: "phoneNumber is required",
      });
      return;
    }

    if (!otp) {
      res.status(400).json({
        success: false,
        error: "otp is required",
      });
      return;
    }

    console.log(`📱 Sending OTP ${otp} to ${phoneNumber}`);

    // Check if Twilio is configured
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN ||
        !TWILIO_PHONE_NUMBER) {
      console.error("❌ Twilio credentials not configured!");
      res.status(500).json({
        success: false,
        error: "SMS service not configured. Set Twilio credentials.",
        message: "Run: firebase functions:config:set " +
                 "twilio.accountsid='...' twilio.authtoken='...' " +
                 "twilio.phonenumber='+...'",
      });
      return;
    }

    // Send SMS via Twilio
    const message = await twilioClient.messages.create({
      body: `Your SmartRide OTP: ${otp}. Valid for 5 minutes. ` +
            "Do not share this code.",
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`✅ SMS sent successfully! MessageSID: ${message.sid}`);

    res.status(200).json({
      success: true,
      messageSid: message.sid,
      message: "OTP sent successfully to " + phoneNumber,
      status: message.status,
    });
  } catch (error) {
    console.error(`❌ Error sending OTP: ${error.message}`);

    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to send OTP",
    });
  }
});
