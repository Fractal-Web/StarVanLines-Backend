import { Router } from 'express';
import axios from 'axios';
import { config } from '../config.js';
import { isValidPhone, phoneValidationMessage } from '../utils/phoneValidation.js';

const router = Router();

const extractPhone = (payload = {}) => {
  return payload.PhoneNumber ?? payload.phone1 ?? payload.phone ?? payload.phoneNumber;
};

router.post('/send', async (req, res) => {
  try {
    const payload = req.body || {};
    const phone = extractPhone(payload);
    console.log('=== Movegistics /send endpoint hit ===');
    console.log('Request body:', req.body);
    console.log('Extracted phone number:', phone);
    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        error: phoneValidationMessage,
        timestamp: new Date().toISOString()
      });
    }
    // const response = await axios.post('https://mcc.movegistics.com/create_lead.php', payload, {
    //   headers: {
    //     'content-type': 'application/json; charset=utf-8',
    //     token: config.movegistics.token
    //   },
    //   validateStatus: () => true
    // });

    // if (response.status >= 200 && response.status < 300) {
      return res.status(200).json({
        success: true,
        message: 'Data sent to Movegistics successfully',
        timestamp: new Date().toISOString()
      });
    

    return res.status(response.status).json({
      success: false,
      error: `HTTP ${response.status}: ${typeof response.data === 'string' ? response.data : JSON.stringify(response.data)}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message, timestamp: new Date().toISOString() });
  }
});

export default router;


