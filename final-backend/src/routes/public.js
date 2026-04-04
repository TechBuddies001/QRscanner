const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { sendScanAlert } = require('../services/sms');

/**
 * PUBLIC routes - no auth required
 * These are hit when someone scans a QR code
 */

// GET /api/public/tag/:tagCode – Public profile page data
router.get('/tag/:tagCode', async (req, res) => {
  try {
    const { tagCode } = req.params;

    const tag = await prisma.tag.findUnique({
      where: { tagCode },
      include: { sponsor: { select: { name: true, logo: true, website: true, description: true } } },
    });

    if (!tag) return res.status(404).json({ error: 'Tag not found' });
    if (!tag.isActive) return res.status(403).json({ error: 'This tag is inactive', tagCode });

    // Log the scan
    const scanLog = await prisma.scanLog.create({
      data: {
        tagId: tag.id,
        scannerIp: req.ip,
        scannerLat: req.body.lat ? parseFloat(req.body.lat) : null,
        scannerLng: req.body.lng ? parseFloat(req.body.lng) : null,
        scannerCity: req.body.city || null,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    // Fetch all active sponsors to show as partners if no specific sponsor linked
    const activeSponsors = await prisma.sponsor.findMany({
      where: { isActive: true },
      select: { name: true, logo: true, website: true, description: true }
    });

    // Return public-safe data (NO phone numbers)
    res.json({
      tag: {
        tagCode: tag.tagCode,
        ownerName: tag.ownerName,
        ownerPhoto: tag.ownerPhoto,
        customMessage: tag.customMessage,
        assetType: tag.assetType,
        isLost: tag.isLost,
        address: tag.address,
        sponsor: tag.sponsor,
      },
      activeSponsors,
      scanId: scanLog.id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/public/tag/:tagCode/scan-with-location – Log scan + optional SMS
router.post('/tag/:tagCode/scan', async (req, res) => {
  try {
    const { tagCode } = req.params;
    const { lat, lng, city } = req.body;

    const tag = await prisma.tag.findUnique({ where: { tagCode } });
    if (!tag || !tag.isActive) return res.status(404).json({ error: 'Tag not found or inactive' });

    const scanLog = await prisma.scanLog.create({
      data: {
        tagId: tag.id,
        scannerIp: req.ip,
        scannerLat: lat ? parseFloat(lat) : null,
        scannerLng: lng ? parseFloat(lng) : null,
        scannerCity: city || null,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    // Send SMS alert to owner (fire and forget)
    sendScanAlert({ tag, scannerLat: lat, scannerLng: lng, scannerCity: city })
      .then(() =>
        prisma.scanLog.update({ where: { id: scanLog.id }, data: { smsSent: true } })
      )
      .catch(e => console.error('SMS alert failed:', e.message));

    res.json({ success: true, scanId: scanLog.id, message: 'Scan logged successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/public/tag/:tagCode/call – Initiate masked call via Exotel
router.post('/tag/:tagCode/call', async (req, res) => {
  try {
    const { tagCode } = req.params;
    const { scannerPhone } = req.body;

    if (!scannerPhone) return res.status(400).json({ error: 'Scanner phone number required' });
    if (!scannerPhone.match(/^[6-9]\d{9}$/)) return res.status(400).json({ error: 'Valid Indian mobile number required (10 digits)' });

    const tag = await prisma.tag.findUnique({ where: { tagCode } });
    if (!tag || !tag.isActive) return res.status(404).json({ error: 'Tag not found or inactive' });

    const { initiateExotelCall } = require('../services/exotel');

    let callSid = null;
    let callStatus = 'initiated';
    let errorMsg = null;

    try {
      const result = await initiateExotelCall({
        ownerPhone: tag.ownerPhone,
        scannerPhone,
        tagCode,
      });
      callSid = result?.Call?.Sid || null;
    } catch (callErr) {
      console.error('Exotel call failed:', callErr.message);
      callStatus = 'failed';
      errorMsg = callErr.message;
    }

    // Log the call
    await prisma.callLog.create({
      data: {
        tagId: tag.id,
        scannerPhone,
        callSid,
        status: callStatus,
        provider: 'exotel',
      },
    });

    if (callStatus === 'failed') {
      return res.status(502).json({
        error: 'Call initiation failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? errorMsg : undefined,
      });
    }

    res.json({ success: true, callSid, message: 'Call initiated. You will receive a call shortly.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/public/tag/:tagCode/emergency – Trigger emergency contact
router.post('/tag/:tagCode/emergency', async (req, res) => {
  try {
    const { tagCode } = req.params;
    const { scannerPhone } = req.body;

    const tag = await prisma.tag.findUnique({ where: { tagCode } });
    if (!tag || !tag.emergencyContact) return res.status(404).json({ error: 'No emergency contact configured' });

    const { initiateExotelCall } = require('../services/exotel');

    try {
      await initiateExotelCall({
        ownerPhone: tag.emergencyContact,
        scannerPhone: scannerPhone || tag.ownerPhone,
        tagCode,
      });
    } catch (e) {
      console.error('Emergency call failed:', e.message);
    }

    res.json({ success: true, message: 'Emergency contact notified' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
