import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Allow the Vite dev server (and any configured frontend origin) to call the API.
  // In production this should be locked down to the actual frontend domain.
  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',')
  app.enableCors({ origin: allowedOrigins, credentials: true })

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
