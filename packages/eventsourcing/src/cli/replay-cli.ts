import type { EventHandler } from '../core/event-handler';
import type { EventStore } from '../core/event-store';
import type { Pool } from 'pg';

import { ProjectionCheckpointManager } from '../projections/projection-checkpoint-manager';
import { EventReplayEngine } from '../utils/event-replay';
import { Command } from 'commander';

/**
 * CLI constants
 */
const PROJECTOR_NAME_DESCRIPTION = 'Projector name';
const REQUIRED_SUFFIX = '(required)';
const CHECKPOINT_COMMAND = 'checkpoint';
const CHECKPOINT_TRACKING_SUFFIX = 'for checkpoint tracking';
const PROCESSING_TEXT = 'processing';
const BATCH_SIZE_DESCRIPTION = `Batch size for ${PROCESSING_TEXT}`;
const DRY_RUN_DESCRIPTION = `Dry run without actually ${PROCESSING_TEXT} events`;
const REPLAY_COMMAND = 'replay';
const CHECKPOINT_INTERVAL_DESCRIPTION = `${CHECKPOINT_COMMAND} interval`;
const RESUME_DESCRIPTION = `Resume from last ${CHECKPOINT_COMMAND}`;
const ISO_FORMAT_SUFFIX = '(ISO format)';
const START_DATE_DESCRIPTION = `Start date ${ISO_FORMAT_SUFFIX}`;
const END_DATE_DESCRIPTION = `End date ${ISO_FORMAT_SUFFIX}`;
const ALL_DOMAIN_VALUE = 'all';
const DOMAIN_OPTIONS = 'acc|inv|audit|all';
const STREAM_ID_DESCRIPTION = 'Specific stream ID to replay';
const DEFAULT_BATCH_SIZE = '1000';
const DEFAULT_CHECKPOINT_INTERVAL = '100';
const PROJECTOR_NAME_PARAM = '<name>';
const FILTER_BY_PROJECTOR_DESCRIPTION = 'Filter by projector name';

/**
 * CLI options interfaces
 */
interface CheckpointOptions {
  projector?: string;
  topic?: string;
  partition?: string;
  offset?: string;
}

interface HealthOptions {
  projector?: string;
  verbose?: boolean;
}

/**
 * Replay CLI configuration
 */
export interface ReplayCLIConfig {
  eventStore: EventStore;
  pool: Pool;
  handlers: EventHandler[];
  defaultBatchSize: number;
  defaultCheckpointInterval: number;
}

/**
 * Replay options
 */
export interface ReplayOptions {
  domain?: 'acc' | 'inv' | 'audit' | 'all';
  from?: string; // ISO date string
  to?: string; // ISO date string
  streamId?: string;
  projector?: string;
  batchSize?: string | number;
  checkpointInterval?: string | number;
  dryRun?: boolean;
  resume?: boolean;
}

/**
 * Replay CLI for event replay with checkpoint support
 */
export class ReplayCLI {
  private checkpointManager: ProjectionCheckpointManager;

  constructor(private config: ReplayCLIConfig) {
    this.checkpointManager = new ProjectionCheckpointManager(config.pool);
  }

