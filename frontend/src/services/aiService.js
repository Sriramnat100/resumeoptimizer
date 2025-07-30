/**
 * AI Service for Resume Optimizer
 * Centralized service for all AI-related functionality including Gemini API integration
 */

import { parseAiResponse, generateFallbackResponse } from '../utils/aiUtils';
import { getDefaultContent } from '../utils/resumeUtils';
import promptService from './promptService';
import { analyzeJobDescription } from '../utils/jobDescriptionUtils';

class AIService {
  constructor() {
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    this.isAvailable = !!this.apiKey;
    this.currentJobDescription = null; // Store current job description
  }

  /**
   * Check if AI service is available
   * @returns {boolean} Whether AI service can be used
   */
  isServiceAvailable() {
    return this.isAvailable;
  }

  /**
   * Get resume context for AI analysis
   * @param {Object} currentDocument - Current resume document
   * @returns {string} Formatted resume context
   */
  getResumeContext(currentDocument) {
    console.log('🤖 [AI SERVICE] Getting context for currentDocument:', currentDocument);
    
    if (!currentDocument) {
      console.log('⚠️ [AI SERVICE] No current document available');
      return "No resume is currently open.";
    }
    
    console.log('🤖 [AI SERVICE] Document title:', currentDocument.title);
    console.log('🤖 [AI SERVICE] Document sections:', currentDocument.sections?.length);
    
    let context = `RESUME: ${currentDocument.title}\n\n`;
    
    if (currentDocument.sections) {
      currentDocument.sections.forEach(section => {
        const content = section.content?.text || getDefaultContent(section.title);
        console.log(`🤖 [AI SERVICE] Section ${section.title} content:`, content?.substring(0, 100));
        
        if (content && content.trim() && !content.includes('YOUR NAME') && !content.includes('Text (Lead with')) {
          context += `${section.title.toUpperCase()}:\n${content}\n\n`;
        }
      });
    }
    
    console.log('�� [AI SERVICE] Final context length:', context.length);
    return context;
  }

