import nodemailer from 'nodemailer';
import { config } from '../config.js';
import { log } from '../utils/logger.js';

export class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.mail.smtp.host,
      port: config.mail.smtp.port,
      secure: config.mail.smtp.port === 465,
      auth: {
        user: config.mail.smtp.user,
        pass: config.mail.smtp.pass
      }
    });
  }

  async sendMail({ subject, html, to = [], priority = 'normal', attachments = [] }) {
    if (!config.mail.smtp.pass) {
      log('ERROR', 'SMTP credentials missing: set SMTP_PASSWORD in config/env');
      throw new Error('SMTP credentials missing: set SMTP_PASSWORD in config/env');
    }

    const mailOptions = {
      from: {
        name: config.mail.fromName,
        address: config.mail.from
      },
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      priority,
      attachments
    };

    log('INFO', `Attempting to send email: "${subject}" to ${mailOptions.to.join(', ')}`);

    try {
      const info = await this.transporter.sendMail(mailOptions);
      log('INFO', `Email sent successfully: ${info.messageId}`, { response: info.response });
      return info;
    } catch (error) {
      log('ERROR', `Failed to send email: "${subject}"`, { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

export const mailService = new MailService();


