# Resume Optimizer Test Checklist

## 🧪 Testing Plan for Debugging Changes

### 1. Basic App Functionality Tests
- [ ] **App loads without errors** - Check browser console for any startup errors
- [ ] **Authentication works** - Login/Register functionality
- [ ] **Document creation** - Create a new resume document
- [ ] **Document editing** - Edit sections and save changes
- [ ] **Document persistence** - Refresh page and verify changes are saved

### 2. AI Assistant Tests (Main Focus)
- [ ] **Console logging works** - Open dev tools and verify debug logs appear
- [ ] **API key detection** - Check if API key is properly loaded
- [ ] **Context generation** - Verify resume context is built correctly
- [ ] **Direct API test** - Run `testGeminiAPI()` in console
- [ ] **AI message sending** - Send a simple message to AI assistant
- [ ] **Response parsing** - Check if AI responses are parsed correctly
- [ ] **Error handling** - Verify fallback responses work when API fails

### 3. Specific Test Commands

#### Test 1: Basic API Test
```javascript
// In browser console
testGeminiAPI()
```
**Expected:** Should show success response from Gemini API

#### Test 2: AI Assistant Test
```javascript
// Send a simple message through the UI
"Can you help me improve my resume?"
```
**Expected:** Should see detailed debug logs and either AI response or fallback

#### Test 3: Context Generation Test
```javascript
// Check if context is being built properly
// Look for logs like:
// [CONTEXT DEBUG] getResumeContext called
// [CONTEXT DEBUG] Document sections count: X
// [CONTEXT DEBUG] Final context length: XXXX
```

### 4. Debug Log Analysis

#### ✅ Good Signs:
- `🚀 [AI DEBUG] sendAiMessage called with: [message]`
- `🔑 [AI DEBUG] API key exists: true`
- `📄 [CONTEXT DEBUG] getResumeContext called`
- `🌐 [AI DEBUG] Making API request to: [url]`
- `📡 [AI DEBUG] Response status: 200`

#### ❌ Problem Signs:
- `⚠️ [AI DEBUG] No API key found`
- `❌ [AI DEBUG] HTTP error: 503`
- `💥 [AI DEBUG] Error caught in sendAiMessage`
- `🔄 [AI DEBUG] Adding fallback response due to error`

### 5. Network Tab Analysis
1. Open Dev Tools → Network tab
2. Send an AI message
3. Look for the request to `generativelanguage.googleapis.com`
4. Check:
   - Request status (200 = good, 503 = bad)
   - Request headers (should include Content-Type)
   - Response body (should contain AI response)

### 6. Common Issues & Solutions

#### Issue: "API key not valid"
- **Check:** `.env` file has correct API key
- **Solution:** Verify API key in environment file

#### Issue: "CORS error"
- **Check:** Network tab for CORS errors
- **Solution:** API should work from browser (no CORS issues with Gemini)

#### Issue: "503 Service Unavailable"
- **Check:** Network tab for 503 status
- **Solution:** Wait a few minutes, try again (rate limiting)

#### Issue: "Response parsing failed"
- **Check:** Console for parsing error logs
- **Solution:** Check if AI response format changed

### 7. Performance Tests
- [ ] **Response time** - AI responses should come within 5-10 seconds
- [ ] **Memory usage** - No memory leaks during extended use
- [ ] **UI responsiveness** - App should remain responsive during AI calls

### 8. Edge Cases
- [ ] **Empty resume** - Test with no content
- [ ] **Very long resume** - Test with extensive content
- [ ] **Special characters** - Test with unusual text
- [ ] **Network interruption** - Test with poor connection

## 🎯 Quick Test Sequence

1. **Start the app** and open browser console
2. **Login** and create/open a document
3. **Run direct API test:** `testGeminiAPI()`
4. **Send AI message:** "Hello, can you help me?"
5. **Check console logs** for any errors
6. **Check Network tab** for API request details
7. **Verify response** appears in chat

## 📊 Success Criteria

✅ **All tests pass** = App is working correctly
⚠️ **Some tests fail** = Need to investigate specific issues
❌ **Most tests fail** = Major issue requiring deeper debugging

## 🔧 If Tests Fail

1. **Check console logs** for specific error messages
2. **Verify API key** is correct and loaded
3. **Test network connectivity** to Gemini API
4. **Check browser compatibility** (Chrome/Firefox/Safari)
5. **Try incognito mode** to rule out cache issues 