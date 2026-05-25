import axios, { AxiosInstance } from 'axios';
import { config } from '@/config/index.js';
import logger from '@/utils/logger.js';

interface ServiceConfig {
  name: string;
  baseUrl: string;
  routes: string[];
  healthCheck: string;
}

interface ServiceRegistry {
  [key: string]: ServiceConfig;
}

class APIGateway {
  private registry: ServiceRegistry = {};
  private clients: Map<string, AxiosInstance> = new Map();

  constructor() {
    this.initializeRegistry();
  }

  private initializeRegistry(): void {
    this.registry = {
      dashboard: {
        name: 'dashboard',
        baseUrl: config.services.dashboard,
        routes: ['/api/dashboard/*'],
        healthCheck: '/health',
      },
      clients: {
        name: 'clients',
        baseUrl: config.services.clients,
        routes: ['/api/clients/*'],
        healthCheck: '/health',
      },
      subscriptions: {
        name: 'subscriptions',
        baseUrl: config.services.subscriptions,
        routes: ['/api/subscriptions/*'],
        healthCheck: '/health',
      },
      staff: {
        name: 'staff',
        baseUrl: config.services.staff,
        routes: ['/api/staff/*'],
        healthCheck: '/health',
      },
      departments: {
        name: 'departments',
        baseUrl: config.services.departments,
        routes: ['/api/departments/*'],
        healthCheck: '/health',
      },
      projects: {
        name: 'projects',
        baseUrl: config.services.projects,
        routes: ['/api/projects/*'],
        healthCheck: '/health',
      },
      vault: {
        name: 'vault',
        baseUrl: config.services.vault,
        routes: ['/api/vault/*'],
        healthCheck: '/health',
      },
      office: {
        name: 'office',
        baseUrl: config.services.office,
        routes: ['/api/office/*'],
        healthCheck: '/health',
      },
      marketing: {
        name: 'marketing',
        baseUrl: config.services.marketing,
        routes: ['/api/marketing/*'],
        healthCheck: '/health',
      },
      sms: {
        name: 'sms',
        baseUrl: config.services.sms,
        routes: ['/api/sms/*'],
        healthCheck: '/health',
      },
      support: {
        name: 'support',
        baseUrl: config.services.support,
        routes: ['/api/support/*'],
        healthCheck: '/health',
      },
      finance: {
        name: 'finance',
        baseUrl: config.services.finance,
        routes: ['/api/finance/*'],
        healthCheck: '/health',
      },
      security: {
        name: 'security',
        baseUrl: config.services.security,
        routes: ['/api/security/*'],
        healthCheck: '/health',
      },
      developer: {
        name: 'developer',
        baseUrl: config.services.developer,
        routes: ['/api/developer/*'],
        healthCheck: '/health',
      },
      products: {
        name: 'products',
        baseUrl: config.services.products,
        routes: ['/api/products/*'],
        healthCheck: '/health',
      },
    };

    // Initialize HTTP clients for each service
    for (const [key, service] of Object.entries(this.registry)) {
      this.clients.set(
        key,
        axios.create({
          baseURL: service.baseUrl,
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    }

    logger.info('API Gateway registry initialized with 15 services');
  }

  /**
   * Get the service configuration for a given path
   */
  getServiceForPath(path: string): ServiceConfig | null {
    for (const service of Object.values(this.registry)) {
      for (const route of service.routes) {
        if (this.matchRoute(path, route)) {
          return service;
        }
      }
    }
    return null;
  }

  /**
   * Match a path against a route pattern
   */
  private matchRoute(path: string, pattern: string): boolean {
    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/\//g, '\\/')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  /**
   * Get HTTP client for a service
   */
  getClient(serviceName: string): AxiosInstance | null {
    return this.clients.get(serviceName) || null;
  }

  /**
   * Get all registered services
   */
  getServices(): ServiceRegistry {
    return this.registry;
  }

  /**
   * Check if a service is registered
   */
  isServiceRegistered(serviceName: string): boolean {
    return serviceName in this.registry;
  }

  /**
   * Get service configuration
   */
  getServiceConfig(serviceName: string): ServiceConfig | null {
    return this.registry[serviceName] || null;
  }
}

// Singleton instance
let gatewayInstance: APIGateway | null = null;

export function initializeGateway(): APIGateway {
  if (!gatewayInstance) {
    gatewayInstance = new APIGateway();
  }
  return gatewayInstance;
}

export function getGateway(): APIGateway {
  if (!gatewayInstance) {
    throw new Error('Gateway not initialized. Call initializeGateway first.');
  }
  return gatewayInstance;
}

export default APIGateway;
