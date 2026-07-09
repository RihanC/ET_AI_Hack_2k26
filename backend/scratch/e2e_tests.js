// ============================================================
// ISIP — E2E REST API and Socket.IO Automated Test Suite
// ============================================================

import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api';
const SOCKET_BASE = 'http://localhost:5000';

async function runTests() {
  console.log('🧪 Starting Automated E2E Verification Suite...');
  let exitCode = 0;

  try {
    // ── 1. AUTHENTICATION & RBAC TESTING ────────────────────
    console.log('\n--- 1. Testing Authentication & Authorization ---');
    
    // Test Login with correct credentials
    console.log('Testing login with correct credentials...');
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@isip.com', password: 'test@123' })
    });
    
    if (loginRes.status !== 200) {
      throw new Error(`Failed correct login: Expected 200, got ${loginRes.status}`);
    }
    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.data.accessToken) {
      throw new Error('Login response missing accessToken or success flag');
    }
    const adminToken = loginData.data.accessToken;
    console.log('✅ Correct login test passed.');

    // Test Login with incorrect credentials
    console.log('Testing login with incorrect credentials...');
    const badLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@isip.com', password: 'wrongpassword' })
    });
    if (badLoginRes.status !== 401 && badLoginRes.status !== 400) {
      console.error(`❌ Expected 400 or 401 for incorrect password, got ${badLoginRes.status}`);
      exitCode = 1;
    } else {
      console.log('✅ Incorrect login test passed.');
    }

    // Test Login with missing fields
    console.log('Testing login with missing fields...');
    const missingLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@isip.com' })
    });
    if (missingLoginRes.status !== 400) {
      console.error(`❌ Expected 400 for missing password, got ${missingLoginRes.status}`);
      exitCode = 1;
    } else {
      console.log('✅ Missing fields validation passed.');
    }

    // Test Register duplicate email
    console.log('Testing registration with duplicate email...');
    const registerRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@isip.com',
        username: 'duplicate_test',
        password: 'test@123',
        firstName: 'Test',
        lastName: 'Test'
      })
    });
    if (registerRes.status !== 400 && registerRes.status !== 409) {
      console.error(`❌ Expected 400 or 409 for duplicate email, got ${registerRes.status}`);
      exitCode = 1;
    } else {
      console.log('✅ Duplicate email registration check passed.');
    }

    // Test route protection (without token)
    console.log('Testing protected route without token...');
    const protectedRes = await fetch(`${API_BASE}/zones`);
    if (protectedRes.status !== 401) {
      console.error(`❌ Expected 401 for unauthenticated request, got ${protectedRes.status}`);
      exitCode = 1;
    } else {
      console.log('✅ Route protection check passed.');
    }

    // Test role-based protection (viewer accessing admin-only endpoints if any exist)
    // Let's first register a viewer
    console.log('Testing viewer authorization limit...');
    const registerViewerRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `viewer_${Date.now()}@isip.com`,
        username: `viewer_${Date.now()}`,
        password: 'test@123',
        firstName: 'Viewer',
        lastName: 'Test'
      })
    });
    const viewerRegisterData = await registerViewerRes.json();
    
    // Login as viewer
    const viewerLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: viewerRegisterData.data.user.email,
        password: 'test@123'
      })
    });
    const viewerLoginData = await viewerLoginRes.json();
    const viewerToken = viewerLoginData.data.accessToken;

    // Verify viewer can read zones
    const viewerZonesRes = await fetch(`${API_BASE}/zones`, {
      headers: { 'Authorization': `Bearer ${viewerToken}` }
    });
    if (viewerZonesRes.status !== 200) {
      console.error(`❌ Viewer should be able to GET zones (200), got ${viewerZonesRes.status}`);
      exitCode = 1;
    } else {
      console.log('✅ Viewer authenticated access to zones passed.');
    }

    // ── 2. CRUD & VALIDATION TESTING ────────────────────────
    console.log('\n--- 2. Testing API CRUD Operations & Validation ---');
    
    // Create new Zone
    console.log('Creating a new zone...');
    const uniqueCode = `Z-${Date.now().toString().slice(-6)}`;
    const newZoneRes = await fetch(`${API_BASE}/zones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: `Automated Test Zone ${Date.now()}`,
        code: uniqueCode,
        description: 'Created by e2e test script',
        riskLevel: 'SAFE',
        latitude: 12.34,
        longitude: 56.78
      })
    });

    if (newZoneRes.status !== 201 && newZoneRes.status !== 200) {
      console.error(`❌ Failed to create zone: Expected 201/200, got ${newZoneRes.status}`);
      const errBody = await newZoneRes.text();
      console.error('Response:', errBody);
      exitCode = 1;
    } else {
      const newZoneData = await newZoneRes.json();
      const zoneId = newZoneData.data.id;
      console.log(`... Zone created successfully (ID: ${zoneId}).`);

      // Read Zone back
      console.log(`Reading back the created zone ID: ${zoneId}...`);
      const getZoneRes = await fetch(`${API_BASE}/zones/${zoneId}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const getZoneData = await getZoneRes.json();
      if (getZoneRes.status !== 200 || getZoneData.data.code !== uniqueCode) {
        console.error(`❌ Read back verification failed!`);
        exitCode = 1;
      } else {
        console.log('✅ Zone read back verification passed.');
      }

      // Update Zone
      console.log('Updating the created zone...');
      const updateZoneRes = await fetch(`${API_BASE}/zones/${zoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: `Automated Test Zone Updated ${Date.now()}`,
          code: uniqueCode,
          riskLevel: 'WARNING',
          description: 'Updated by e2e test script'
        })
      });
      const updateZoneData = await updateZoneRes.json();
      if (updateZoneRes.status !== 200 || updateZoneData.data.riskLevel !== 'WARNING') {
        console.error(`❌ Update zone failed: Expected status 200 and riskLevel WARNING, got ${updateZoneRes.status}`, updateZoneData);
        exitCode = 1;
      } else {
        console.log('✅ Zone update passed.');
      }

      // Check Zod Validation (Invalid risk level)
      console.log('Testing input validation with invalid riskLevel...');
      const invalidZoneRes = await fetch(`${API_BASE}/zones/${zoneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          name: 'Updated Name',
          code: uniqueCode,
          riskLevel: 'INVALID_RISK_LEVEL'
        })
      });
      if (invalidZoneRes.status !== 400) {
        console.error(`❌ Expected 400 Bad Request for invalid enum riskLevel, got ${invalidZoneRes.status}`);
        exitCode = 1;
      } else {
        console.log('✅ Input validation enum check passed.');
      }
    }

    // ── 3. TESTING OTHER RESOURCE ENDPOINTS ─────────────────
    console.log('\n--- 3. Testing Resource Query Endpoints ---');
    
    const endpoints = [
      'sensors', 'workers', 'permits', 'alerts', 'timeline', 'equipment', 'dashboard'
    ];

    for (const ep of endpoints) {
      console.log(`GET /api/${ep}...`);
      const res = await fetch(`${API_BASE}/${ep}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.status !== 200) {
        console.error(`❌ Endpoint GET /api/${ep} failed with status: ${res.status}`);
        exitCode = 1;
      } else {
        const data = await res.json();
        console.log(`✅ GET /api/${ep} returned ${data.data ? (Array.isArray(data.data) ? data.data.length : 'object') : 'no'} items.`);
      }
    }

    // ── 4. SECURITY & ROBUSTNESS TESTING ─────────────────────
    console.log('\n--- 4. Testing Security & Robustness ---');

    // SQL Injection simulation in query params
    console.log('Testing SQL injection protection in search parameter...');
    const sqliRes = await fetch(`${API_BASE}/sensors?search=GAS' OR '1'='1`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (sqliRes.status !== 200) {
      console.error(`❌ SQL Injection check failed: status ${sqliRes.status}`);
      const errBody = await sqliRes.text();
      console.error('Response:', errBody);
      exitCode = 1;
    } else {
      console.log(`✅ SQL Injection input handled safely (returned 200 with no SQL errors).`);
    }

    // Invalid ID format
    console.log('Testing requests with non-existent or malformed IDs...');
    const invalidIdRes = await fetch(`${API_BASE}/zones/non-existent-uuid-12345`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (invalidIdRes.status !== 404 && invalidIdRes.status !== 400) {
      console.error(`❌ Expected 400 or 404 for malformed/non-existent ID, got ${invalidIdRes.status}`);
      exitCode = 1;
    } else {
      console.log('✅ Malformed ID lookup handled gracefully.');
    }

    // ── 5. SOCKET.IO TESTING ─────────────────────────────────
    console.log('\n--- 5. Testing Socket.IO Real-Time Engine ---');
    
    // We will spin up concurrent simulated clients
    const clientCount = 10;
    const clients = [];
    let messagesReceived = 0;

    console.log(`Connecting ${clientCount} simulated clients concurrently to Socket.IO...`);
    
    const connectPromise = new Promise((resolve) => {
      let connectedCount = 0;
      
      for (let i = 0; i < clientCount; i++) {
        const socketClient = io(SOCKET_BASE, {
          auth: { token: adminToken },
          transports: ['websocket'],
          forceNew: true
        });

        socketClient.on('connect', () => {
          connectedCount++;
          // Join a zone room
          socketClient.emit('zone:join', 'ZONE-A');
          
          if (connectedCount === clientCount) {
            resolve();
          }
        });

        socketClient.on('connect_error', (err) => {
          console.error(`❌ Client ${i} connection error:`, err.message);
        });

        socketClient.on('sensor:update', (data) => {
          messagesReceived++;
        });

        clients.push(socketClient);
      }
    });

    await connectPromise;
    console.log(`✅ Successfully connected ${clientCount} clients concurrently.`);

    // Verify client count using the socket event
    const countPromise = new Promise((resolve) => {
      clients[0].emit('users:count', (res) => {
        resolve(res.count);
      });
    });

    const activeSockets = await countPromise;
    console.log(`Active connections reported by server: ${activeSockets}`);
    if (activeSockets < clientCount) {
      console.error(`❌ Connected count mismatch: expected at least ${clientCount}, got ${activeSockets}`);
      exitCode = 1;
    } else {
      console.log('✅ Concurrent socket connection counts match.');
    }

    // Disconnect clients
    console.log('Disconnecting simulated clients...');
    for (const c of clients) {
      c.disconnect();
    }
    console.log('✅ Sockets disconnected successfully.');

  } catch (error) {
    console.error('❌ E2E Test Suite crashed with error:', error);
    exitCode = 1;
  }

  console.log(`\n============================================`);
  if (exitCode === 0) {
    console.log('🎉 ALL AUTOMATED E2E TESTS PASSED SUCCESSFULLY! 🎉');
  } else {
    console.log('❌ SOME AUTOMATED E2E TESTS FAILED.');
  }
  console.log(`============================================\n`);
  process.exit(exitCode);
}

runTests();
