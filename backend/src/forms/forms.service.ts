// src/forms/forms.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';


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

  async fillPdf(
    fileName: string,
    boxValues: Record<string, string>,
  ): Promise<{filledPdfPath: string, boxValuesPath: string, inputPdfPath: string}> {
    const projectRoot = process.cwd();

    // original uploaded PDF
    const inputPdfPath = path.join(projectRoot, 'uploads', fileName);
    if (!fs.existsSync(inputPdfPath)) {
      throw new InternalServerErrorException(
        `Input PDF not found: ${inputPdfPath}`,
      );
    }

    // ensure temp + output dirs
    const tmpDir = path.join(projectRoot, 'tmp');
    const outDir = path.join(projectRoot, 'outputs');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // write boxValues to JSON so Python can read them
    const boxValuesPath = path.join(
      tmpDir,
      `box_values_${Date.now()}.json`,
    );
    fs.writeFileSync(boxValuesPath, JSON.stringify(boxValues, null, 2), 'utf-8');

    // where Python will write final PDF
    const outputFileName = `filled_${Date.now()}_${fileName}`;
    const outputPdfPath = path.join(outDir, outputFileName);

    // python script
    const scriptPath = path.join(
      projectRoot,
      'python',
      'fill_from_boxes.py',
    );

    // spawn Python
    const args = [scriptPath, inputPdfPath, boxValuesPath, outputPdfPath];

    const result = await new Promise<{ code: number; stderr: string }>(
      (resolve) => {
        const py = spawn('python3', args);

        let stderr = '';

        py.stdout.on('data', (data) => {
          console.log(`Python stdout: ${data}`);
        });

        py.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        py.on('close', (code) => {
          resolve({ code: code ?? 0, stderr });
        });
      },
    );

    if (result.code !== 0) {
      throw new InternalServerErrorException(
        `Python fill_from_boxes.py failed (code ${result.code}): ${result.stderr}`,
      );
    }

    if (!fs.existsSync(outputPdfPath)) {
      throw new InternalServerErrorException(
        `Filled PDF not generated: ${outputPdfPath}`,
      );
    }

    return {filledPdfPath: outputPdfPath, boxValuesPath: boxValuesPath, inputPdfPath: inputPdfPath };
  }
}
