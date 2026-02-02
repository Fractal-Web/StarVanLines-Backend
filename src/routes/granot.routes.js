import { Router } from 'express';
import axios from 'axios';
import { config } from '../config.js';
import { isValidPhone, phoneValidationMessage } from '../utils/phoneValidation.js';
import { log } from '../utils/logger.js';

const router = Router();

router.post('/send', async (req, res) => {
  log('INFO', `Processing Granot lead request [${req.requestId}]`);

  try {
    const payload = req.body || {};
    if (!isValidPhone(payload.phone1)) {
      return res.status(400).json({
        success: false,
        error: phoneValidationMessage,
        timestamp: new Date().toISOString()
      });
    }

    const granotData = new URLSearchParams({
      firstname: payload.firstname || '',
      ozip: payload.ozip || '',
      dzip: payload.dzip || '',
      volume: payload.volume || '',
      movesize: payload.movesize || '',
      movedte: payload.movedte || '',
      phone1: payload.phone1 || '',
      email: payload.email || '',
      label: payload.label || ''
    });

    const response = await axios.post(
      'https://lead.hellomoving.com/LEADSGWHTTP.lidgw?API_ID=E432CD67C51E&MOVERREF=justin@starvanlinesmovers.com',
      granotData,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        validateStatus: () => true
      }
    );

    log('INFO', `Granot API response [${req.requestId}]: ${response.status}`, { data: response.data });

    if (response.status >= 200 && response.status < 300) {
      return res.status(200).json({
        success: true,
        message: 'Data sent to Granot successfully',
        timestamp: new Date().toISOString()
      });
    }

    return res.status(response.status).json({
      success: false,
      error: `HTTP ${response.status}: ${typeof response.data === 'string' ? response.data : JSON.stringify(response.data)}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
