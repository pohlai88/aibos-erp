import { AppModule } from "./app.module.js";
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";

const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);

await app.listen(3001, "0.0.0.0");
console.log("BFF server running on http://localhost:3001");
