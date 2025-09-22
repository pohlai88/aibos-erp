import type { DomainEvent } from '../core/domain-event';

/**
 * Upcaster function type
 */
export type Upcaster = (event: DomainEvent) => DomainEvent;

/**
 * Upcaster pipeline configuration
 */
export interface UpcasterPipelineConfig {
  maxVersions: number;
  enableLogging: boolean;
}

/**
 * Default upcaster pipeline configuration
 */
export const DEFAULT_UPASTER_CONFIG: UpcasterPipelineConfig = {
  maxVersions: 10,
  enableLogging: true,
};

/**
 * Upcaster pipeline for event evolution
 */
export class UpcasterPipeline {
  private upcasters = new Map<string, Upcaster[]>();

  constructor(private config: UpcasterPipelineConfig = DEFAULT_UPASTER_CONFIG) {}

  /**
   * Register an upcaster for an event type
   */
  registerUpcaster(eventType: string, upcaster: Upcaster): void {
    if (!this.upcasters.has(eventType)) {
      this.upcasters.set(eventType, []);
    }

    this.upcasters.get(eventType)!.push(upcaster);

    if (this.config.enableLogging) {
      console.log(`Registered upcaster for event type ${eventType}`);
    }
  }

  /**
   * Upcast an event to the latest version
   */
  upcastEvent(event: DomainEvent): DomainEvent {
    const eventType = event.eventType;
    const upcasters = this.upcasters.get(eventType);

    if (!upcasters || upcasters.length === 0) {
      if (this.config.enableLogging) {
        console.log(`No upcasters found for event type ${eventType}, returning as-is`);
      }
      return event;
    }

    let currentEvent = event;
    let upcastCount = 0;

    for (const upcaster of upcasters) {
      try {
        const upcastedEvent = upcaster(currentEvent);

        // Validate that upcasting actually changed something
        if (upcastedEvent !== currentEvent) {
          currentEvent = upcastedEvent;
          upcastCount++;
        }
      } catch (error) {
        console.error(`Upcaster failed for event ${event.id}:`, error);
        throw error;
      }
    }

    if (this.config.enableLogging && upcastCount > 0) {
      console.log(`Upcasted event ${event.id} ${upcastCount} versions`);
    }

    return currentEvent;
  }

  /**
   * Check if upcasters exist for event type
   */
  hasUpcasters(eventType: string): boolean {
    const upcasters = this.upcasters.get(eventType);
    return upcasters !== undefined && upcasters.length > 0;
  }

  /**
   * Get upcaster count for event type
   */
  getUpcasterCount(eventType: string): number {
    const upcasters = this.upcasters.get(eventType);
    return upcasters?.length || 0;
  }

  /**
   * Get all registered event types
   */
  getRegisteredEventTypes(): string[] {
    return Array.from(this.upcasters.keys());
  }

  /**
   * Clear all upcasters (for testing)
   */
  clear(): void {
    this.upcasters.clear();
  }
}

/**
 * Built-in upcasters for common event evolution patterns
 */
export class BuiltInUpcasters {
  /**
   * Add a new field with default value
   */
  static addField(fieldName: string, defaultValue: unknown): Upcaster {
    return (event: DomainEvent) => {
      const eventData = event.serialize();

      if (!(fieldName in eventData)) {
        const updatedData = { ...eventData, [fieldName]: defaultValue };

        return {
          ...event,
          serialize: () => updatedData,
        } as DomainEvent;
      }

      return event;
    };
  }

  /**
   * Rename a field
   */
  static renameField(oldFieldName: string, newFieldName: string): Upcaster {
    return (event: DomainEvent) => {
      const eventData = event.serialize();

      if (oldFieldName in eventData && !(newFieldName in eventData)) {
        const { [oldFieldName]: value, ...rest } = eventData;
        const updatedData = { ...rest, [newFieldName]: value };

        return {
          ...event,
          serialize: () => updatedData,
        } as DomainEvent;
      }

      return event;
    };
  }

  /**
   * Remove a field
   */
  static removeField(fieldName: string): Upcaster {
    return (event: DomainEvent) => {
      const eventData = event.serialize();

      if (fieldName in eventData) {
        const { [fieldName]: _, ...updatedData } = eventData;

        return {
          ...event,
          serialize: () => updatedData,
        } as DomainEvent;
      }

      return event;
    };
  }

  /**
   * Transform field value
   */
  static transformField(fieldName: string, transformer: (value: unknown) => unknown): Upcaster {
    return (event: DomainEvent) => {
      const eventData = event.serialize();

      if (fieldName in eventData) {
        // eslint-disable-next-line security/detect-object-injection
        const fieldValue = eventData[fieldName];
        const updatedData = { ...eventData };

        // Use a more explicit approach to avoid security warnings
        const transformedData: Record<string, unknown> = {};
        for (const key of Object.keys(updatedData)) {
          if (key === fieldName) {
            // eslint-disable-next-line security/detect-object-injection
            transformedData[key] = transformer(fieldValue);
          } else {
            // eslint-disable-next-line security/detect-object-injection
            transformedData[key] = updatedData[key];
          }
        }

        return {
          ...event,
          serialize: () => transformedData,
        } as DomainEvent;
      }

      return event;
    };
  }

  /**
   * Update schema version in metadata
   */
  static updateSchemaVersion(newVersion: number): Upcaster {
    return (event: DomainEvent) => {
      const eventData = event.serialize();
      const metadata = (eventData.metadata as Record<string, unknown>) || {};

      const updatedData = {
        ...eventData,
        metadata: {
          ...metadata,
          schemaVersion: newVersion,
        },
      };

      return {
        ...event,
        serialize: () => updatedData,
      } as unknown as DomainEvent;
    };
  }
}

/**
 * Default upcaster pipeline with common event evolution patterns
 */
export function createDefaultUpcasterPipeline(): UpcasterPipeline {
  const pipeline = new UpcasterPipeline();

  // Example upcasters for common event types
  pipeline.registerUpcaster('JournalEntryPosted', BuiltInUpcasters.addField('reference', null));

  pipeline.registerUpcaster('AccountCreated', BuiltInUpcasters.addField('isActive', true));

  pipeline.registerUpcaster('StockReceived', BuiltInUpcasters.addField('batchNumber', null));

  pipeline.registerUpcaster('StockIssued', BuiltInUpcasters.addField('reason', 'unknown'));

  return pipeline;
}
