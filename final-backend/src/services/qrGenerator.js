const QRCode = require('qrcode');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const { qrDir } = require('../middleware/upload');

/**
 * Generate branded QR code with different designs
 * Support for Standard vertical tag and New Circle design
 */
/**
 * Generate branded QR code with different designs
 * Support for Standard vertical tag and New Circle design
 */
const generateQRCode = async (tagCode, designType = 'standard', sponsor = null, assetType = 'employee') => {
  const publicUrl = `${process.env.PUBLIC_TAG_BASE_URL || 'http://localhost:3000/tag'}/${tagCode}`;
  const fileName = `qr_${designType}_${tagCode}.png`;
  const filePath = path.join(qrDir, fileName);

  if (designType === 'circle') {
    return await generateCircleQRCode(tagCode, publicUrl, filePath, fileName, sponsor, assetType);
  } else if (designType === 'landscape') {
    return await generateLandscapeQRCode(tagCode, publicUrl, filePath, fileName, sponsor, assetType);
  }

  // DEFAULT: Standard Vertical Design
  const canvasWidth = 1200;
  const canvasHeight = 1800;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  // Blue Header - Increased Depth for generous margins
  const bgDepth = 650;
  const bgGradient = ctx.createLinearGradient(0, 0, 0, bgDepth);
  bgGradient.addColorStop(0, '#002e8a');
  bgGradient.addColorStop(1, '#001a52');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvasWidth, bgDepth);

  // Silver Separator
  const sepGradient = ctx.createLinearGradient(0, bgDepth, 0, bgDepth + 20);
  sepGradient.addColorStop(0, '#737373');
  sepGradient.addColorStop(0.3, '#d4d4d4');
  sepGradient.addColorStop(1, '#f5f5f5');
  ctx.fillStyle = sepGradient;
  ctx.fillRect(0, bgDepth, canvasWidth, 20);

  // White Middle Area
  ctx.fillStyle = '#f9fafb';
  ctx.fillRect(0, bgDepth + 20, canvasWidth, 1480 - (bgDepth + 20));

  // Red Footer
  const redGradient = ctx.createLinearGradient(0, 1480, 0, 1800);
  redGradient.addColorStop(0, '#b31919');
  redGradient.addColorStop(1, '#7a0a0a');
  ctx.fillStyle = redGradient;
  ctx.fillRect(0, 1480, canvasWidth, 320);

  // Add Project Logo
  try {
    const logoRelPath = path.join(__dirname, '..', '..', 'public', 'images', 'new_logo.png');
    if (fs.existsSync(logoRelPath)) {
      const logo = await loadImage(logoRelPath);
      const logoWidth = 240;
      const logoAspect = logo.height / logo.width;
      const logoHeight = logoWidth * logoAspect;
      ctx.drawImage(logo, (canvasWidth - logoWidth) / 2, 50, logoWidth, logoHeight);
    }
  } catch (err) { }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 100px "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('V-KAWACH', canvasWidth / 2, 420);

  ctx.font = 'bold 36px "Arial", sans-serif';
  ctx.letterSpacing = "8px";
  ctx.globalAlpha = 0.8;
  ctx.fillText('SECURING YOUR WORLD', canvasWidth / 2, 490);

  ctx.font = 'bold 58px "Arial", sans-serif';
  ctx.letterSpacing = "10px";
  ctx.globalAlpha = 1.0;
  const safetyLabelStd = assetType === 'pet' ? 'PET SAFETY' : 
                        (assetType === 'person' ? 'PERSONAL SAFETY' : 
                        (assetType === 'vehicle' ? 'VEHICLE SAFETY' : 
                        (assetType === 'student' ? 'STUDENT SAFETY' : 'EMPLOYEE SAFETY')));
  ctx.fillText(safetyLabelStd, canvasWidth / 2, 570);
  ctx.globalAlpha = 1.0;
  ctx.letterSpacing = "0px";

  // ID & Asset Type Label - Moved to White Section with more padding
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 36px "Arial", sans-serif';
  ctx.letterSpacing = "12px";
  ctx.fillText(`${assetType.toUpperCase()} ID: ${tagCode}`, canvasWidth / 2, 730);
  ctx.letterSpacing = "0px";

  // QR Code Area
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 40;
  ctx.fillStyle = '#ffffff';

  // QR Code Area - Resized to fit better with margins
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 40;
  ctx.fillStyle = '#ffffff';

  const boxSize = 640;
  const boxX = (canvasWidth - boxSize) / 2;
  const boxY = 760; // Moved up from 820 to reduce top margin
  const radius = 40;

  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxSize, boxSize, radius);
  ctx.fill();

  ctx.shadowColor = 'transparent';
  const qrSize = 540;
  const qrBuffer = await QRCode.toBuffer(publicUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: qrSize
  });

  const qrImage = await loadImage(qrBuffer);
  ctx.drawImage(qrImage, (canvasWidth - qrSize) / 2, boxY + (boxSize - qrSize) / 2, qrSize, qrSize);

  // SPONSOR LOGO Handling
  if (sponsor && sponsor.logo) {
    try {
      const sponsorLogoPath = path.join(__dirname, '..', '..', sponsor.logo);
      if (fs.existsSync(sponsorLogoPath)) {
        const sLogo = await loadImage(sponsorLogoPath);
        const sLogoWidth = 140;
        const sLogoAspect = sLogo.height / sLogo.width;
        const sLogoHeight = sLogoWidth * sLogoAspect;
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 20px "Arial", sans-serif';
        ctx.fillText('SPONSORED BY', canvasWidth / 2, boxY + boxSize + 30);
        
        ctx.drawImage(sLogo, (canvasWidth - sLogoWidth) / 2, boxY + boxSize + 50, sLogoWidth, sLogoHeight);
      }
    } catch (e) { }
  }

  ctx.fillStyle = '#002e8a';
  ctx.font = 'bold 24px "Arial", sans-serif';
  ctx.fillText('A PRODUCT OF TARKSHYA SOLUTION', canvasWidth / 2, 1440);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 85px "Arial", sans-serif';
  ctx.fillText('SCAN IN EMERGENCY', canvasWidth / 2, 1615); // Adjusted Y

  ctx.font = 'bold 42px "Arial", sans-serif';
  ctx.fillText('FOR IMMEDIATE HELP & ALERTS', canvasWidth / 2, 1705);

  // Removed Hole Punch Marker


  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);

  return {
    filePath,
    fileName,
    base64: `data:image/png;base64,${buffer.toString('base64')}`,
    publicUrl,
    qrImageUrl: `/uploads/qrcodes/${fileName}`,
  };
};