  /**
   * Create CLI command
   */
  createCommand(): Command {
    const program = new Command();

    program
      .name(REPLAY_COMMAND)
      .description('Event replay CLI with checkpoint support')
      .version('1.0.0');

    // Main replay command
    program
      .command(REPLAY_COMMAND)
      .description('Replay events for projections')
      .option('-d, --domain <domain>', `Domain to replay (${DOMAIN_OPTIONS})`, ALL_DOMAIN_VALUE)
      .option('-f, --from <date>', START_DATE_DESCRIPTION)
      .option('-t, --to <date>', END_DATE_DESCRIPTION)
      .option('-s, --stream-id <streamId>', STREAM_ID_DESCRIPTION)
      .option(
        `-p, --projector ${PROJECTOR_NAME_PARAM}`,
        `${PROJECTOR_NAME_DESCRIPTION} ${CHECKPOINT_TRACKING_SUFFIX}`,
      )
      .option('-b, --batch-size <size>', BATCH_SIZE_DESCRIPTION, DEFAULT_BATCH_SIZE)
      .option(
        '-c, --checkpoint-interval <interval>',
        CHECKPOINT_INTERVAL_DESCRIPTION,
        DEFAULT_CHECKPOINT_INTERVAL,
      )
      .option('--dry-run', DRY_RUN_DESCRIPTION)
      .option('--resume', RESUME_DESCRIPTION)
      .action(async (options: ReplayOptions) => {
        try {
          await this.replayEvents(options);
        } catch (error) {
          console.error('Replay failed:', error);
          process.exit(1);
        }
      });

    // Checkpoint management commands
    program
      .command(CHECKPOINT_COMMAND)
      .description('Manage projection checkpoints')
      .command('list')
      .description('List all checkpoints')
      .option(`-p, --projector ${PROJECTOR_NAME_PARAM}`, FILTER_BY_PROJECTOR_DESCRIPTION)
      .action(async (options: CheckpointOptions) => {
        try {
          await this.listCheckpoints(options);
        } catch (error) {
          console.error('Failed to list checkpoints:', error);
          process.exit(1);
        }
      });

    program
      .command(CHECKPOINT_COMMAND)
      .command('reset')
      .description('Reset checkpoint for projector')
      .option('-p, --projector <name>', `${PROJECTOR_NAME_DESCRIPTION} ${REQUIRED_SUFFIX}`)
      .option('-t, --topic <topic>', `Topic name ${REQUIRED_SUFFIX}`)
      .option('--partition <partition>', `Partition number ${REQUIRED_SUFFIX}`)
      .action(async (options: CheckpointOptions) => {
        try {
          await this.resetCheckpoint(options);
        } catch (error) {
          console.error('Failed to reset checkpoint:', error);
          process.exit(1);
        }
      });

    // Status commands
    program
      .command('status')
      .description('Show projection status')
      .option(`-p, --projector ${PROJECTOR_NAME_PARAM}`, FILTER_BY_PROJECTOR_DESCRIPTION)
      .action(async (options: HealthOptions) => {
        try {
          await this.showStatus(options);
        } catch (error) {
          console.error('Failed to show status:', error);
          process.exit(1);
        }
      });

    // Health command
    program
      .command('health')
      .description('Show projection health summary')
      .action(async () => {
        try {
          await this.showHealth();
        } catch (error) {
          console.error('Failed to show health:', error);
          process.exit(1);
        }
      });

    return program;
  }

  /**
   * Replay events based on options
   */
  private async replayEvents(options: ReplayOptions): Promise<void> {
    const replayEngine = new EventReplayEngine(this.config.eventStore, {
      batchSize:
        typeof options.batchSize === 'string'
          ? parseInt(options.batchSize, 10)
          : options.batchSize || this.config.defaultBatchSize,
      checkpointInterval:
        typeof options.checkpointInterval === 'string'
          ? parseInt(options.checkpointInterval, 10)
          : options.checkpointInterval || this.config.defaultCheckpointInterval,
    });

    console.log('Starting event replay...');
    console.log('Options:', JSON.stringify(options, null, 2));

    if (options.dryRun) {
      console.log('DRY RUN MODE - No events will be processed');
      return;
    }

    try {
      if (options.streamId) {
        // Replay specific stream
        await this.replayStream(replayEngine, options);
      } else if (options.from || options.to) {
        // Replay by time range
        await this.replayByTimeRange(replayEngine, options);
      } else {
        // Replay all events
        await this.replayAllEvents(replayEngine, options);
      }

      console.log('Event replay completed successfully');
    } catch (error) {
      console.error('Event replay failed:', error);
      throw error;
    }
  }

  /**
   * Replay specific stream
   */
  private async replayStream(
    replayEngine: EventReplayEngine,
    options: ReplayOptions,
  ): Promise<void> {
    if (!options.streamId) {
      throw new Error('Stream ID is required for stream replay');
    }

    console.log(`Replaying stream: ${options.streamId}`);

    if (options.projector) {
      await this.checkpointManager.updateProjectionStatus(options.projector, 'running');
    }

    try {
      await replayEngine.replayStream(options.streamId, this.config.handlers);
    } finally {
      if (options.projector) {
        await this.checkpointManager.updateProjectionStatus(options.projector, 'stopped');
      }
    }
  }

