import "@shredder/config/env-bootstrap";
import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const origin = process.env["FRONTEND_URL"];
  app.enableCors({
    origin: origin === undefined || origin === "" ? true : origin.split(",").map((s) => s.trim()),
    credentials: true,
  });
  const port = process.env["PORT"] ?? "3001";
  await app.listen(port);
  console.log(`API listening on ${port}`);
}

void bootstrap();