/**
 * Generate Circle Branded QR Code
 */
async function generateCircleQRCode(tagCode, publicUrl, filePath, fileName, sponsor = null, assetType = 'vehicle') {
  const size = 1200;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const centerX = size / 2;
  const centerY = size / 2;

  // 1. Base circle with premium border
  ctx.beginPath();
  ctx.arc(centerX, centerY, size / 2 - 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 15;
  ctx.strokeStyle = '#f1f5f9';
  ctx.stroke();

  ctx.stroke();

  // 2. Draw Blue Header Area (Arched) - Top Area
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, size / 2 - 10, Math.PI, 2 * Math.PI);
  ctx.lineTo(centerX + size / 2, 480);
  ctx.lineTo(centerX - size / 2, 480);
  ctx.closePath();
  ctx.clip();

  const blueGrad = ctx.createLinearGradient(0, 0, 0, 480);
  blueGrad.addColorStop(0, '#003399');
  blueGrad.addColorStop(1, '#001a52');
  ctx.fillStyle = blueGrad;
  ctx.fillRect(0, 0, size, 480);
  ctx.restore();

  // 3. Simple Red Footer (Bottom segment)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 920);
  ctx.lineTo(size, 920);
  ctx.lineTo(size, size);
  ctx.lineTo(0, size);
  ctx.closePath();
  ctx.clip();

  ctx.beginPath();
  ctx.arc(centerX, centerY, size / 2 - 10, 0, Math.PI * 2);
  const redGrad = ctx.createLinearGradient(0, 920, 0, size);
  redGrad.addColorStop(0, '#cc0000');
  redGrad.addColorStop(1, '#880000');
  ctx.fillStyle = redGrad;
  ctx.fill();
  ctx.restore();

  // 4. Project Logo Positioning - Adjusted to fix overlap
  try {
    const logoRelPath = path.join(__dirname, '..', '..', 'public', 'images', 'new_logo.png');
    if (fs.existsSync(logoRelPath)) {
      const logo = await loadImage(logoRelPath);
      const logoWidth = 180;
      const logoAspect = logo.height / logo.width;
      const logoHeight = logoWidth * logoAspect;
      ctx.drawImage(logo, centerX - logoWidth / 2, 40, logoWidth, logoHeight);
    }
  } catch (err) { }

  // 5. Header Branding Text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 90px "Arial", sans-serif';
  ctx.fillText('V-KAWACH', centerX, 360);

  ctx.font = 'bold 28px "Arial", sans-serif';
  ctx.letterSpacing = "6px";
  ctx.globalAlpha = 0.8;
  ctx.fillText('SECURING YOUR WORLD', centerX, 410);

  ctx.font = 'bold 38px "Arial", sans-serif';
  ctx.letterSpacing = "8px";
  ctx.globalAlpha = 1.0;
  const safetyLabel = assetType === 'pet' ? 'PET SAFETY' : 
                     (assetType === 'person' ? 'PERSONAL SAFETY' : 
                     (assetType === 'vehicle' ? 'VEHICLE SAFETY' : 
                     (assetType === 'student' ? 'STUDENT SAFETY' : 'EMPLOYEE SAFETY')));
  ctx.fillText(safetyLabel, centerX, 455);
  ctx.globalAlpha = 1.0;
  ctx.letterSpacing = "0px";

  // ID & Asset Type Label - Moved to White Section (like portrait)
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 22px "Arial", sans-serif';
  ctx.letterSpacing = "10px";
  ctx.globalAlpha = 1.0;
  ctx.fillText(`${assetType.toUpperCase()} ID: ${tagCode}`, centerX, 525);
  ctx.letterSpacing = "0px";

  // 7. QR Code in White Area - Shrinked and properly aligned
  // 7. QR Code in White Area - Shrinked and properly aligned
  const qrSize = 300;
  const qrBuffer = await QRCode.toBuffer(publicUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: qrSize,
    color: { dark: '#000000', light: '#ffffff' }
  });
  const qrImage = await loadImage(qrBuffer);

  const qrTop = 550; // Moved up slightly from 565
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(centerX - qrSize / 2 - 10, qrTop - 10, qrSize + 20, qrSize + 20, 25);
  ctx.fill();
  ctx.restore();
  
  ctx.drawImage(qrImage, centerX - qrSize / 2, qrTop, qrSize, qrSize);

  // SPONSOR LOGO Handling for Circle Design
  if (sponsor && sponsor.logo) {
    try {
      const sponsorLogoPath = path.join(__dirname, '..', '..', sponsor.logo);
      if (fs.existsSync(sponsorLogoPath)) {
        const sLogo = await loadImage(sponsorLogoPath);
        const sLogoWidth = 140;
        const sLogoAspect = sLogo.height / sLogo.width;
        const sLogoHeight = sLogoWidth * sLogoAspect;
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 20px "Arial", sans-serif';
        ctx.fillText('POWERED BY', centerX, 830);
        ctx.drawImage(sLogo, centerX - sLogoWidth / 2, 840, sLogoWidth, sLogoHeight);
      }
    } catch (e) { }
  }

  // 8. Bottom Branding
  ctx.fillStyle = '#002e8a';
  ctx.font = 'bold 22px "Arial", sans-serif';
  ctx.fillText('A PRODUCT OF TARKSHYA SOLUTION', centerX, sponsor ? 895 : 885);

  // 9. Straight Text in Red Area (Replacing Arched Text)
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 60px "Arial", sans-serif';
  ctx.fillText('SCAN IN EMERGENCY', centerX, 1030);

  ctx.font = 'bold 30px "Arial", sans-serif';
  ctx.fillText('FOR IMMEDIATE HELP & ALERTS', centerX, 1085);

  // Removed Hole Punch Marker


  // 10. Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);

  return {
    filePath,
    fileName,
    base64: `data:image/png;base64,${buffer.toString('base64')}`,
    publicUrl,
    qrImageUrl: `/uploads/qrcodes/${fileName}`,
  };
}