  /**
   * Send message to AI and get response
   * @param {string} message - User's message
   * @param {Object} currentDocument - Current resume document
   * @returns {Promise<Object>} AI response with message and edits
   */
  async sendMessage(message, currentDocument) {
    console.log('🤖 [AI SERVICE] sendMessage called with:', message);
    console.log('🤖 [AI SERVICE] currentDocument from parameter:', currentDocument);
    
    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    // Check if this is a job description
    const jobAnalysis = analyzeJobDescription(message);
    console.log('🔍 [AI SERVICE] Job analysis result:', jobAnalysis);
    
    if (jobAnalysis.isJobDescription) {
      console.log('📋 [AI SERVICE] Job description detected!');
      this.currentJobDescription = jobAnalysis.parsed;
      
      return {
        message: `✅ Job description saved! I'll use this to tailor my advice.\n\nKey points:\n${jobAnalysis.advice}`,
        edits: []
      };
    }

    // Check if AI service is available
    if (!this.isServiceAvailable()) {
      console.log('⚠️ [AI SERVICE] No API key available, using fallback');
      return {
        message: generateFallbackResponse(message),
        edits: []
      };
    }

    try {
      // Get current resume context
      const resumeContext = this.getResumeContext(currentDocument);
      console.log('�� [AI SERVICE] About to call getResumeContext');
      console.log('🤖 [AI SERVICE] getResumeContext result:', resumeContext);
      console.log('🤖 [AI SERVICE] resumeContext received:', resumeContext);
      console.log('🤖 [AI SERVICE] resumeContext length:', resumeContext.length);
      
      // Build prompt using the prompt service with job context
      const prompt = promptService.buildPrompt(message, currentDocument, null, this.currentJobDescription);
      
      // Prepare request payload
      const requestPayload = {
        contents: [
          {
            parts: [
              {
                text: prompt + `

CRITICAL INSTRUCTIONS - FOLLOW EXACTLY:
1. Provide helpful advice in your response
2. If you can suggest specific improvements, you MUST include them in this EXACT JSON format at the very end of your response
3. CRITICAL: Your response MUST be complete and the JSON MUST be properly closed

RESPONSE STRUCTURE (MANDATORY):
- First: Provide your advice and suggestions (focus ONLY on the section asked about)
- Then: Add a blank line
- Finally: Include the COMPLETE JSON (must end with } and be valid)

CONCISENESS RULES - EXTREMELY IMPORTANT:
- Keep each recommendation under 225 characters
- Be direct and to the point
- Avoid unnecessary explanations
- Focus on actionable feedback
- Use bullet points for clarity

FOCUS RULE - EXTREMELY IMPORTANT:
- If user asks about a specific section, ONLY provide feedback for that section
- Do NOT suggest changes to other sections unless explicitly asked
- Stay focused on the user's specific question

JSON REQUIREMENTS - EXTREMELY IMPORTANT:
- The JSON must be at the very end of your response
- NO text after the closing brace }
- NO text on the same line as the JSON
- The JSON must be valid and parseable
- Use "replace" for changing existing text
- Use "add" for adding new text (use "addition" field instead of "replace") 
- Use "remove" for deleting text
- The "find" text must match EXACTLY what's in the resume
- Only include edits if you can make specific, actionable improvements
- If no edits are needed, return empty "edits" array: {"edits": []}
- SECTION NAMES MUST BE EXACT: Use "Skills", "Experience", "Education", "Projects", "Leadership & Community", "Awards & Honors", "Certifications", "Personal Information"
- Keep "reason" field under 225 characters
- Be concise in all text fields

SKILLS SECTION FORMAT - CRITICAL:
- Skills section uses category: skills format (e.g., "Languages: Python, Java, C++, (New Line) Skills: AWS, React, SQL, MongoDB, Node.js")
- Each category should be on its own line
- Skills within a category are comma-separated
- Common categories: Languages, Skills, Tools, Frameworks, Databases
- Do NOT use bullet points for Skills section
- Format: "Category: skill1, skill2, skill3"

COMPLETE JSON FORMAT (MUST END WITH THIS - NO EXCEPTIONS):
{
  "edits": [
    {
      "section": "Skills",
      "action": "replace",
      "find": "exact text to find",
      "replace": "new text", 
      "reason": "explanation of the change"
    }
  ]
}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 3000,
          topP: 0.8,
          topK: 40
        }
      };

      const apiUrl = `${this.baseUrl}?key=${this.apiKey}`;
      
      console.log('🌐 [AI SERVICE] Making API request to:', apiUrl);
      
      const startTime = Date.now();
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      const endTime = Date.now();
      console.log('⏱️ [AI SERVICE] Response received in:', endTime - startTime, 'ms');
      console.log('📡 [AI SERVICE] Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Gemini API error');
      }

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Unexpected response structure from Gemini API');
      }

      const aiText = data.candidates[0].content.parts[0].text;
      console.log('🤖 [AI SERVICE] Raw AI response:', aiText);
      const parsedResponse = parseAiResponse(aiText);
      console.log('🤖 [AI SERVICE] Parsed response:', parsedResponse);
      console.log('🤖 [AI SERVICE] Parsed edits:', parsedResponse.edits);

      return parsedResponse;

    } catch (error) {
      console.error('�� [AI SERVICE] Error caught in sendMessage:', error);
      throw error;
    }
  }

  /**
   * Generate fallback response when AI is unavailable
   * @param {string} message - User's message
   * @returns {Object} Fallback response with message and empty edits
   */
  generateFallbackResponse(message) {
    const fallbackMessage = generateFallbackResponse(message);
    return {
      message: fallbackMessage,
      edits: []
    };
  }

  /**
   * Get AI service status
   * @returns {Object} Service status information
   */
  getServiceStatus() {
    return {
      available: this.isServiceAvailable(),
      hasApiKey: !!this.apiKey,
      model: 'gemini-1.5-flash',
      baseUrl: this.baseUrl
    };
  }
}

// Create singleton instance
const aiService = new AIService();

export default aiService;
