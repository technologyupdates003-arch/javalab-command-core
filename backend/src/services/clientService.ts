import { query } from '@/services/database.js';
import { set, get } from '@/services/cache.js';
import { publishTask } from '@/services/messageQueue.js';
import { broadcastToChannel } from '@/services/websocket.js';
import logger from '@/utils/logger.js';
import { AppError } from '@/types/index.js';

// Types
export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  kycVerifiedAt?: Date;
  kycVerifiedBy?: string;
  complianceNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface KYCDocument {
  id: string;
  clientId: string;
  documentType: 'id' | 'proof_of_address' | 'business_license';
  documentUrl: string;
  uploadedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface CreateClientRequest {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  complianceNotes?: string;
}

export interface UpdateClientRequest {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  complianceNotes?: string;
}

export interface UpdateKYCStatusRequest {
  status: 'pending' | 'verified' | 'rejected';
  notes?: string;
}

export interface UploadKYCDocumentRequest {
  documentType: 'id' | 'proof_of_address' | 'business_license';
  documentUrl: string;
}

/**
 * Create a new client
 */
export async function createClient(
  data: CreateClientRequest,
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<Client> {
  try {
    const result = await query(
      `INSERT INTO clients (name, email, phone, company, address, compliance_notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, phone, company, address, kyc_status, kyc_verified_at, kyc_verified_by, 
                 compliance_notes, created_at, updated_at, created_by`,
      [data.name, data.email || null, data.phone || null, data.company || null, data.address || null, data.complianceNotes || null, userId]
    );

    const rows = (result as any).rows;
    if (rows.length === 0) {
      throw new AppError('CREATE_FAILED', 500, 'Failed to create client');
    }

    const client = rows[0];

    // Log to audit trail
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, changes, ip_address, user_agent, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        'CREATE',
        'clients',
        client.id,
        JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          company: data.company,
          address: data.address,
          complianceNotes: data.complianceNotes,
        }),
        ipAddress,
        userAgent,
        'success',
      ]
    );

    // Log to activity log
    await query(
      `INSERT INTO activity_logs (user_id, action, module, details)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'CREATE', 'clients', JSON.stringify({ clientId: client.id, clientName: data.name })]
    );

    // Invalidate cache
    await set(`client:${client.id}`, null, 0);

    // Broadcast WebSocket event
    broadcastToChannel('clients', 'client:created', {
      client: mapClientRow(client),
      timestamp: new Date(),
    });

    logger.info('Client created', { clientId: client.id, userId });

    return mapClientRow(client);
  } catch (err) {
    logger.error('Error creating client', err);
    throw err;
  }
}

/**
 * Get client by ID
 */
export async function getClient(clientId: string, userId: string): Promise<Client> {
  try {
    // Check cache first
    const cached = await get<Client>(`client:${clientId}`);
    if (cached) {
      return cached;
    }

    const result = await query(
      `SELECT id, name, email, phone, company, address, kyc_status, kyc_verified_at, kyc_verified_by,
              compliance_notes, created_at, updated_at, created_by
       FROM clients WHERE id = $1`,
      [clientId]
    );

    const rows = (result as any).rows;
    if (rows.length === 0) {
      throw new AppError('NOT_FOUND', 404, 'Client not found');
    }

    const client = mapClientRow(rows[0]);

    // Cache the result
    await set(`client:${clientId}`, client, 3600);

    // Log access
    await query(
      `INSERT INTO data_access_logs (user_id, resource_type, resource_id, access_type)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'clients', clientId, 'read']
    );

    return client;
  } catch (err) {
    logger.error('Error getting client', err);
    throw err;
  }
}

/**
 * Update client
 */
