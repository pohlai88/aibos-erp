import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 10 }, // Stay at 10 users for 5 minutes
    { duration: '2m', target: 0 }, // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'], // Error rate must be below 10%
  },
};

export default function () {
  // Test homepage
  const homepageResponse = http.get('http://localhost:3000/');
  check(homepageResponse, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage response time < 500ms': (r) => r.timings.duration < 500,
    'homepage contains AI-BOS ERP': (r) => r.body.includes('AI-BOS ERP'),
  });

  sleep(1);

  // Test BFF health endpoint
  const healthResponse = http.get('http://localhost:3001/health');
  check(healthResponse, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 200ms': (r) => r.timings.duration < 200,
    'health contains status ok': (r) => JSON.parse(r.body).status === 'ok',
  });

  sleep(1);

  // Test BFF database health endpoint
  const dbHealthResponse = http.get('http://localhost:3001/health/database');
  check(dbHealthResponse, {
    'database health status is 200': (r) => r.status === 200,
    'database health response time < 300ms': (r) => r.timings.duration < 300,
    'database health contains status': (r) => JSON.parse(r.body).status === 'ok',
  });

  sleep(1);
}
