import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultEnvPath = path.resolve(__dirname, '../config/env');
const envPath = process.env.ENV_FILE || defaultEnvPath;
dotenv.config({ path: envPath });

const parseList = (value, def = []) => {
  if (!value || typeof value !== 'string') return def;
  return value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
};

const resolvePath = (p) => {
  if (!p) return p;
  return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
};

export const config = {
  port: Number(process.env.PORT),
  nodeEnv: process.env.NODE_ENV,
  cors: {
    allowedOrigins: parseList(process.env.ALLOWED_ORIGINS)
  },
  mail: {
    from: process.env.MAIL_FROM,
    fromName: process.env.MAIL_FROM_NAME,
    adminEmails: parseList(process.env.MAIL_ADMIN_EMAILS),
    adminEmailsUtm: parseList(process.env.MAIL_ADMIN_EMAILS_UTM),
    smtp: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD
    }
  },
  utmTags: parseList(process.env.UTM_TAGS),
  movegistics: {
    token: process.env.MOVEGISTICS_TOKEN
  },
  checklistPdfPath: resolvePath(process.env.CHECKLIST_PDF_PATH),
  templatesDir: resolvePath(process.env.TEMPLATES_DIR)
};