export async function updateClient(
  clientId: string,
  data: UpdateClientRequest,
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<Client> {
  try {
    // Get current client for audit trail
    const currentResult = await query(
      `SELECT id, name, email, phone, company, address, kyc_status, kyc_verified_at, kyc_verified_by,
              compliance_notes, created_at, updated_at, created_by
       FROM clients WHERE id = $1`,
      [clientId]
    );

    const rows = (currentResult as any).rows;
    if (rows.length === 0) {
      throw new AppError('NOT_FOUND', 404, 'Client not found');
    }

    const currentClient = rows[0];

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(data.phone);
    }
    if (data.company !== undefined) {
      updates.push(`company = $${paramCount++}`);
      values.push(data.company);
    }
    if (data.address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(data.address);
    }
    if (data.complianceNotes !== undefined) {
      updates.push(`compliance_notes = $${paramCount++}`);
      values.push(data.complianceNotes);
    }

    if (updates.length === 0) {
      return mapClientRow(currentClient);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(clientId);

    const updateResult = await query(
      `UPDATE clients SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, email, phone, company, address, kyc_status, kyc_verified_at, kyc_verified_by,
                 compliance_notes, created_at, updated_at, created_by`,
      values
    );

    const updatedRows = (updateResult as any).rows;
    if (updatedRows.length === 0) {
      throw new AppError('UPDATE_FAILED', 500, 'Failed to update client');
    }

    const updatedClient = updatedRows[0];

    // Log to audit trail
    const changes: any = {};
    if (data.name !== undefined && data.name !== currentClient.name) {
      changes.name = { old: currentClient.name, new: data.name };
    }
    if (data.email !== undefined && data.email !== currentClient.email) {
      changes.email = { old: currentClient.email, new: data.email };
    }
    if (data.phone !== undefined && data.phone !== currentClient.phone) {
      changes.phone = { old: currentClient.phone, new: data.phone };
    }
    if (data.company !== undefined && data.company !== currentClient.company) {
      changes.company = { old: currentClient.company, new: data.company };
    }
    if (data.address !== undefined && data.address !== currentClient.address) {
      changes.address = { old: currentClient.address, new: data.address };
    }
    if (data.complianceNotes !== undefined && data.complianceNotes !== currentClient.compliance_notes) {
      changes.complianceNotes = { old: currentClient.compliance_notes, new: data.complianceNotes };
    }

    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, changes, ip_address, user_agent, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, 'UPDATE', 'clients', clientId, JSON.stringify(changes), ipAddress, userAgent, 'success']
    );

    // Log to activity log
    await query(
      `INSERT INTO activity_logs (user_id, action, module, details)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'UPDATE', 'clients', JSON.stringify({ clientId, changes })]
    );

    // Invalidate cache
    await set(`client:${clientId}`, null, 0);

    // Broadcast WebSocket event
    broadcastToChannel('clients', 'client:updated', {
      client: mapClientRow(updatedClient),
      changes,
      timestamp: new Date(),
    });

    logger.info('Client updated', { clientId, userId });

    return mapClientRow(updatedClient);
  } catch (err) {
    logger.error('Error updating client', err);
    throw err;
  }
}

/**
 * Delete client
 */
export async function deleteClient(
  clientId: string,
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<void> {
  try {
    // Get client for audit trail
    const result = await query(
      `SELECT id, name FROM clients WHERE id = $1`,
      [clientId]
    );

    const rows = (result as any).rows;
    if (rows.length === 0) {
      throw new AppError('NOT_FOUND', 404, 'Client not found');
    }

    const client = rows[0];

    // Delete client (cascade will delete related records)
    await query('DELETE FROM clients WHERE id = $1', [clientId]);

    // Log to audit trail
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, changes, ip_address, user_agent, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, 'DELETE', 'clients', clientId, JSON.stringify({ name: client.name }), ipAddress, userAgent, 'success']
    );

    // Log to activity log
    await query(
      `INSERT INTO activity_logs (user_id, action, module, details)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'DELETE', 'clients', JSON.stringify({ clientId, clientName: client.name })]
    );

    // Invalidate cache
    await set(`client:${clientId}`, null, 0);

    // Broadcast WebSocket event
    broadcastToChannel('clients', 'client:deleted', {
      clientId,
      timestamp: new Date(),
    });

    logger.info('Client deleted', { clientId, userId });
  } catch (err) {
    logger.error('Error deleting client', err);
    throw err;
  }
}

/**
 * Search clients
 */
