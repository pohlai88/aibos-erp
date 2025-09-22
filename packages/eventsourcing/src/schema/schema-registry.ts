import type { DomainEvent } from '../core/domain-event';

/**
 * Schema version information
 */
export interface SchemaVersion {
  version: number;
  schema: Record<string, unknown>;
  createdAt: Date;
  deprecated: boolean;
  deprecatedAt?: Date;
}

/**
 * Event schema definition
 */
export interface EventSchema {
  eventType: string;
  versions: SchemaVersion[];
  currentVersion: number;
}

/**
 * Schema registry interface
 */
export interface SchemaRegistry {
  registerSchema(eventType: string, schema: Record<string, unknown>): Promise<void>;
  getSchema(eventType: string, version?: number): Promise<EventSchema | null>;
  validateEvent(event: DomainEvent): Promise<boolean>;
  getCurrentVersion(eventType: string): Promise<number>;
  deprecateVersion(eventType: string, version: number): Promise<void>;
}

/**
 * In-memory schema registry implementation
 */
export class InMemorySchemaRegistry implements SchemaRegistry {
  private schemas = new Map<string, EventSchema>();

  /**
   * Register a new schema version
   */
  async registerSchema(eventType: string, schema: Record<string, unknown>): Promise<void> {
    const existingSchema = this.schemas.get(eventType);

    if (existingSchema) {
      // Add new version
      const newVersion = existingSchema.currentVersion + 1;
      existingSchema.versions.push({
        version: newVersion,
        schema,
        createdAt: new Date(),
        deprecated: false,
      });
      existingSchema.currentVersion = newVersion;
    } else {
      // Create new schema
      const newSchema: EventSchema = {
        eventType,
        versions: [
          {
            version: 1,
            schema,
            createdAt: new Date(),
            deprecated: false,
          },
        ],
        currentVersion: 1,
      };
      this.schemas.set(eventType, newSchema);
    }

    console.log(
      `Registered schema for ${eventType} version ${this.schemas.get(eventType)?.currentVersion}`,
    );
  }

  /**
   * Get schema for event type and version
   */
  async getSchema(eventType: string, version?: number): Promise<EventSchema | null> {
    const schema = this.schemas.get(eventType);
    if (!schema) {
      return null;
    }

    if (version) {
      const versionSchema = schema.versions.find((v) => v.version === version);
      if (!versionSchema) {
        return null;
      }

      return {
        eventType,
        versions: [versionSchema],
        currentVersion: version,
      };
    }

    return schema;
  }

  /**
   * Validate event against schema
   */
  async validateEvent(event: DomainEvent): Promise<boolean> {
    const schema = await this.getSchema(event.eventType);
    if (!schema) {
      console.warn(`No schema found for event type ${event.eventType}`);
      return false;
    }

    try {
      // Basic validation - check required fields
      const eventData = event.serialize();
      const currentVersionSchema = schema.versions.find((v) => v.version === schema.currentVersion);

      if (!currentVersionSchema) {
        return false;
      }

      // Validate required fields exist
      const requiredFields = this.extractRequiredFields(currentVersionSchema.schema);
      for (const field of requiredFields) {
        if (!(field in eventData)) {
          console.warn(`Missing required field ${field} in event ${event.id}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(`Schema validation failed for event ${event.id}:`, error);
      return false;
    }
  }

  /**
   * Get current version for event type
   */
  async getCurrentVersion(eventType: string): Promise<number> {
    const schema = this.schemas.get(eventType);
    return schema?.currentVersion || 0;
  }

  /**
   * Deprecate a schema version
   */
  async deprecateVersion(eventType: string, version: number): Promise<void> {
    const schema = this.schemas.get(eventType);
    if (!schema) {
      throw new Error(`Schema not found for event type ${eventType}`);
    }

    const versionSchema = schema.versions.find((v) => v.version === version);
    if (!versionSchema) {
      throw new Error(`Version ${version} not found for event type ${eventType}`);
    }

    versionSchema.deprecated = true;
    versionSchema.deprecatedAt = new Date();

    console.log(`Deprecated schema version ${version} for event type ${eventType}`);
  }

  /**
   * Extract required fields from schema
   */
  private extractRequiredFields(schema: Record<string, unknown>): string[] {
    const required: string[] = [];

    if (typeof schema === 'object' && schema !== null) {
      const properties = schema.properties as Record<string, unknown>;
      const requiredFields = schema.required as string[];

      if (Array.isArray(requiredFields)) {
        required.push(...requiredFields);
      }

      if (properties) {
        for (const [key, value] of Object.entries(properties)) {
          if (typeof value === 'object' && value !== null) {
            const nestedRequired = this.extractRequiredFields(value as Record<string, unknown>);
            required.push(...nestedRequired.map((field) => `${key}.${field}`));
          }
        }
      }
    }

    return required;
  }

  /**
   * Get all registered schemas
   */
  getAllSchemas(): EventSchema[] {
    return Array.from(this.schemas.values());
  }

  /**
   * Clear all schemas (for testing)
   */
  clear(): void {
    this.schemas.clear();
  }
}
