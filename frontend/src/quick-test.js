// Quick Test Script for Resume Optimizer - Backend AI
// Run this in the browser console to test key backend functionality

/* global axios */

console.log('🧪 Starting Quick Test Suite (Backend AI)...');

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// Test 1: Environment check
console.log('📍 Test 1: Environment Check');
console.log('📍 Current URL:', window.location.href);
console.log('📍 Axios available:', typeof axios !== 'undefined');
console.log('📍 Backend URL:', BACKEND_URL);

// Test 2: Backend AI status
async function testStatus() {
  try {
    const { data } = await axios.get(`${BACKEND_URL}/api/ai/status`);
    console.log('🤖 /api/ai/status:', data);
    return !!data?.available;
  } catch (e) {
    console.error('❌ Status error:', e);
    return false;
  }
}

// Test 3: Backend AI chat
async function testChat() {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const { data } = await axios.post(
      `${BACKEND_URL}/api/ai/chat`,
      {
        message: 'Quick health check: say hello briefly.',
        resume_data: { title: 'Test', sections: [] },
      },
      { headers }
    );
    console.log('💬 /api/ai/chat:', data);
    return typeof data?.message === 'string';
  } catch (e) {
    console.error('❌ Chat error:', e?.response?.data || e.message);
    return false;
  }
}

// Test 4: Auth token present
console.log('🔐 Test 4: Authentication Check');
const token = localStorage.getItem('token');
console.log('🔐 Auth token exists:', !!token);

// Run tests
(async () => {
  const statusOk = await testStatus();
  const chatOk = await testChat();
  
  console.log('📊 Test Results Summary:');
  console.log('📊 Backend Status:', statusOk ? 'OK' : 'UNAVAILABLE');
  console.log('📊 Chat Endpoint:', chatOk ? 'OK' : 'FAILED');
  console.log('📊 Auth Token Present:', !!token);
})();