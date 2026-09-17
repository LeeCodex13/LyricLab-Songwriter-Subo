const QRCode = require('qrcode');

function crc16(data) {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= (data.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function generatePromptPayPayload(target, amount) {
  const sanitized = (target || '').replace(/[^0-9]/g, '');
  let targetType = '01'; // phone
  let formattedTarget = '';
  
  if (sanitized.length === 10) {
    targetType = '01';
    formattedTarget = '0066' + sanitized.substring(1);
  } else if (sanitized.length === 13) {
    targetType = '02';
    formattedTarget = sanitized;
  } else {
    targetType = '01';
    formattedTarget = sanitized ? '0066' + sanitized.substring(1) : '0066800000000';
  }

  const tag29_00 = '0016A000000677010111';
  const tag29_sub = targetType + String(formattedTarget.length).padStart(2, '0') + formattedTarget;
  const tag29_value = tag29_00 + tag29_sub;
  const tag29 = '29' + String(tag29_value.length).padStart(2, '0') + tag29_value;

  let payload = '000201';
  payload += (amount && Number(amount) > 0) ? '010212' : '010211';
  payload += tag29;
  payload += '5303764'; // THB

  if (amount && Number(amount) > 0) {
    const amtStr = Number(amount).toFixed(2);
    payload += '54' + String(amtStr.length).padStart(2, '0') + amtStr;
  }

  payload += '5802TH';
  payload += '6304';
  const checksum = crc16(payload);
  return payload + checksum;
}

async function generateQRCodeDataURL(target, amount) {
  const payload = generatePromptPayPayload(target, amount);
  return await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 6,
    color: {
      dark: '#00264d',
      light: '#ffffff'
    }
  });
}

module.exports = {
  generatePromptPayPayload,
  generateQRCodeDataURL
};