export async function searchClients(
  query_text: string,
  limit: number = 20,
  offset: number = 0,
  userId: string
): Promise<{ clients: Client[]; total: number }> {
  try {
    const searchPattern = `%${query_text}%`;

    // Search across name, email, phone, and company
    const result = await query(
      `SELECT id, name, email, phone, company, address, kyc_status, kyc_verified_at, kyc_verified_by,
              compliance_notes, created_at, updated_at, created_by
       FROM clients
       WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR company ILIKE $1
       ORDER BY name ASC
       LIMIT $2 OFFSET $3`,
      [searchPattern, limit, offset]
    );

    const clients = ((result as any).rows || []).map(mapClientRow);

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as count FROM clients
       WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 OR company ILIKE $1`,
      [searchPattern]
    );

    const total = parseInt((countResult as any).rows[0].count, 10);

    // Log search
    await query(
      `INSERT INTO activity_logs (user_id, action, module, details)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'SEARCH', 'clients', JSON.stringify({ query: query_text, resultCount: clients.length })]
    );

    return { clients, total };
  } catch (err) {
    logger.error('Error searching clients', err);
    throw err;
  }
}

/**
 * Get all clients with pagination
 */
export async function getAllClients(
  limit: number = 20,
  offset: number = 0,
  userId: string
): Promise<{ clients: Client[]; total: number }> {
  try {
    const result = await query(
      `SELECT id, name, email, phone, company, address, kyc_status, kyc_verified_at, kyc_verified_by,
              compliance_notes, created_at, updated_at, created_by
       FROM clients
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const clients = ((result as any).rows || []).map(mapClientRow);

    // Get total count
    const countResult = await query('SELECT COUNT(*) as count FROM clients');
    const total = parseInt((countResult as any).rows[0].count, 10);

    // Log access
    await query(
      `INSERT INTO activity_logs (user_id, action, module, details)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'LIST', 'clients', JSON.stringify({ limit, offset, resultCount: clients.length })]
    );

    return { clients, total };
  } catch (err) {
    logger.error('Error getting all clients', err);
    throw err;
  }
}

/**
 * Update KYC status
 */
export async function updateKYCStatus(
  clientId: string,
  data: UpdateKYCStatusRequest,
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<Client> {
  try {
    // Get current client
    const currentResult = await query(
      `SELECT id, name, email, phone, company, address, kyc_status, kyc_verified_at, kyc_verified_by,
              compliance_notes, created_at, updated_at, created_by
       FROM clients WHERE id = $1`,
      [clientId]
    );

    const rows = (currentResult as any).rows;
    if (rows.length === 0) {
      throw new AppError('NOT_FOUND', 404, 'Client not found');
    }

    const currentClient = rows[0];

    // Update KYC status
    const updateResult = await query(
      `UPDATE clients 
       SET kyc_status = $1, kyc_verified_at = CASE WHEN $1 = 'verified' THEN CURRENT_TIMESTAMP ELSE kyc_verified_at END,
           kyc_verified_by = CASE WHEN $1 = 'verified' THEN $2 ELSE kyc_verified_by END,
           compliance_notes = CASE WHEN $3 IS NOT NULL THEN $3 ELSE compliance_notes END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, name, email, phone, company, address, kyc_status, kyc_verified_at, kyc_verified_by,
                 compliance_notes, created_at, updated_at, created_by`,
      [data.status, userId, data.notes || null, clientId]
    );

    const updatedRows = (updateResult as any).rows;
    if (updatedRows.length === 0) {
      throw new AppError('UPDATE_FAILED', 500, 'Failed to update KYC status');
    }

    const updatedClient = updatedRows[0];

    // Log to audit trail
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, changes, ip_address, user_agent, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        'UPDATE_KYC',
        'clients',
        clientId,
        JSON.stringify({
          kycStatus: { old: currentClient.kyc_status, new: data.status },
          notes: data.notes,
        }),
        ipAddress,
        userAgent,
        'success',
      ]
    );

    // Log to activity log
    await query(
      `INSERT INTO activity_logs (user_id, action, module, details)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'UPDATE_KYC', 'clients', JSON.stringify({ clientId, newStatus: data.status })]
    );

    // Invalidate cache
    await set(`client:${clientId}`, null, 0);

    // Publish notification task if KYC is verified
    if (data.status === 'verified') {
      await publishTask('notification', {
        type: 'kyc_verified',
        clientId,
        clientName: currentClient.name,
        recipientRole: 'compliance_officer',
      });
    }

    // Broadcast WebSocket event
    broadcastToChannel('clients', 'client:kyc_updated', {
      clientId,
      newStatus: data.status,
      timestamp: new Date(),
    });

    logger.info('KYC status updated', { clientId, newStatus: data.status, userId });

    return mapClientRow(updatedClient);
  } catch (err) {
    logger.error('Error updating KYC status', err);
    throw err;
  }
}

/**
 * Get KYC documents for a client
 */
export async function getKYCDocuments(clientId: string, userId: string): Promise<KYCDocument[]> {
  try {
    const result = await query(
      `SELECT id, client_id, document_type, document_url, uploaded_at, verified_at, verified_by
       FROM kyc_documents WHERE client_id = $1
       ORDER BY uploaded_at DESC`,
      [clientId]
    );

    const documents = ((result as any).rows || []).map(mapKYCDocumentRow);

    // Log access
    await query(
      `INSERT INTO data_access_logs (user_id, resource_type, resource_id, access_type)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'kyc_documents', clientId, 'read']
    );

    return documents;
  } catch (err) {
    logger.error('Error getting KYC documents', err);
    throw err;
  }
}