  /**
   * Replay by time range
   */
  private async replayByTimeRange(
    replayEngine: EventReplayEngine,
    options: ReplayOptions,
  ): Promise<void> {
    const fromDate = options.from ? new Date(options.from) : new Date('1970-01-01');
    const toDate = options.to ? new Date(options.to) : new Date();

    console.log(`Replaying events from ${fromDate.toISOString()} to ${toDate.toISOString()}`);

    if (options.projector) {
      await this.checkpointManager.updateProjectionStatus(options.projector, 'running');
    }

    try {
      await replayEngine.replayFromTimestamp(fromDate, this.config.handlers);
    } finally {
      if (options.projector) {
        await this.checkpointManager.updateProjectionStatus(options.projector, 'stopped');
      }
    }
  }

  /**
   * Replay all events
   */
  private async replayAllEvents(
    replayEngine: EventReplayEngine,
    options: ReplayOptions,
  ): Promise<void> {
    console.log('Replaying all events');

    if (options.projector) {
      await this.checkpointManager.updateProjectionStatus(options.projector, 'running');
    }

    try {
      // Get all streams and replay them
      const streams = await this.getAllStreams(options.domain);

      for (const streamId of streams) {
        console.log(`Replaying stream: ${streamId}`);
        await replayEngine.replayStream(streamId, this.config.handlers);
      }
    } finally {
      if (options.projector) {
        await this.checkpointManager.updateProjectionStatus(options.projector, 'stopped');
      }
    }
  }

  /**
   * Get all streams for domain
   */
  private async getAllStreams(domain?: string): Promise<string[]> {
    // This would query the appropriate domain event tables
    // For now, return empty array as placeholder
    console.log(`Getting streams for domain: ${domain || ALL_DOMAIN_VALUE}`);
    return [];
  }

  /**
   * List checkpoints
   */
  private async listCheckpoints(options: { projector?: string }): Promise<void> {
    if (options.projector) {
      const checkpoints = await this.checkpointManager.getProjectorCheckpoints(options.projector);
      console.log(`Checkpoints for projector: ${options.projector}`);
      console.table(checkpoints);
    } else {
      const projectors = await this.checkpointManager.getAllProjectorNames();
      console.log('All projector checkpoints:');

      for (const projector of projectors) {
        const checkpoints = await this.checkpointManager.getProjectorCheckpoints(projector);
        console.log(`\n${projector}:`);
        console.table(checkpoints);
      }
    }
  }

  /**
   * Reset checkpoint
   */
  private async resetCheckpoint(options: {
    projector?: string;
    topic?: string;
    partition?: string;
  }): Promise<void> {
    if (!options.projector || !options.topic || !options.partition) {
      throw new Error('Projector name, topic, and partition are required');
    }

    const partition = parseInt(options.partition, 10);
    if (isNaN(partition)) {
      throw new TypeError('Partition must be a number');
    }

    console.log(`Resetting checkpoint for ${options.projector} on ${options.topic}:${partition}`);

    await this.checkpointManager.resetCheckpoint(options.projector, options.topic, partition);

    console.log('Checkpoint reset successfully');
  }

  /**
   * Show projection status
   */
  private async showStatus(options: { projector?: string }): Promise<void> {
    if (options.projector) {
      const status = await this.checkpointManager.getProjectionStatus(options.projector);
      if (status) {
        console.log(`Status for projector: ${options.projector}`);
        console.table([status]);
      } else {
        console.log(`No status found for projector: ${options.projector}`);
      }
    } else {
      const projectors = await this.checkpointManager.getAllProjectorNames();
      console.log('All projector statuses:');

      for (const projector of projectors) {
        const status = await this.checkpointManager.getProjectionStatus(projector);
        if (status) {
          console.log(`\n${projector}:`);
          console.table([status]);
        }
      }
    }
  }

  /**
   * Show health summary
   */
  private async showHealth(): Promise<void> {
    const health = await this.checkpointManager.getProjectionHealthSummary();

    console.log('Projection Health Summary:');
    console.table([health]);

    // Show lag information
    const projectors = await this.checkpointManager.getAllProjectorNames();

    for (const projector of projectors) {
      const lag = await this.checkpointManager.getProjectionLag(projector);
      if (lag.length > 0) {
        console.log(`\nLag for ${projector}:`);
        console.table(lag);
      }
    }
  }
}
