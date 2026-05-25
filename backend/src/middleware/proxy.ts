import { Request, Response, NextFunction } from 'express';
import { getGateway } from '@/services/gateway.js';
import logger from '@/utils/logger.js';
import { AppError } from '@/types/index.js';

export async function proxyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const gateway = getGateway();
    const service = gateway.getServiceForPath(req.path);

    if (!service) {
      // Not a service route, continue to next middleware
      next();
      return;
    }

    const client = gateway.getClient(service.name);
    if (!client) {
      throw new AppError(
        'SERVICE_UNAVAILABLE',
        503,
        `Service ${service.name} is not available`
      );
    }

    // Prepare headers
    const headers: Record<string, string> = {
      ...req.headers,
    };

    // Remove host header to avoid conflicts
    delete headers.host;

    // Add authorization header if present
    if (req.headers.authorization) {
      headers.authorization = req.headers.authorization;
    }

    // Add request ID for tracing
    headers['x-request-id'] = (req.headers['x-request-id'] as string) || `${Date.now()}`;
    headers['x-forwarded-for'] = req.ip || 'unknown';
    headers['x-forwarded-proto'] = req.protocol;

    // Forward request to microservice
    const response = await client({
      method: req.method.toLowerCase() as any,
      url: req.path,
      data: req.body,
      params: req.query,
      headers,
      validateStatus: () => true, // Don't throw on any status
    });

    // Log the proxy request
    logger.debug({
      msg: 'Proxy request',
      service: service.name,
      method: req.method,
      path: req.path,
      status: response.status,
      duration: response.headers['x-response-time'],
    });

    // Set response headers
    res.status(response.status);

    // Copy relevant headers from service response
    const headersToForward = [
      'content-type',
      'content-length',
      'cache-control',
      'etag',
      'x-request-id',
    ];

    for (const header of headersToForward) {
      const value = response.headers[header];
      if (value) {
        res.setHeader(header, value);
      }
    }

    // Send response
    res.send(response.data);
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
    } else {
      logger.error('Proxy error', err);
      next(
        new AppError(
          'PROXY_ERROR',
          502,
          'Error forwarding request to service',
          err instanceof Error ? err.message : String(err)
        )
      );
    }
  }
}
