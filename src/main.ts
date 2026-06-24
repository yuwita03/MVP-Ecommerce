import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import { DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Izinkan request dari FE localhost
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
});
app.setGlobalPrefix('api');
console.log('🔥 CORS BOOTSTRAPPED');
  //Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('SaaS E-Commerce API')
    .setDescription('API dokumentasi')
    .setVersion('1.0')
    .addBearerAuth() // tambah auth token di swagger
    .build()

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('/api/docs', app, document)
  

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