/**
 * Upload KYC document
 */
export async function uploadKYCDocument(
  clientId: string,
  data: UploadKYCDocumentRequest,
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<KYCDocument> {
  try {
    // Verify client exists
    const clientResult = await query('SELECT id FROM clients WHERE id = $1', [clientId]);
    if ((clientResult as any).rows.length === 0) {
      throw new AppError('NOT_FOUND', 404, 'Client not found');
    }

    // Insert document
    const result = await query(
      `INSERT INTO kyc_documents (client_id, document_type, document_url)
       VALUES ($1, $2, $3)
       RETURNING id, client_id, document_type, document_url, uploaded_at, verified_at, verified_by`,
      [clientId, data.documentType, data.documentUrl]
    );

    const rows = (result as any).rows;
    if (rows.length === 0) {
      throw new AppError('CREATE_FAILED', 500, 'Failed to upload document');
    }

    const document = mapKYCDocumentRow(rows[0]);

    // Log to audit trail
    await query(
      `INSERT INTO audit_logs (user_id, action, resource, resource_id, changes, ip_address, user_agent, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        'UPLOAD_KYC_DOCUMENT',
        'kyc_documents',
        document.id,
        JSON.stringify({ clientId, documentType: data.documentType }),
        ipAddress,
        userAgent,
        'success',
      ]
    );

    // Log to activity log
    await query(
      `INSERT INTO activity_logs (user_id, action, module, details)
       VALUES ($1, $2, $3, $4)`,
      [userId, 'UPLOAD_KYC_DOCUMENT', 'clients', JSON.stringify({ clientId, documentType: data.documentType })]
    );

    // Broadcast WebSocket event
    broadcastToChannel('clients', 'kyc_document:uploaded', {
      clientId,
      document,
      timestamp: new Date(),
    });

    logger.info('KYC document uploaded', { clientId, documentType: data.documentType, userId });

    return document;
  } catch (err) {
    logger.error('Error uploading KYC document', err);
    throw err;
  }
}

/**
 * Helper function to map database row to Client object
 */
function mapClientRow(row: any): Client {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    address: row.address,
    kycStatus: row.kyc_status,
    kycVerifiedAt: row.kyc_verified_at ? new Date(row.kyc_verified_at) : undefined,
    kycVerifiedBy: row.kyc_verified_by,
    complianceNotes: row.compliance_notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by,
  };
}

/**
 * Helper function to map database row to KYCDocument object
 */
function mapKYCDocumentRow(row: any): KYCDocument {
  return {
    id: row.id,
    clientId: row.client_id,
    documentType: row.document_type,
    documentUrl: row.document_url,
    uploadedAt: new Date(row.uploaded_at),
    verifiedAt: row.verified_at ? new Date(row.verified_at) : undefined,
    verifiedBy: row.verified_by,
  };
}
