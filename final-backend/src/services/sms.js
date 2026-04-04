const { sendExotelSms } = require('./exotel');
const prisma = require('../lib/prisma');

/**
 * Send scan alert SMS to tag owner
 */
const sendScanAlert = async ({ tag, scannerLat, scannerLng, scannerCity }) => {
  try {
    const mapsLink = scannerLat && scannerLng
      ? `https://maps.google.com/?q=${scannerLat},${scannerLng}`
      : 'Location not shared';

    const location = scannerCity || (scannerLat ? `${scannerLat}, ${scannerLng}` : 'Unknown');

    const message = `[Tarkshya] Your tag (${tag.tagCode}) was scanned.\nTime: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\nLocation: ${location}\nMap: ${mapsLink}`;

    const result = await sendExotelSms({
      to: tag.ownerPhone,
      message,
    });

    // Log to DB
    await prisma.smsLog.create({
      data: {
        tagId: tag.id,
        recipient: tag.ownerPhone,
        message,
        status: 'sent',
        provider: 'exotel',
      },
    });

    return result;
  } catch (err) {
    console.error('SMS send failed:', err.message);
    await prisma.smsLog.create({
      data: {
        tagId: tag.id,
        recipient: tag.ownerPhone,
        message: `Scan alert for tag ${tag.tagCode}`,
        status: 'failed',
        provider: 'exotel',
      },
    });
    throw err;
  }
};

module.exports = { sendScanAlert };
