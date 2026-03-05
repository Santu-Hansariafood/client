
import axios from 'axios';

const testLogin = async () => {
  try {
    const response = await axios.post('http://localhost:5000/api/admin/login', {
      mobile: '7029481930',
      password: '722154'
    }, {
      headers: {
        'x-api-key': '9f6c2a1d4e7b8c3f5a0d2e6b9c4f1a8e7d3c6b2a9f4e1d8c5b7a0f3e6c2d9a1',
        'Content-Type': 'application/json'
      }
    });
    console.log('Login successful:', response.data);
  } catch (error) {
    console.error('Login failed:', error.response ? error.response.data : error.message);
  }
};

testLogin();
