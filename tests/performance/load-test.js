import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate should be less than 10%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Test public endpoint
  let response = http.get(`${BASE_URL}/api/test-public`);
  check(response, {
    'public endpoint status is 200': (r) => r.status === 200,
    'public endpoint response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test registration endpoint
  const userData = {
    firstname: 'LoadTest',
    lastname: 'User',
    email: `loadtest${Math.random()}@example.com`,
    password: 'LoadTest123!',
    contact_phone: '1234567890',
    address: '123 Load Test Street'
  };

  response = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(userData), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(response, {
    'registration endpoint responds': (r) => r.status !== 0,
    'registration response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(1);

  // Test login endpoint
  const loginData = {
    email: userData.email,
    password: userData.password
  };

  response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(loginData), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(response, {
    'login endpoint responds': (r) => r.status !== 0,
    'login response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(2);
}
