/**
 * Firebase Cloud Function for sending OTP via SMS
 * Deploy this function to Firebase Cloud Functions
 * 
 * Setup:
 * 1. firebase init functions
 * 2. npm install twilio
 * 3. Set environment variables (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER)
 * 4. firebase deploy --only functions:sendOtp
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
 * 
 * Response:
 * {
 *   "success": true,
 *   "messageSid": "SM1234567890abcdef",
 *   "message": "OTP sent successfully"
 * }
 */
exports.sendOtp = functions.https.onCall(async (data, context) => {
  try {
    // Validate request
    if (!data.phoneNumber) {
      throw new Error("phoneNumber is required");
    }
    if (!data.otp) {
      throw new Error("otp is required");
    }

    const phoneNumber = data.phoneNumber;
    const otp = data.otp;

    console.log(`📱 Sending OTP ${otp} to ${phoneNumber}`);

    // Send SMS via Twilio
    const message = await twilioClient.messages.create({
      body: `Your SmartRide OTP: ${otp}. Valid for 5 minutes. Do not share this code.`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`✅ SMS sent successfully! MessageSID: ${message.sid}`);

    return {
      success: true,
      messageSid: message.sid,
      message: "OTP sent successfully to " + phoneNumber,
      status: message.status,
    };
  } catch (error) {
    console.error(`❌ Error sending OTP: ${error.message}`);

    return {
      success: false,
      error: error.message,
      message: "Failed to send OTP",
    };
  }
});

/**
 * Alternative: Callable function (for direct calling from app)
 * This function can be called from Android/iOS apps directly
 */
exports.sendOtpCallable = functions.https.onCall(async (data, context) => {
  try {
    // Optional: Check if user is authenticated
    // if (!context.auth) {
    //   throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    // }

    const phoneNumber = data.phoneNumber;
    const otp = data.otp;

    if (!phoneNumber || !otp) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing phoneNumber or otp"
      );
    }

    console.log(`📱 Sending OTP ${otp} to ${phoneNumber} (Callable)`);

    const message = await twilioClient.messages.create({
      body: `Your SmartRide OTP: ${otp}. Valid for 5 minutes. Do not share this code.`,
      from: TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`✅ SMS sent successfully! MessageSID: ${message.sid}`);

    return {
      success: true,
      messageSid: message.sid,
      message: "OTP sent successfully",
    };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);

    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Alternative: Pub/Sub triggered function
 * This function is triggered when a message is published to a Pub/Sub topic
 * Useful for queuing OTP sending requests
 */
exports.sendOtpPubSub = functions.pubsub
  .topic("send-otp")
  .onPublish(async (message, context) => {
    try {
      const decodedMessage = Buffer.from(
        message.data,
        "base64"
      ).toString("utf8");
      const { phoneNumber, otp } = JSON.parse(decodedMessage);

      console.log(`📱 Sending OTP ${otp} to ${phoneNumber} (Pub/Sub)`);

      const smsMessage = await twilioClient.messages.create({
        body: `Your SmartRide OTP: ${otp}. Valid for 5 minutes. Do not share this code.`,
        from: TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });

      console.log(`✅ SMS sent successfully! MessageSID: ${smsMessage.sid}`);

      return {
        success: true,
        messageSid: smsMessage.sid,
      };
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      throw error;
    }
  });
