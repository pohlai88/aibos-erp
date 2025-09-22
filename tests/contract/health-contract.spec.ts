import { Pact } from '@pact-foundation/pact';
import { Matchers } from '@pact-foundation/pact';
import { healthApi } from '../../apps/bff/src/health/health.controller';

const { like, eachLike } = Matchers;

describe('Health API Contract', () => {
  const provider = new Pact({
    consumer: 'AI-BOS-Web',
    provider: 'AI-BOS-BFF',
    port: 3001,
    log: './logs/pact.log',
    dir: './pacts',
    logLevel: 'INFO',
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('Health Check Endpoint', () => {
    test('should return health status', async () => {
      const expectedResponse = {
        status: 'ok',
        timestamp: like('2025-09-22T10:00:00.000Z'),
        uptime: like(12345),
        version: like('1.0.0'),
        environment: like('development'),
        services: eachLike({
          name: like('database'),
          status: like('healthy'),
          responseTime: like(50),
        }),
      };

      await provider
        .addInteraction({
          state: 'health check is available',
          uponReceiving: 'a request for health status',
          withRequest: {
            method: 'GET',
            path: '/health',
            headers: {
              'Accept': 'application/json',
            },
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: expectedResponse,
          },
        })
        .then(() => {
          // Test the actual API call
          return fetch('http://localhost:3001/health')
            .then(response => response.json())
            .then(data => {
              expect(data.status).toBe('ok');
              expect(data.timestamp).toBeDefined();
              expect(data.uptime).toBeDefined();
              expect(data.version).toBeDefined();
              expect(data.environment).toBeDefined();
              expect(Array.isArray(data.services)).toBe(true);
            });
        });
    });
  });

  describe('Database Health Check', () => {
    test('should return database status', async () => {
      const expectedResponse = {
        status: 'ok',
        database: {
          status: like('connected'),
          responseTime: like(25),
          version: like('PostgreSQL 15.14'),
        },
      };

      await provider
        .addInteraction({
          state: 'database is available',
          uponReceiving: 'a request for database health',
          withRequest: {
            method: 'GET',
            path: '/health/database',
            headers: {
              'Accept': 'application/json',
            },
          },
          willRespondWith: {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
            body: expectedResponse,
          },
        })
        .then(() => {
          // Test the actual API call
          return fetch('http://localhost:3001/health/database')
            .then(response => response.json())
            .then(data => {
              expect(data.status).toBe('ok');
              expect(data.database.status).toBe('connected');
              expect(data.database.responseTime).toBeDefined();
              expect(data.database.version).toBeDefined();
            });
        });
    });
  });
});
