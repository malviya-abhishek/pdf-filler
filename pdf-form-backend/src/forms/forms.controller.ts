// src/forms/forms.controller.ts
import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Logger
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { diskStorage } from 'multer';
  import * as path from 'path';
  import { FormsService } from './forms.service';
  
  @Controller('forms')
  export class FormsController {
    private readonly logger = new Logger(FormsController.name);
    constructor(private readonly formsService: FormsService) {}
  
    @Post('detect')
    @UseInterceptors(
      FileInterceptor('file', {
        storage: diskStorage({
          destination: './uploads', // folder must exist or be created
          filename: (req, file, cb) => {
            const ext = path.extname(file.originalname) || '.pdf';
            const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
            cb(null, name);
          },
        }),
        fileFilter: (req, file, cb) => {
          if (!file.mimetype.includes('pdf')) {
            return cb(new BadRequestException('Only PDF files are allowed'), false);
          }
          cb(null, true);
        },
      }),
    )
    async detect(@UploadedFile() file: Express.Multer.File) {
      if (!file) {
        throw new BadRequestException('File is required');
      }
  
      const pdfPath = path.resolve(file.path);
  
      // Call Python to detect boxes
      const boxes = await this.formsService.detectBoxes(pdfPath);

      this.logger.log("Upload response ready")
  
      return {
        file: file.filename,
        path: pdfPath,
        boxes,
      };
    }
  }
  