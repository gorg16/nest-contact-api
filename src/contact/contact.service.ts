import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { CreateContactDto } from './dto/create-contact.dto';
import { createTransport } from 'nodemailer';

@Injectable()
export class ContactService {
  private readonly emailProvider: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.emailProvider = this.configService.get<string>('EMAIL_PROVIDER');

    if (
      this.emailProvider === 'sendgrid' &&
      this.configService.get('SENDGRID_API_KEY')
    ) {
      sgMail.setApiKey(
        this.configService.get<string>('SENDGRID_API_KEY') as string,
      );
    }
  }

  async sendContactEmail(contactData: CreateContactDto) {
    switch (this.emailProvider) {
      case 'sendgrid':
        return this.sendWithSendGrid(contactData);
      case 'smtp':
        return this.sendWithSMTP(contactData);
      default:
        throw new Error(
          `Invalid EMAIL_PROVIDER: ${this.emailProvider}. Use "sendgrid" or "smtp".`,
        );
    }
  }

  private async sendWithSendGrid(contactData: CreateContactDto) {
    const senderEmail = this.configService.get<string>('SENDGRID_SENDER_EMAIL');

    const msg = {
      to: senderEmail,
      from: contactData.email,
      subject: `New Contact Request from ${contactData.name}`,
      text: `Name: ${contactData.name}\nEmail: ${contactData.email}\nPhone: ${contactData.phone}\nMessage: ${contactData.description}`,
    };

    try {
      await sgMail.send(msg);
      return { message: 'Email sent successfully with SendGrid!' };
    } catch (error) {
      console.error('Error sending email via SendGrid:', error);
      throw new Error('Failed to send email with SendGrid');
    }
  }

  private async sendWithSMTP(contactData: CreateContactDto) {
    const transporter = createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USERNAME'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    });

    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM_EMAIL'),
      to: contactData.email,
      subject: `New Contact Request from ${contactData.name}`,
      text: `Name: ${contactData.name}\nEmail: ${contactData.email}\nPhone: ${contactData.phone}\nMessage: ${contactData.description}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      return { message: 'Email sent successfully with SMTP!' };
    } catch (error) {
      console.error('Error sending email via SMTP:', error);
      throw new Error('Failed to send email with SMTP');
    }
  }
}
