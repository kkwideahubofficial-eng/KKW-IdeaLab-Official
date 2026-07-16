
// Using native fetch and FormData (Node 18+)
import { Buffer } from 'buffer';

async function testMultipartSignup() {
  const url = 'http://localhost:5000/api/auth/signup';
  
  const formData = new FormData();
  formData.append('name', 'Multipart User');
  formData.append('email', `multipart_${Date.now()}@example.com`);
  formData.append('password', 'password123');
  formData.append('role', 'team');
  formData.append('teamName', 'Multipart Team');
  
  // Create a valid 1x1 PNG image
  const imageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR4nGNiAAAABgDNjd8qNAAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(imageBase64, 'base64');
  const blob = new Blob([imageBuffer], { type: 'image/png' });
  formData.append('image', blob, 'test.png');

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    const text = await response.text();
    console.log('Status:', response.status);
    try {
        const data = JSON.parse(text);
        console.log('Response (JSON):', JSON.stringify(data, null, 2));
    } catch (e) {
        console.log('Response (Text):', text);
    }

    if (response.status === 201) {
      console.log('SUCCESS: Signup working for Multipart');
    } else {
      console.log('FAILURE: Signup rejected Multipart');
    }
  } catch (err) {
    console.error('Error connecting to server:', err);
  }
}

testMultipartSignup();
