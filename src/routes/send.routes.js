import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config.js';
import { renderTemplate } from '../templates/templateCache.js';
import { mailService } from '../mail/mail.service.js';
import { selectAdminRecipients } from '../utils/utmRecipients.js';
import { isValidPhone, phoneValidationMessage } from '../utils/phoneValidation.js';
import { log } from '../utils/logger.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = config.templatesDir || path.resolve(__dirname, '..', 'templates');

function replacePlaceholders(template, replacements) {
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replaceAll(`{${key}}`, String(value ?? '-'));
  }
  return result;
}

function getUtmCookies(req) {
  // return []; // TODO: Remove this after testing
  const tags = config.utmTags;
  const utm = [];
  for (const tag of tags) {
    const value = req.body?.[tag];
    if (value) utm.push(`<b>${tag}:</b> ${value}`);
  }
  return utm;
}

function handleError(res, error) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
  return res.status(500).json({ error: error?.message || 'Internal Server Error' });
}

function pick(body, keys, fallback = undefined) {
  for (const k of keys) {
    if (body && body[k] !== undefined && body[k] !== null && body[k] !== '') return body[k];
  }
  return fallback;
}

const ensureValidPhone = (res, value) => {
  if (!isValidPhone(value)) {
    res.status(400).json({ error: phoneValidationMessage });
    return false;
  }
  return true;
};

router.post('/movingRequest', async (req, res) => {
  try {
    const { ClientName, PhoneNumber, EmailAddress, ZipFrom, ZipTo, PageUrl } = req.body || {};
    if (!ensureValidPhone(res, PhoneNumber)) return;
    log('INFO', `Processing movingRequest [${req.requestId}]`, { body: req.body });
    const utmCookies = getUtmCookies(req);
    // console.log('utmCookiecdcs', utmCookies);
    const html = renderTemplate('movingRequest.html', {
      clientName: ClientName,
      phoneNumber: PhoneNumber,
      email: EmailAddress,
      zipFrom: ZipFrom,
      zipTo: ZipTo,
      pageUrl: PageUrl,
      utmCookies: utmCookies.join('<br/>')
    });

    await mailService.sendMail({
      subject: 'New Moving Request',
      html,
      to: selectAdminRecipients(req),
      priority: 'high'
    });
    res.sendStatus(200);
  } catch (error) {
    return handleError(res, error);
  }
});

router.post('/newQuote', async (req, res) => {
  try {
    const { ClientName, PhoneNumber, EmailAddress, PageUrl } = req.body || {};
    if (!ensureValidPhone(res, PhoneNumber)) return;
    log('INFO', `Processing newQuote [${req.requestId}]`, { body: req.body });
    const utmCookies = getUtmCookies(req);
    const html = renderTemplate('newQuote.html', {
      clientName: ClientName,
      phoneNumber: PhoneNumber,
      email: EmailAddress,
      utmCookies: utmCookies.join('<br/>'),
      pageUrl: PageUrl
    });

    await mailService.sendMail({
      subject: 'New Moving Request',
      html,
      to: selectAdminRecipients(req),
      priority: 'high'
    });
    res.sendStatus(200);
  } catch (error) {
    return handleError(res, error);
  }
});

router.post('/calculatorLead', async (req, res) => {
  try {
    const {
      firstname,
      email,
      phone1,
      fromzip,
      tozip,
      movedate,
      movetime,
      movesize,
      distance,
      extras,
      clientInventory = [],
      PageUrl
    } = req.body || {};
    if (!ensureValidPhone(res, phone1)) return;
    log('INFO', `Processing calculatorLead [${req.requestId}]`, { body: req.body });

    const inventoryStringArray = (clientInventory || []).map((i) => `
<h3>- ${i?.item?.itemName || ''}*</h3>
<b>Quantity:</b> ${i?.quantity || 0}<br/>
<b>Cubic Feet:</b> ${(i?.cubicFeet || 0) * (i?.quantity || 0)}<br/>
`).join('\n\n');

    const utmCookies = getUtmCookies(req);
    const html = renderTemplate('calculatorLead.html', {
      firstname,
      email,
      phone1,
      fromzip,
      tozip,
      movedate,
      movetime,
      movesize,
      distance,
      extras,
      clientInventory,
      inventoryStringArray,
      utmCookies: utmCookies.join('<br/>'),
      pageUrl: PageUrl
    });

    await mailService.sendMail({
      subject: 'New Calculator Lead',
      html,
      to: selectAdminRecipients(req),
      priority: 'high'
    });
    res.sendStatus(200);
  } catch (error) {
    return handleError(res, error);
  }
});

router.post('/contactRequest', async (req, res) => {
  try {
    const { ClientName, PhoneNumber, EmailAddress, Comment, PageUrl } = req.body || {};
    if (!ensureValidPhone(res, PhoneNumber)) return;
    log('INFO', `Processing contactRequest [${req.requestId}]`, { body: req.body });
    const utmCookies = getUtmCookies(req);
    const html = renderTemplate('contactRequest.html', {
      clientName: ClientName,
      phoneNumber: PhoneNumber,
      email: EmailAddress,
      comment: Comment,
      utmCookies: utmCookies.join('<br/>'),
      pageUrl: PageUrl
    });

    await mailService.sendMail({
      subject: 'New Contact Request',
      html,
      to: selectAdminRecipients(req),
      priority: 'high'
    });
    res.sendStatus(200);
  } catch (error) {
    return handleError(res, error);
  }
});

export default router;


