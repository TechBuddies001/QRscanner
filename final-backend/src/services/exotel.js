const axios = require('axios');

/**
 * Exotel Call Masking Service
 * Exotel calls owner first, then connects scanner – neither sees real numbers
 */
const initiateExotelCall = async ({ ownerPhone, scannerPhone, tagCode }) => {
  const { EXOTEL_SID, EXOTEL_API_KEY, EXOTEL_API_TOKEN, EXOTEL_CALLER_ID, EXOTEL_SUBDOMAIN } = process.env;

  // Exotel Connect Call API
  const url = `https://${EXOTEL_API_KEY}:${EXOTEL_API_TOKEN}@${EXOTEL_SUBDOMAIN}/v1/Accounts/${EXOTEL_SID}/Calls/connect.json`;

  const params = new URLSearchParams({
    From: scannerPhone,
    To: ownerPhone,
    CallerId: EXOTEL_CALLER_ID,
    Record: 'false',
    CustomField: `tag:${tagCode}`,
  });

  const response = await axios.post(url, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return response.data;
};

/**
 * Send SMS via Exotel
 */
const sendExotelSms = async ({ to, message }) => {
  const { EXOTEL_SID, EXOTEL_API_KEY, EXOTEL_API_TOKEN, EXOTEL_CALLER_ID, EXOTEL_SUBDOMAIN } = process.env;

  const url = `https://${EXOTEL_API_KEY}:${EXOTEL_API_TOKEN}@${EXOTEL_SUBDOMAIN}/v1/Accounts/${EXOTEL_SID}/Sms/send.json`;

  const params = new URLSearchParams({
    From: EXOTEL_CALLER_ID,
    To: to,
    Body: message,
  });

  const response = await axios.post(url, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return response.data;
};

module.exports = { initiateExotelCall, sendExotelSms };
