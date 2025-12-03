// src/forms/forms.controller.ts
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
  Res,
  Body
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { FormsService } from './forms.service';

import { type Response } from 'express';
import * as fs from 'fs';



interface FillRequestDto {
  file: string; // uploaded file name, e.g. "1699999999-123123.pdf"
  boxValues: Record<string, string>;
}

@Controller('forms')
export class FormsController {
  private readonly logger = new Logger(FormsController.name);
  constructor(private readonly formsService: FormsService) { }

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
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB
      }
    }),
  )
  async detect(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required or is too large file size is limited to 5MB');
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

  @Post('fill')
  async fill(@Body() body: FillRequestDto, @Res() res: Response) {

    try {
      const { file, boxValues } = body;

      if (!file) {
        throw new BadRequestException('file is required');
      }
      if (!boxValues || typeof boxValues !== 'object') {
        throw new BadRequestException('boxValues is required and must be an object');
      }

      // Ask service to generate filled PDF
      const {filledPdfPath, boxValuesPath, inputPdfPath} = await this.formsService.fillPdf(file, boxValues);

      // stream the PDF back to client
      const fileName = path.basename(filledPdfPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileName}"`,
      );

      const stream = fs.createReadStream(filledPdfPath);
      // delete the created files
      stream.on('close', async()=>{
        fs.unlink(boxValuesPath, (err)=>{
          if (err) {
            this.logger.error('Error deleting boxValuesPath', err);
          }
        });
        fs.unlink(filledPdfPath, (err)=>{
          if (err) {
            this.logger.error('Error deleting filledPdfPath', err);
          }
        });
        fs.unlink(inputPdfPath, (err)=>{
          if (err) {
            this.logger.error('Error deleting inputPdfPath', err);
          }
        });
      });
      stream.pipe(res);
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}
