// MongoDB Initialization Script for AI-BOS ERP
// This script sets up MongoDB for document storage

// Switch to the documents database
db = db.getSiblingDB('aibos_documents');

// Create collections with validation
db.createCollection('documents', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['tenant_id', 'document_type', 'content', 'created_at'],
      properties: {
        tenant_id: {
          bsonType: 'string',
          description: 'Tenant ID must be a string and is required'
        },
        document_type: {
          bsonType: 'string',
          description: 'Document type must be a string and is required'
        },
        content: {
          bsonType: 'object',
          description: 'Content must be an object and is required'
        },
        metadata: {
          bsonType: 'object',
          description: 'Metadata must be an object'
        },
        created_at: {
          bsonType: 'date',
          description: 'Created at must be a date and is required'
        },
        updated_at: {
          bsonType: 'date',
          description: 'Updated at must be a date'
        },
        created_by: {
          bsonType: 'string',
          description: 'Created by must be a string'
        },
        updated_by: {
          bsonType: 'string',
          description: 'Updated by must be a string'
        }
      }
    }
  }
});

// Create indexes for performance
db.documents.createIndex({ tenant_id: 1 });
db.documents.createIndex({ document_type: 1 });
db.documents.createIndex({ created_at: -1 });
db.documents.createIndex({ tenant_id: 1, document_type: 1 });
db.documents.createIndex({ tenant_id: 1, created_at: -1 });

// Create file attachments collection
db.createCollection('file_attachments', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['tenant_id', 'filename', 'content_type', 'size', 'created_at'],
      properties: {
        tenant_id: {
          bsonType: 'string',
          description: 'Tenant ID must be a string and is required'
        },
        filename: {
          bsonType: 'string',
          description: 'Filename must be a string and is required'
        },
        content_type: {
          bsonType: 'string',
          description: 'Content type must be a string and is required'
        },
        size: {
          bsonType: 'number',
          description: 'Size must be a number and is required'
        },
        file_path: {
          bsonType: 'string',
          description: 'File path must be a string'
        },
        metadata: {
          bsonType: 'object',
          description: 'Metadata must be an object'
        },
        created_at: {
          bsonType: 'date',
          description: 'Created at must be a date and is required'
        },
        created_by: {
          bsonType: 'string',
          description: 'Created by must be a string'
        }
      }
    }
  }
});

// Create indexes for file attachments
db.file_attachments.createIndex({ tenant_id: 1 });
db.file_attachments.createIndex({ filename: 1 });
db.file_attachments.createIndex({ content_type: 1 });
db.file_attachments.createIndex({ created_at: -1 });

// Create audit log collection
db.createCollection('audit_logs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['tenant_id', 'action', 'resource', 'created_at'],
      properties: {
        tenant_id: {
          bsonType: 'string',
          description: 'Tenant ID must be a string and is required'
        },
        action: {
          bsonType: 'string',
          description: 'Action must be a string and is required'
        },
        resource: {
          bsonType: 'string',
          description: 'Resource must be a string and is required'
        },
        resource_id: {
          bsonType: 'string',
          description: 'Resource ID must be a string'
        },
        user_id: {
          bsonType: 'string',
          description: 'User ID must be a string'
        },
        ip_address: {
          bsonType: 'string',
          description: 'IP address must be a string'
        },
        user_agent: {
          bsonType: 'string',
          description: 'User agent must be a string'
        },
        details: {
          bsonType: 'object',
          description: 'Details must be an object'
        },
        created_at: {
          bsonType: 'date',
          description: 'Created at must be a date and is required'
        }
      }
    }
  }
});

// Create indexes for audit logs
db.audit_logs.createIndex({ tenant_id: 1 });
db.audit_logs.createIndex({ action: 1 });
db.audit_logs.createIndex({ resource: 1 });
db.audit_logs.createIndex({ created_at: -1 });
db.audit_logs.createIndex({ tenant_id: 1, created_at: -1 });

// Create sample documents
db.documents.insertMany([
  {
    tenant_id: '00000000-0000-0000-0000-000000000000',
    document_type: 'invoice',
    content: {
      invoice_number: 'INV-001',
      amount: 1000.00,
      currency: 'USD',
      status: 'draft'
    },
    metadata: {
      version: 1,
      tags: ['invoice', 'draft']
    },
    created_at: new Date(),
    created_by: 'admin'
  },
  {
    tenant_id: '00000000-0000-0000-0000-000000000000',
    document_type: 'contract',
    content: {
      contract_number: 'CON-001',
      party_a: 'AI-BOS ERP',
      party_b: 'Demo Customer',
      start_date: new Date(),
      end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    },
    metadata: {
      version: 1,
      tags: ['contract', 'active']
    },
    created_at: new Date(),
    created_by: 'admin'
  }
]);

// Create sample file attachment
db.file_attachments.insertOne({
  tenant_id: '00000000-0000-0000-0000-000000000000',
  filename: 'sample-document.pdf',
  content_type: 'application/pdf',
  size: 1024000,
  file_path: '/uploads/sample-document.pdf',
  metadata: {
    original_name: 'Sample Document.pdf',
    uploaded_by: 'admin'
  },
  created_at: new Date(),
  created_by: 'admin'
});

// Create sample audit log
db.audit_logs.insertOne({
  tenant_id: '00000000-0000-0000-0000-000000000000',
  action: 'CREATE',
  resource: 'document',
  resource_id: 'doc-001',
  user_id: 'admin',
  ip_address: '127.0.0.1',
  user_agent: 'Mozilla/5.0',
  details: {
    document_type: 'invoice',
    changes: ['created new invoice']
  },
  created_at: new Date()
});

// Create user for application access
db.createUser({
  user: 'aibos',
  pwd: 'aibos_mongo_password',
  roles: [
    {
      role: 'readWrite',
      db: 'aibos_documents'
    }
  ]
});

// Log successful initialization
print('AI-BOS ERP MongoDB initialized successfully');
print('Collections created: documents, file_attachments, audit_logs');
print('Indexes created for performance optimization');
print('Sample data inserted for testing');
print('User created: aibos with readWrite permissions');
