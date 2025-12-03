import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';


async function bootstrap() {
  const port = 3000;
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'public'));
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.use((req, res, next) => {
    // Let API routes pass through (adjust prefix if needed)
    if (req.path.startsWith('/forms') || req.path.startsWith('/api')) {
      return next();
    }

    // Only handle GET requests for the SPA
    if (req.method !== 'GET') {
      return next();
    }

    // Serve the React index.html for everything else
    return res.sendFile(join(__dirname, '..', 'public', 'index.html'));
  });
  await app.listen(process.env.PORT ?? port);
}
bootstrap();
