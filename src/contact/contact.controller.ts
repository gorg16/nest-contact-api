import { Body, Controller, Post } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async sendEmail(@Body() contactData: CreateContactDto) {
    return this.contactService.sendContactEmail(contactData);
  }
}
