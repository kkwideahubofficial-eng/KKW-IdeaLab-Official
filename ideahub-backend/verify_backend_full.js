
import fs from 'fs';
import path from 'path';
import { Blob } from 'buffer';

const BASE_URL = 'http://127.0.0.1:5000/api';
let AUTH_TOKEN = '';

// Helper to create a dummy image file
const createDummyImage = () => {
    const filePath = path.join(process.cwd(), 'test_image.png');
    // Minimal valid PNG header
    const pngBuffer = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 1, 3, 0, 0, 0, 37, 219, 86, 202, 0, 0, 0, 3, 80, 76, 84, 69, 255, 255, 255, 167, 196, 27, 200, 0, 0, 0, 10, 73, 68, 65, 84, 8, 153, 99, 96, 0, 0, 0, 2, 0, 1, 244, 113, 100, 166, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
    fs.writeFileSync(filePath, pngBuffer);
    return filePath;
};

// Clean up dummy image
const cleanupDummyImage = (filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

const logResult = (testName, success, message = '') => {
  if (success) {
    console.log(`✅ [PASS] ${testName}`);
  } else {
    console.error(`❌ [FAIL] ${testName}: ${message}`);
  }
};

const getFileBlob = (filePath) => {
    const buffer = fs.readFileSync(filePath);
    return new Blob([buffer], { type: 'image/png' });
}

const login = async () => {
  try {
    const email = `test_admin_${Date.now()}@test.com`;
    const password = 'password123';
    const imagePath = createDummyImage();
    const imageBlob = getFileBlob(imagePath);

    // Signup
    const signupData = new FormData();
    signupData.append('name', 'Test Admin');
    signupData.append('email', email);
    signupData.append('password', password);
    signupData.append('role', 'head'); 
    signupData.append('year', 'TY');
    signupData.append('branch', 'CSE');
    signupData.append('image', imageBlob, 'test_image.png');

    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
        method: 'POST',
        body: signupData
    });
    
    if (signupRes.status === 201 || signupRes.status === 200) {
        logResult('Signup', true, `User ${email} created`);
        
        // Login to get token
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (loginRes.ok) {
            const loginData = await loginRes.json();
            AUTH_TOKEN = loginData.token;
            logResult('Login', true, 'Token received');
        } else {
            throw new Error('Login failed after signup');
        }
    } else {
        const text = await signupRes.text();
        console.error('Signup Error Body:', text);
        throw new Error(`Signup failed with status ${signupRes.status}`);
    }
    cleanupDummyImage(imagePath);
  } catch (error) {
    logResult('Authentication', false, error.message);
    process.exit(1);
  }
};

const testAchievements = async () => {
    try {
        const imagePath = createDummyImage();
        const imageBlob = getFileBlob(imagePath);
        
        const formData = new FormData();
        formData.append('title', 'Test Achievement');
        formData.append('description', 'This is a test achievement description.');
        formData.append('date', new Date().toISOString());
        formData.append('achievedBy', 'Test Student');
        formData.append('image', imageBlob, 'test_image.png');

        const res = await fetch(`${BASE_URL}/achievements`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` },
            body: formData
        });

        if (res.ok) {
            logResult('Create Achievement', true);
        } else {
            const data = await res.json();
            logResult('Create Achievement', false, data.message);
        }

        const getRes = await fetch(`${BASE_URL}/achievements`);
        if (getRes.ok) {
            const data = await getRes.json();
             logResult('Get Achievements', true, `Found ${data.length} items`);
        } else {
             logResult('Get Achievements', false);
        }

        cleanupDummyImage(imagePath);
    } catch (e) {
        logResult('Achievements', false, e.message);
    }
};

const testEvents = async () => {
    try {
        const imagePath = createDummyImage();
        const imageBlob = getFileBlob(imagePath);

        const formData = new FormData();
        formData.append('title', 'Test Event');
        formData.append('description', 'This is a test event description.');
        formData.append('date', new Date().toISOString());
        formData.append('organizer', 'Test Org');
        formData.append('image', imageBlob, 'test_image.png');

        const res = await fetch(`${BASE_URL}/events`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` },
            body: formData
        });

        if (res.ok) {
            logResult('Create Event', true);
        } else {
            const data = await res.json();
            logResult('Create Event', false, data.message);
        }
        cleanupDummyImage(imagePath);
    } catch (e) {
        logResult('Events', false, e.message);
    }
};

const testMachinery = async () => {
    try {
        const imagePath = createDummyImage();
        const imageBlob = getFileBlob(imagePath);

        const formData = new FormData();
        formData.append('image', imageBlob, 'test_image.png');

        // Upload first
        const uploadRes = await fetch(`${BASE_URL}/machinery/upload`, {
             method: 'POST',
             headers: { 'Authorization': `Bearer ${AUTH_TOKEN}` },
             body: formData
        });
        
        let imageUrl = '';
        if(uploadRes.ok) {
            const d = await uploadRes.json();
            imageUrl = d.url;
            logResult('Machinery Image Upload', true);
        } else {
            logResult('Machinery Image Upload', false);
            cleanupDummyImage(imagePath);
            return;
        }

        // Create Machine
        const machineData = {
            name: 'Test Drill',
            description: 'Test Description',
            capacity: 5,
            imageUrl: imageUrl,
            timeSlots: [{day: 'Monday', startTime: '10:00', endTime:'12:00'}]
        };

        const res = await fetch(`${BASE_URL}/machinery`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(machineData)
        });

        if (res.ok) {
            logResult('Create Machinery', true);
        } else {
             const d = await res.json();
             logResult('Create Machinery', false, d.message);
        }
        cleanupDummyImage(imagePath);
    } catch (e) {
        logResult('Machinery', false, e.message);
    }
};

const testNegativeImage = async () => {
     try {
        // Try creating product without image
        const productData = {
            title: 'No Image Product',
            description: 'Should Fail',
            price: 100,
            stock: 10
        };
        
        const res = await fetch(`${BASE_URL}/products`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(productData)
        });

        if (!res.ok) {
             const d = await res.json();
             // Expecting validation error
             if (d.message && d.message.includes('Product validation failed')) {
                 logResult('Negative Test: Create Product No Image', true, 'Correctly failed');
             } else {
                 logResult('Negative Test: Create Product No Image', true, `Failed as expected: ${d.message}`);
             }
        } else {
            logResult('Negative Test: Create Product No Image', false, 'Should have failed but succeeded');
        }
     } catch (e) {
         logResult('Negative Test', false, e.message);
     }
}

const run = async () => {
    console.log('Starting Backend Verification...');
    await login();
    await testAchievements();
    await testEvents();
    await testMachinery();
    await testNegativeImage();
    console.log('Verification Complete.');
};

run();
