import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const authResponseTime = new Trend('auth_response_time');
const appointmentResponseTime = new Trend('appointment_response_time');
const paymentResponseTime = new Trend('payment_response_time');

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 0 },  // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate should be less than 10%
    errors: ['rate<0.1'],
    auth_response_time: ['p(95)<300'], // Auth requests should be fast
    appointment_response_time: ['p(95)<800'], // Appointment requests can be slower
    payment_response_time: ['p(95)<1000'], // Payment requests can be slowest
  },
};

const BASE_URL = 'http://localhost:3000';

// Test data
const testUsers = [
  { email: 'test1@example.com', password: 'TestPass123!' },
  { email: 'test2@example.com', password: 'TestPass123!' },
  { email: 'test3@example.com', password: 'TestPass123!' },
  { email: 'test4@example.com', password: 'TestPass123!' },
  { email: 'test5@example.com', password: 'TestPass123!' },
];

export default function () {
  const userIndex = Math.floor(Math.random() * testUsers.length);
  const testUser = testUsers[userIndex];
  
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
    lastname: `User${Math.floor(Math.random() * 1000)}`,
    email: `loadtest${Math.floor(Math.random() * 10000)}@example.com`,
    password: 'LoadTest123!',
    contact_phone: '1234567890',
    address: '123 Load Test Street'
  };

  const startTime = Date.now();
  response = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(userData), {
    headers: { 'Content-Type': 'application/json' },
  });
  authResponseTime.add(Date.now() - startTime);

  check(response, {
    'registration endpoint responds': (r) => r.status !== 0,
    'registration response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(1);

  // Test login endpoint
  const loginData = {
    email: testUser.email,
    password: testUser.password
  };

  const loginStartTime = Date.now();
  response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(loginData), {
    headers: { 'Content-Type': 'application/json' },
  });
  authResponseTime.add(Date.now() - loginStartTime);

  check(response, {
    'login endpoint responds': (r) => r.status !== 0,
    'login response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  // Extract token if login was successful
  let token = null;
  if (response.status === 200) {
    try {
      const loginResponse = JSON.parse(response.body);
      token = loginResponse.token;
    } catch (e) {
      // Token extraction failed, continue without auth
    }
  }

  sleep(1);

  // Test appointment booking (if we have a token)
  if (token) {
    const appointmentData = {
      doctor_id: 1,
      appointment_date: '2024-12-25',
      time_slot: '09:00 AM',
      appointment_type: 'Regular Checkup',
      reason: 'Load test appointment booking'
    };

    const appointmentStartTime = Date.now();
    response = http.post(`${BASE_URL}/api/appointments/book`, JSON.stringify(appointmentData), {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    appointmentResponseTime.add(Date.now() - appointmentStartTime);

    check(response, {
      'appointment booking responds': (r) => r.status !== 0,
      'appointment booking response time < 800ms': (r) => r.timings.duration < 800,
    }) || errorRate.add(1);

    sleep(1);

    // Test payment creation
    const paymentData = {
      appointment_id: 1,
      amount: 150.00
    };

    const paymentStartTime = Date.now();
    response = http.post(`${BASE_URL}/api/payments/create`, JSON.stringify(paymentData), {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    paymentResponseTime.add(Date.now() - paymentStartTime);

    check(response, {
      'payment creation responds': (r) => r.status !== 0,
      'payment creation response time < 1000ms': (r) => r.timings.duration < 1000,
    }) || errorRate.add(1);

    sleep(1);

    // Test getting user appointments
    response = http.get(`${BASE_URL}/api/appointments/user`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      },
    });

    check(response, {
      'get appointments responds': (r) => r.status !== 0,
      'get appointments response time < 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);

    sleep(1);

    // Test getting user profile
    response = http.get(`${BASE_URL}/api/user/profile`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      },
    });

    check(response, {
      'get profile responds': (r) => r.status !== 0,
      'get profile response time < 300ms': (r) => r.timings.duration < 300,
    }) || errorRate.add(1);
  }

  sleep(2);
}

// Setup function to create test users if they don't exist
export function setup() {
  console.log('Setting up test users...');
  
  for (const user of testUsers) {
    const userData = {
      firstname: 'LoadTest',
      lastname: 'User',
      email: user.email,
      password: user.password,
      contact_phone: '1234567890',
      address: '123 Load Test Street'
    };

    const response = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(userData), {
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.status === 201 || response.status === 409) {
      console.log(`Test user ${user.email} is ready`);
    } else {
      console.log(`Failed to create test user ${user.email}: ${response.status}`);
    }
  }
}

// Teardown function to clean up test data
export function teardown(data) {
  console.log('Cleaning up test data...');
  // In a real scenario, you might want to clean up test data
  // This is just a placeholder for demonstration
}
