import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Environment
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // API Gateway
  apiGateway: {
    port: parseInt(process.env.API_GATEWAY_PORT || '3000', 10),
    host: process.env.API_GATEWAY_HOST || 'localhost',
  },

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'javalab_hq',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiry: process.env.JWT_EXPIRY || '24h',
  },

  // Message Queue
  messageQueue: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  },

  // Elasticsearch
  elasticsearch: {
    host: process.env.ELASTICSEARCH_HOST || 'localhost',
    port: parseInt(process.env.ELASTICSEARCH_PORT || '9200', 10),
  },

  // WebSocket
  websocket: {
    port: parseInt(process.env.WEBSOCKET_PORT || '3001', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  // Services
  services: {
    dashboard: process.env.DASHBOARD_SERVICE_URL || 'http://localhost:3101',
    clients: process.env.CLIENTS_SERVICE_URL || 'http://localhost:3102',
    subscriptions: process.env.SUBSCRIPTIONS_SERVICE_URL || 'http://localhost:3103',
    staff: process.env.STAFF_SERVICE_URL || 'http://localhost:3104',
    departments: process.env.DEPARTMENTS_SERVICE_URL || 'http://localhost:3105',
    projects: process.env.PROJECTS_SERVICE_URL || 'http://localhost:3106',
    vault: process.env.VAULT_SERVICE_URL || 'http://localhost:3107',
    office: process.env.OFFICE_SERVICE_URL || 'http://localhost:3108',
    marketing: process.env.MARKETING_SERVICE_URL || 'http://localhost:3109',
    sms: process.env.SMS_SERVICE_URL || 'http://localhost:3110',
    support: process.env.SUPPORT_SERVICE_URL || 'http://localhost:3111',
    finance: process.env.FINANCE_SERVICE_URL || 'http://localhost:3112',
    security: process.env.SECURITY_SERVICE_URL || 'http://localhost:3113',
    developer: process.env.DEVELOPER_SERVICE_URL || 'http://localhost:3114',
    products: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3115',
  },
};

export default config;
