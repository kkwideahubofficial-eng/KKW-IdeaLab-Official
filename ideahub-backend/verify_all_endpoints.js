
// Polyfill for native fetch if node-fetch isn't resolvable directly in this environment
// Assuming Node 18+ environment where fetch is global.
const safeFetch = fetch;

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
const testUser = {
  name: 'Backend Verifier',
  email: `verify_${Date.now()}@test.com`,
  password: 'password123',
  role: 'coordinator', // Coordinator to access more routes
  teamName: 'Verification Team'
};

async function log(step, message, data = null) {
  console.log(`\n[${step}] ${message}`);
  if (data) {
    if (data.error || data.message) console.log('   Response:', JSON.stringify({ message: data.message, error: data.error }));
    else console.log('   Data Sample:', JSON.stringify(data).substring(0, 150) + (JSON.stringify(data).length > 150 ? '...' : '')); 
  }
}

async function verifyAuth() {
  try {
    // 1. Signup
    // Note: We need to send multipart/form-data for signup now because of image upload, 
    // BUT the controller should handle missing file gracefully if we send JSON? 
    // Wait, multer "upload.single('image')" usually expects multipart. 
    // If we send JSON content-type, multer might skip or throw? 
    // Let's try JSON first, if it fails, we know we MUST use FormData.
    // Actually, the previous change updated the route to use 'upload.single'. 
    // Sending JSON to a Multer route usually results in empty req.body if not handled right, or it works but req.file is empty.
    
    // Attempt 1: Valid JSON
    let res = await safeFetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    // If 400 and complains about boundary, we might need FormData. 
    // But usually express+multer handles JSON if content-type is json, just ignores file.
    
    let data = await res.json();
    if (res.status === 201) {
      log('AUTH', 'Signup Successful', data);
      authToken = data.token; // Signup usually returns user, but maybe login is needed for token? 
      // Checking authController: signup returns { user: ... }, NO token.
    } else {
      log('AUTH', 'Signup Failed', data);
      return false;
    }

    // 2. Login (to get token)
    res = await safeFetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password })
    });
    data = await res.json();
    
    if (res.status === 200) {
      log('AUTH', 'Login Successful', data);
      authToken = data.token;
      return true;
    } else {
      log('AUTH', 'Login Failed', data);
      return false;
    }

  } catch (err) {
    console.error('Auth Verification Error:', err);
    return false;
  }
}

async function verifyEndpoint(name, endpoint) {
  if (!authToken) {
    console.log(`Skipping ${name}: No auth token`);
    return;
  }
  
  try {
    const res = await safeFetch(`${BASE_URL}/${endpoint}`, {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const contentType = res.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    if (res.ok) {
      log(name, `Fetch Successful (${res.status})`, Array.isArray(data) ? `Count: ${data.length}` : data);
    } else {
      log(name, `Fetch Failed (${res.status})`, data);
    }
  } catch (err) {
    console.error(`${name} Error:`, err);
  }
}

async function run() {
  console.log('Starting Backend Verification...');
  
  const authSuccess = await verifyAuth();
  if (!authSuccess) {
    console.log('Stopping: Auth failed, cannot verify protected routes.');
    return;
  }

  // Verify generic lists
  await verifyEndpoint('PRODUCTS', 'products');
  await verifyEndpoint('EVENTS', 'events');
  await verifyEndpoint('ROOMS', 'rooms');
  await verifyEndpoint('TIME SLOTS', 'time-slots');
  await verifyEndpoint('MACHINERY', 'machinery');
  await verifyEndpoint('MACHINES', 'machines');
  await verifyEndpoint('ACHIEVEMENTS', 'achievements');
  
  // Verify user specific
  await verifyEndpoint('BOOKINGS', 'bookings/my-bookings');
  await verifyEndpoint('PROFILE', 'auth/profile');
  
  console.log('\nVerification Complete.');
}

run();
