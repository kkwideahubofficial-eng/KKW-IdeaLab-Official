
async function testSignup() {
  const url = 'http://localhost:5000/api/auth/signup';
  const payload = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    role: 'team',
    teamName: 'Alpha Team'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.status === 201) {
      console.log('SUCCESS: Signup working for JSON');
    } else {
      console.log('FAILURE: Signup rejected valid JSON');
    }
  } catch (err) {
    console.error('Error connecting to server:', err);
  }
}

testSignup();
