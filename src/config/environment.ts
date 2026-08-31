import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface JwtConfig {
  secret: string;
  expiresIn: string;
}

interface AppConfig {
  port: number;
  nodeEnv: string;
  db: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  jwt: JwtConfig;
  swagger: {
    title: string;
    version: string;
    description: string;
  };
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'riwimedicare_plus',
    user: process.env.DB_USER || 'riwi_user',
    password: process.env.DB_PASSWORD || 'password',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRATION || '24h',
  },

  swagger: {
    title: process.env.SWAGGER_TITLE || 'RiwiMediCare Plus API',
    version: process.env.SWAGGER_VERSION || '1.0.0',
    description: process.env.SWAGGER_DESCRIPTION || 'Backend API for medicine supply management',
  },
};