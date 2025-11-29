// src/forms/forms.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';

@Injectable()
export class FormsService {
  private readonly logger = new Logger(FormsService.name);

  async detectBoxes(pdfPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Adjust this path to where detect_boxes.py is located
      const scriptPath = path.join(
        __dirname,
        '..',
        '..',
        'python',
        'detect_boxes.py',
      );

      const py = spawn('python3', [scriptPath, pdfPath]);

      let stdout = '';
      let stderr = '';

      py.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      py.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      py.on('close', (code) => {
        if (code !== 0) {
          return reject(
            new Error(`Python exited with code ${code}: ${stderr}`),
          );
        }

        try {
          const json = JSON.parse(stdout);
          resolve(json);
        } catch (err) {
          reject(
            new Error(`Failed to parse Python JSON. Output was: ${stdout}`),
          );
        }
      });
    });
  }
}
