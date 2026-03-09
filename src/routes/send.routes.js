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
const partnerRequestRecipients = ['info@starvanlinesmovers.com'];

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

const toHtmlText = (value) => String(value ?? '-').replaceAll('\n', '<br/>');

const parsePartnerFields = (rawFields) => {
  if (!rawFields) return [];

  let parsed = rawFields;
  if (typeof rawFields === 'string') {
    try {
      parsed = JSON.parse(rawFields);
    } catch (_error) {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((field) => field && typeof field === 'object')
    .map((field) => ({
      key: pick(field, ['key'], ''),
      label: pick(field, ['label'], ''),
      value: pick(field, ['value'], '-')
    }));
};

const formatPartnerFieldsHtml = (rawFields, body) => {
  const parsedFields = parsePartnerFields(rawFields);

  if (parsedFields.length) {
    return parsedFields
      .map((field) => `<b>${field.label || field.key || 'Field'}:</b> ${toHtmlText(field.value)}`)
      .join('<br/>');
  }

  const excludedKeys = new Set([
    'PageUrl',
    'pageUrl',
    'FormType',
    'Position',
    'position',
    'PositionKey',
    'positionKey',
    'Fields',
    ...(config.utmTags || [])
  ]);

  return Object.entries(body || {})
    .filter(([key]) => !excludedKeys.has(key))
    .map(([key, value]) => `<b>${key}:</b> ${toHtmlText(value)}`)
    .join('<br/>');
};

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

router.post('/partnerRequest', async (req, res) => {
  try {
    const body = req.body || {};
    log('INFO', `Processing partnerRequest [${req.requestId}]`, { body });

    const utmCookies = getUtmCookies(req);
    const html = renderTemplate('partnerRequest.html', {
      fullName: pick(body, ['ClientName', 'clientName', 'FullName', 'fullName', 'name'], '-'),
      phoneNumber: pick(body, ['PhoneNumber', 'phoneNumber', 'Phone', 'phone', 'tel'], '-'),
      email: pick(body, ['EmailAddress', 'emailAddress', 'Email', 'email'], '-'),
      position: pick(body, ['Position', 'position'], '-'),
      positionKey: pick(body, ['PositionKey', 'positionKey'], '-'),
      fieldsHtml: formatPartnerFieldsHtml(body.Fields, body) || '-',
      pageUrl: pick(body, ['PageUrl', 'pageUrl'], '-'),
      utmCookies: utmCookies.join('<br/>')
    });

    await mailService.sendMail({
      subject: 'New Partner Request',
      html,
      to: partnerRequestRecipients,
      priority: 'high'
    });

    res.sendStatus(200);
  } catch (error) {
    return handleError(res, error);
  }
});

router.post('/reviewRequest', async (req, res) => {
  try {
    const body = req.body || {};
    log('INFO', `Processing reviewRequest [${req.requestId}]`, { body });

    const utmCookies = getUtmCookies(req);
    const html = renderTemplate('reviewRequest.html', {
      userName: pick(body, ['ClientName', 'clientName', 'FullName', 'fullName', 'UserName', 'userName', 'name'], '-'),
      starsRating: pick(body, ['StarsRating', 'starsRating', 'rating'], '-'),
      fromZip: pick(body, ['FromZip', 'fromZip', 'from'], '-'),
      toZip: pick(body, ['ToZip', 'toZip', 'to'], '-'),
      fromCity: pick(body, ['FromCity', 'fromCity'], '-'),
      toCity: pick(body, ['ToCity', 'toCity'], '-'),
      route: pick(body, ['Route', 'route'], '-'),
      comment: toHtmlText(pick(body, ['Comment', 'comment', 'CommentBody', 'commentBody'], '-')),
      mediaType: pick(body, ['MediaType', 'mediaType'], '-'),
      mediaUrl: pick(body, ['MediaUrl', 'mediaUrl'], '-'),
      pageUrl: pick(body, ['PageUrl', 'pageUrl'], '-'),
      utmCookies: utmCookies.join('<br/>')
    });

    await mailService.sendMail({
      subject: 'New Review Request',
      html,
      to: partnerRequestRecipients,
      priority: 'high'
    });

    res.sendStatus(200);
  } catch (error) {
    return handleError(res, error);
  }
});

export default router;


