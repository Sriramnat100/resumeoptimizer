// Quick Test Script for Resume Optimizer
// Run this in the browser console to test key functionality

console.log('🧪 Starting Quick Test Suite...');

// Test 1: Check if we're in the right environment
console.log('📍 Test 1: Environment Check');
console.log('📍 Current URL:', window.location.href);
console.log('📍 React App loaded:', typeof React !== 'undefined');
console.log('📍 Axios available:', typeof axios !== 'undefined');

// Test 2: Check API key
console.log('🔑 Test 2: API Key Check');
const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
console.log('🔑 API key exists:', !!apiKey);
console.log('🔑 API key length:', apiKey ? apiKey.length : 0);
console.log('🔑 API key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'N/A');

// Test 3: Test Gemini API directly
console.log('🌐 Test 3: Direct API Test');
async function runDirectAPITest() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Respond with 'API test successful' if you can read this."
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 50,
        }
      })
    });
    
    console.log('🌐 Response status:', response.status);
    console.log('🌐 Response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Direct API test SUCCESS!');
      console.log('🌐 Response:', data.candidates[0].content.parts[0].text);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Direct API test FAILED:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Direct API test ERROR:', error);
    return false;
  }
}

// Test 4: Check if testGeminiAPI function exists
console.log('🧪 Test 4: Test Function Availability');
console.log('🧪 testGeminiAPI function exists:', typeof window.testGeminiAPI === 'function');

// Test 5: Check localStorage for auth
console.log('🔐 Test 5: Authentication Check');
const token = localStorage.getItem('token');
console.log('🔐 Auth token exists:', !!token);
console.log('🔐 Token length:', token ? token.length : 0);

// Test 6: Check for any console errors
console.log('🚨 Test 6: Error Check');
const originalError = console.error;
let errorCount = 0;
console.error = function(...args) {
  errorCount++;
  originalError.apply(console, args);
};

// Run the direct API test
runDirectAPITest().then(success => {
  console.log('📊 Test Results Summary:');
  console.log('📊 API Key Available:', !!apiKey);
  console.log('📊 Direct API Test:', success ? 'PASSED' : 'FAILED');
  console.log('📊 Test Function Available:', typeof window.testGeminiAPI === 'function');
  console.log('📊 Authentication Token:', !!token);
  console.log('📊 Console Errors:', errorCount);
  
  if (success && apiKey) {
    console.log('🎉 All critical tests PASSED! The app should work correctly.');
  } else {
    console.log('⚠️ Some tests FAILED. Check the logs above for details.');
  }
  
  // Restore original console.error
  console.error = originalError;
});

// Helper function to run all tests
window.runAllTests = function() {
  console.clear();
  console.log('🧪 Running all tests...');
  // This will re-run the entire test suite
  location.reload();
};

console.log('💡 Tip: Run window.runAllTests() to restart all tests');
console.log('💡 Tip: Run testGeminiAPI() to test the API directly'); 