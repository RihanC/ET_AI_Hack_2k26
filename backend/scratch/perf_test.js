// ============================================================
// ISIP — Performance and API Stress Testing Tool
// ============================================================

import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api';
const SOCKET_BASE = 'http://localhost:5000';

async function runPerformanceTest() {
  console.log('⚡ Starting Performance and Load Verification...');

  // Step 1: Login to get token
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@isip.com', password: 'test@123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data.accessToken;

  // Step 2: Concurrent API requests
  const concurrency = 100;
  console.log(`Sending ${concurrency} concurrent GET requests to /api/sensors...`);

  const startApi = performance.now();
  const promises = [];
  
  for (let i = 0; i < concurrency; i++) {
    promises.push(
      fetch(`${API_BASE}/sensors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => ({
        status: res.status,
        ok: res.ok
      })).catch(err => ({
        status: 500,
        ok: false,
        error: err.message
      }))
    );
  }

  const results = await Promise.all(promises);
  const durationApi = performance.now() - startApi;
  const successCount = results.filter(r => r.ok).length;

  const statusCounts = {};
  for (const r of results) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }

  console.log(`\nAPI Load Test Results:`);
  console.log(`- Total Requests Sent   : ${concurrency}`);
  console.log(`- Successful Responses : ${successCount}/${concurrency}`);
  console.log(`- Status Codes Received : ${JSON.stringify(statusCounts)}`);
  console.log(`- Total Time Taken     : ${durationApi.toFixed(2)} ms`);
  console.log(`- Average Response Time: ${(durationApi / concurrency).toFixed(2)} ms`);

  // Step 3: Socket connection latency
  console.log(`\nMeasuring Socket.IO Connection and Event Latency...`);
  const socketStart = performance.now();
  const socket = io(SOCKET_BASE, {
    auth: { token },
    transports: ['websocket'],
    forceNew: true
  });

  const latency = await new Promise((resolve) => {
    socket.on('connect', () => {
      const connDuration = performance.now() - socketStart;
      
      // Ping check
      const pingStart = performance.now();
      socket.emit('ping', () => {
        const pingDuration = performance.now() - pingStart;
        resolve({ connDuration, pingDuration });
      });
    });
  });

  console.log(`Socket.IO Results:`);
  console.log(`- Handshake/Connection Latency: ${latency.connDuration.toFixed(2)} ms`);
  console.log(`- Message Roundtrip Latency   : ${latency.pingDuration.toFixed(2)} ms`);

  socket.disconnect();
  console.log('\n✅ Performance test finished.');
  process.exit(0);
}

runPerformanceTest().catch(console.error);
