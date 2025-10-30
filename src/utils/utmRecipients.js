import { config } from '../config.js';

const getAllData = (req) => ({ ...(req?.query || {}), ...(req?.body || {}) });

const getUtmKeys = () => (Array.isArray(config.utmTags) && config.utmTags.length ? config.utmTags : null);

const getUtmEntries = (req) => {
  const all = getAllData(req);
  const keys = getUtmKeys();
  if (keys) {
    return keys
      .filter((k) => k in all)
      .map((k) => [k, all[k]]);
  }
  return Object.entries(all).filter(([k]) => typeof k === 'string' && k.toLowerCase().startsWith('utm'));
};

export const hasUtm = (req) => {
  return getUtmEntries(req).some(([, v]) => String(v ?? '').trim() !== '');
};

const hasTopsmm = (req) => {
  const entries = getUtmEntries(req);
  return entries.some(([, v]) => String(v ?? '').toLowerCase().includes('topsmm'));
};

const uniqueEmails = (arr) => Array.from(new Set((arr || []).map((e) => String(e).trim()).filter(Boolean)));

export const selectAdminRecipients = (req) => {
  const base = Array.isArray(config.mail?.adminEmails) ? config.mail.adminEmails : [];
  const utm = Array.isArray(config.mail?.adminEmailsUtm) ? config.mail.adminEmailsUtm : [];

  let recipients = [...base];
  if (hasUtm(req) && utm.length > 0 && !hasTopsmm(req)) {
    recipients = [...recipients, ...utm];
  }
  return uniqueEmails(recipients);
};
