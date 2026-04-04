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
const generateQRCode = async (tagCode, designType = 'standard', sponsor = null, assetType = 'vehicle') => {
  const publicUrl = `${process.env.PUBLIC_TAG_BASE_URL || 'http://localhost:3000/tag'}/${tagCode}`;
  const fileName = `qr_${designType}_${tagCode}.png`;
  const filePath = path.join(qrDir, fileName);

  if (designType === 'circle') {
    return await generateCircleQRCode(tagCode, publicUrl, filePath, fileName, sponsor, assetType);
  }

  // DEFAULT: Standard Vertical Design
  const canvasWidth = 1200;
  const canvasHeight = 1800;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  // Blue Header
  const bgGradient = ctx.createLinearGradient(0, 0, 0, 520);
  bgGradient.addColorStop(0, '#002e8a');
  bgGradient.addColorStop(1, '#001a52');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvasWidth, 520);

  // Silver Separator
  const sepGradient = ctx.createLinearGradient(0, 520, 0, 540);
  sepGradient.addColorStop(0, '#737373');
  sepGradient.addColorStop(0.3, '#d4d4d4');
  sepGradient.addColorStop(1, '#f5f5f5');
  ctx.fillStyle = sepGradient;
  ctx.fillRect(0, 520, canvasWidth, 20);

  // White Middle Area
  ctx.fillStyle = '#f9fafb';
  ctx.fillRect(0, 540, canvasWidth, 940);

  // Red Footer
  const redGradient = ctx.createLinearGradient(0, 1480, 0, 1800);
  redGradient.addColorStop(0, '#b31919');
  redGradient.addColorStop(1, '#7a0a0a');
  ctx.fillStyle = redGradient;
  ctx.fillRect(0, 1480, canvasWidth, 320);

  // Add Project Logo (Updated to new_logo.png for consistency)
  try {
    const logoRelPath = path.join(__dirname, '..', '..', 'public', 'images', 'new_logo.png');
    if (fs.existsSync(logoRelPath)) {
      const logo = await loadImage(logoRelPath);
      const logoWidth = 240;
      const logoAspect = logo.height / logo.width;
      const logoHeight = logoWidth * logoAspect;
      ctx.drawImage(logo, (canvasWidth - logoWidth) / 2, 80, logoWidth, logoHeight);
    }
  } catch (err) { }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 95px "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('V-KAWACH', canvasWidth / 2, 430);

  ctx.font = 'bold 36px "Arial", sans-serif';
  ctx.fillText('SECURING YOUR WORLD', canvasWidth / 2, 485);

  // Asset Type ID (In White Section)
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 32px "Arial", sans-serif';
  ctx.letterSpacing = "10px";
  ctx.fillText(`${assetType.toUpperCase()} ID: ${tagCode}`, canvasWidth / 2, 580);
  ctx.letterSpacing = "0px";

  // QR Code Area
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 40;
  ctx.fillStyle = '#ffffff';

  const boxSize = 740;
  const boxX = (canvasWidth - boxSize) / 2;
  const boxY = sponsor ? 630 : 660; 
  const radius = 50;

  ctx.beginPath();
  ctx.moveTo(boxX + radius, boxY);
  ctx.lineTo(boxX + boxSize - radius, boxY);
  ctx.quadraticCurveTo(boxX + boxSize, boxY, boxX + boxSize, boxY + radius);
  ctx.lineTo(boxX + boxSize, boxY + boxSize - radius);
  ctx.quadraticCurveTo(boxX + boxSize, boxY + boxSize, boxX + boxSize - radius, boxY + boxSize);
  ctx.lineTo(boxX + radius, boxY + boxSize);
  ctx.quadraticCurveTo(boxX, boxY + boxSize, boxX, boxY + boxSize - radius);
  ctx.lineTo(boxX, boxY + radius);
  ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = 'transparent';
  const qrSize = 640;
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
        const sLogoWidth = 180;
        const sLogoAspect = sLogo.height / sLogo.width;
        const sLogoHeight = sLogoWidth * sLogoAspect;
        
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 22px "Arial", sans-serif';
        ctx.fillText('SPONSORED BY', canvasWidth / 2, boxY + boxSize + 45);
        
        ctx.drawImage(sLogo, (canvasWidth - sLogoWidth) / 2, boxY + boxSize + 65, sLogoWidth, sLogoHeight);
      }
    } catch (e) { console.error("Sponsor logo error", e); }
  }

  ctx.fillStyle = '#002e8a';
  ctx.font = 'bold 28px "Arial", sans-serif';
  ctx.fillText('A PRODUCT OF TARKSHYA SOLUTION', canvasWidth / 2, 1465);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 85px "Arial", sans-serif';
  ctx.fillText('SCAN IN EMERGENCY', canvasWidth / 2, 1630);

  ctx.font = 'bold 42px "Arial", sans-serif';
  ctx.fillText('FOR IMMEDIATE HELP & ALERTS', canvasWidth / 2, 1710);

  // 10. Final Hole Punch Marker (TOP LAYER)
  ctx.beginPath();
  ctx.arc(canvasWidth / 2, 50, 28, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 4;
  ctx.stroke();

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

  // 2. Draw Blue Header Area (Arched) - Top 40%
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, size / 2 - 10, Math.PI * 1, Math.PI * 2);
  ctx.lineTo(centerX + size / 2, centerY - 120);
  ctx.lineTo(centerX - size / 2, centerY - 120);
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

  // 4. Logo Positioning
  try {
    const logoRelPath = path.join(__dirname, '..', '..', 'public', 'images', 'new_logo.png');
    if (fs.existsSync(logoRelPath)) {
      const logo = await loadImage(logoRelPath);
      const logoWidth = 180;
      const logoAspect = logo.height / logo.width;
      const logoHeight = logoWidth * logoAspect;
      ctx.drawImage(logo, centerX - logoWidth / 2, 80, logoWidth, logoHeight);
    }
  } catch (err) { }

  // 5. Paws (Design elements)
  const drawPaw = (x, y, scale = 1, color = 'rgba(255, 255, 255, 0.2)') => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    const toes = [[-35, -25], [-15, -45], [15, -45], [35, -25]];
    toes.forEach(([tx, ty]) => {
      ctx.beginPath();
      ctx.arc(tx, ty, 13, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  };
  drawPaw(220, 180, 1.2);
  drawPaw(size - 220, 180, 1.2);

  // 6. Header Branding Text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 90px "Arial", sans-serif';
  ctx.fillText('V-KAWACH', centerX, 360);

  ctx.font = 'bold 36px "Arial", sans-serif';
  ctx.letterSpacing = "8px";
  ctx.globalAlpha = 0.8;
  ctx.fillText('PET SAFETY', centerX, 425);
  ctx.globalAlpha = 1.0;
  ctx.letterSpacing = "0px";

  // ID & Asset Type Label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px "Arial", sans-serif';
  ctx.letterSpacing = "12px";
  ctx.globalAlpha = 0.6;
  ctx.fillText(`${assetType.toUpperCase()} ID: ${tagCode}`, centerX, 465);
  ctx.globalAlpha = 1.0;
  ctx.letterSpacing = "0px";

  // 7. QR Code in White Area
  const qrSize = 340;
  const qrBuffer = await QRCode.toBuffer(publicUrl, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: qrSize,
    color: { dark: '#000000', light: '#ffffff' }
  });
  const qrImage = await loadImage(qrBuffer);

  ctx.shadowColor = 'rgba(255, 153, 0, 0.4)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#ffffff';
  // Perfectly centered in current white section
  const qrTop = 500;
  ctx.fillRect(centerX - qrSize / 2 - 10, qrTop - 10, qrSize + 20, qrSize + 20);
  ctx.shadowBlur = 0;
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
        ctx.fillText('POWERED BY', centerX, 850);
        ctx.drawImage(sLogo, centerX - sLogoWidth / 2, 860, sLogoWidth, sLogoHeight);
      }
    } catch (e) { }
  }

  // 8. Bottom Branding
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 30px "Arial", sans-serif';
  ctx.fillText('TARKSHYA SOLUTION', centerX, sponsor ? 905 : 885);

  // 9. Arched Text in Red Area
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 45px "Arial", sans-serif'; // Reduced from 60px

  const text = "SCAN TO FIND OWNER";
  const radiusText = size / 2 - 50; // 550 - Reduced bottom margin even more
  const totalAngle = Math.PI * 0.5; // Narrower arc for cleaner look
  const anglePerChar = totalAngle / text.length;

  ctx.rotate(totalAngle / 2); // Center symmetry
  for (let i = 0; i < text.length; i++) {
    ctx.save();
    ctx.rotate(-i * anglePerChar);
    ctx.fillText(text[i], 0, radiusText);
    ctx.restore();
  }
  ctx.restore();

  // 11. Final Hole Punch Marker (TOP LAYER)
  ctx.beginPath();
  ctx.arc(centerX, 50, 28, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 4;
  ctx.stroke();

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

module.exports = { generateQRCode };