/**
 * LANDSCAPE (Exact Credit Card Size: 3.37 x 2.125 inches)
 * Designed to match Portrait branding
 */
const generateLandscapeQRCode = async (tagCode, publicUrl, filePath, fileName, sponsor, assetType) => {
  const canvasWidth = 1011;
  const canvasHeight = 638;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  // 1. Draw Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Left Side Blue Panel
  const blueWidth = 400;
  const blueHeight = 540; // Leave space for red footer
  const blueGrad = ctx.createLinearGradient(0, 0, 0, blueHeight);
  blueGrad.addColorStop(0, '#002e8a');
  blueGrad.addColorStop(1, '#001a52');
  ctx.fillStyle = blueGrad;
  ctx.fillRect(0, 0, blueWidth, blueHeight);

  // 3. FULL WIDTH Red Footer (Matching Portrait)
  const redHeight = 98;
  const redGrad = ctx.createLinearGradient(0, canvasHeight - redHeight, 0, canvasHeight);
  redGrad.addColorStop(0, '#cc0000');
  redGrad.addColorStop(1, '#880000');
  ctx.fillStyle = redGrad;
  ctx.fillRect(0, canvasHeight - redHeight, canvasWidth, redHeight);

  // 4. Logo Positioning (Top Left Blue area) - Moved up to fix overlap
  try {
    const logoRelPath = path.join(__dirname, '..', '..', 'public', 'images', 'new_logo.png');
    if (fs.existsSync(logoRelPath)) {
      const logo = await loadImage(logoRelPath);
      const logoWidth = 140;
      const logoAspect = logo.height / logo.width;
      const logoHeight = logoWidth * logoAspect;
      ctx.drawImage(logo, (blueWidth - logoWidth) / 2, 35, logoWidth, logoHeight);
    }
  } catch (err) { }

  // 5. Header Branding Text - Moved down to fix overlap
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 70px "Arial", sans-serif';
  ctx.fillText('V-KAWACH', blueWidth / 2, 280);

  ctx.font = 'bold 24px "Arial", sans-serif';
  ctx.letterSpacing = "6px";
  ctx.globalAlpha = 0.8;
  ctx.fillText('SECURING YOUR WORLD', blueWidth / 2, 335);

  ctx.font = 'bold 36px "Arial", sans-serif';
  ctx.letterSpacing = "8px";
  ctx.globalAlpha = 1.0;
  const safetyLabel = assetType === 'pet' ? 'PET SAFETY' : 
                     (assetType === 'person' ? 'PERSONAL SAFETY' : 
                     (assetType === 'vehicle' ? 'VEHICLE SAFETY' : 
                     (assetType === 'student' ? 'STUDENT SAFETY' : 'EMPLOYEE SAFETY')));
  ctx.fillText(safetyLabel, blueWidth / 2, 400);
  ctx.globalAlpha = 1.0;
  ctx.letterSpacing = "0px";

  // Silver Separator (Like portrait)
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, blueHeight - 2, blueWidth, 2);

  // 6. Right side Content (White Area)
  const rightAreaX = blueWidth;
  const rightAreaWidth = canvasWidth - blueWidth;
  
  // ID Label - Moved up slightly
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px "Arial", sans-serif';
  ctx.letterSpacing = "8px";
  ctx.fillText(`${assetType.toUpperCase()} ID: ${tagCode}`, rightAreaX + rightAreaWidth/2, 60);

  // QR Code Area
  const qrBoxSize = 340;
  const qrBoxX = rightAreaX + (rightAreaWidth - qrBoxSize) / 2;
  const qrBoxY = 110; // Shifted down to provide space for ID label
  
  const qrSize = 280;
  const qrBuffer = await QRCode.toBuffer(publicUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: qrSize,
    color: { dark: '#000000', light: '#ffffff' }
  });
  const qrImage = await loadImage(qrBuffer);

  // QR shadow box
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 30);
  ctx.fill();
  ctx.restore();

  ctx.drawImage(qrImage, qrBoxX + (qrBoxSize - qrSize)/2, qrBoxY + (qrBoxSize - qrSize)/2, qrSize, qrSize);

  // Branding in white section
  ctx.fillStyle = '#002e8a';
  ctx.font = 'bold 22px "Arial", sans-serif';
  ctx.fillText('A PRODUCT OF TARKSHYA SOLUTION', rightAreaX + rightAreaWidth/2, 475);

  // 7. Red Footer Text (SCAN IN EMERGENCY)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 50px "Arial", sans-serif';
  ctx.fillText('SCAN IN EMERGENCY', canvasWidth / 2, canvasHeight - 52);
  
  ctx.font = 'bold 24px "Arial", sans-serif';
  ctx.fillText('FOR IMMEDIATE HELP & ALERTS', canvasWidth / 2, canvasHeight - 12);
  ctx.letterSpacing = "0px";

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);

  return {
    filePath,
    fileName,
    base64: `data:image/png;base64,${buffer.toString('base64')}`,
    publicUrl,
    qrImageUrl: `/uploads/qrcodes/${fileName}`,
  };
}

module.exports = { generateQRCode };

