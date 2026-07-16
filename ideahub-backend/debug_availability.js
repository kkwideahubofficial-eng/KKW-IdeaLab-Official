import axios from 'axios';

async function checkAvailability() {
  try {
    const uniqueEmail = `test_${Date.now()}@example.com`;
    console.log('Registering temp user:', uniqueEmail);

    await axios.post('http://localhost:5000/api/auth/signup', {
        name: 'Debug User',
        email: uniqueEmail,
        password: 'password123',
        role: 'team'
    });
    
    // Login to get token
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
       email: uniqueEmail,
       password: 'password123'
    });

    const token = loginRes.data.token;
    console.log('Got token');

    // Current date YYYY-MM-DD
    const date = new Date().toISOString().split('T')[0];
    console.log(`Checking availability for ${date}...`);
    
    // Add Authorization header
    const response = await axios.get(`http://localhost:5000/api/bookings/availability?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Success:', response.status);
    console.log('Data:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Error Status:', error.response.status);
      console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }
  }
}

checkAvailability();
