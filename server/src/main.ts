import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Global validation pipe — rejects requests with unknown/invalid fields.
  // whitelist: strips any properties not present in the DTO.
  // forbidNonWhitelisted: returns 400 if unknown properties are sent.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  const port = process.env.PORT ?? 3001
  await app.listen(port)
  console.log(`RouteLog API listening on http://localhost:${port}`)
}

bootstrap()
