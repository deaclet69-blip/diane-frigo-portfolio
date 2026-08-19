import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // bodyParser: false pour appliquer nous-mêmes une limite plus haute que
  // le défaut d'Express (100kb), nécessaire pour accepter les images de
  // produit envoyées en base64 (voir ProductsModule).
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(json({ limit: '6mb' }));
  app.use(urlencoded({ extended: true, limit: '6mb' }));

  app.use(helmet());
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.setGlobalPrefix('api');

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  console.log(`DIANE FRIGO API démarrée sur http://localhost:${port}/api`);
}
bootstrap();
