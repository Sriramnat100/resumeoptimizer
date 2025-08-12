/**
 * AI Service for Resume Optimizer (frontend)
 * Now proxies all AI calls to the backend AI endpoints
 */

import axios from 'axios';
import { generateFallbackResponse } from '../utils/aiUtils';
import { analyzeJobDescription } from '../utils/jobDescriptionUtils';

class AIService {
  constructor() {
    this.backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
    this.currentJobDescription = null;
  }

  /**
   * Check if AI service is available
   * @returns {boolean} Whether AI service can be used
   */
  async isServiceAvailable() {
    try {
      const { data } = await axios.get(`${this.backendUrl}/api/ai/status`);
      return !!data?.available;
    } catch {
      return false;
    }
  }

  /**
   * Get resume context for AI analysis
   * @param {Object} currentDocument - Current resume document
   * @returns {string} Formatted resume context
   */
  getResumeContext(currentDocument) {
    // Kept for compatibility if any component needs it locally
    if (!currentDocument) return 'No resume is currently open.';
    let context = `RESUME: ${currentDocument.title}\n\n`;
    if (currentDocument.sections) {
      currentDocument.sections.forEach(section => {
        const content = section.content?.text || '';
        if (content && content.trim() && !content.includes('YOUR NAME') && !content.includes('Text (Lead with')) {
          context += `${section.title.toUpperCase()}:\n${content}\n\n`;
        }
      });
    }
    return context;
  }

  /**
   * Send message to AI and get response
   * @param {string} message - User's message
   * @param {Object} currentDocument - Current resume document
   * @returns {Promise<Object>} AI response with message and edits
   */
  async sendMessage(message, currentDocument) {
    if (!message.trim()) throw new Error('Message cannot be empty');

    // Backend-only detection: always await backend structured response

    try {
      const { data } = await axios.post(`${this.backendUrl}/api/ai/chat`, {
        message,
        resume_data: currentDocument,
      });
      // Backend already returns { message, edits }
      return data;
    } catch (error) {
      console.error('💥 [AI SERVICE] Backend chat error:', error);
      return { message: generateFallbackResponse(message), edits: [] };
    }
  }

  async analyzeSection(sectionContent, userQuestion, currentDocument) {
    try {
      const { data } = await axios.post(`${this.backendUrl}/api/ai/section`, {
        section_content: sectionContent,
        user_question: userQuestion,
        resume_data: currentDocument,
      });
      return data;
    } catch (error) {
      console.error('💥 [AI SERVICE] Backend section error:', error);
      return { message: generateFallbackResponse(userQuestion), edits: [] };
    }
  }

  async generateATS(resumeData, jobDescription) {
    try {
      const { data } = await axios.post(`${this.backendUrl}/api/ai/ats`, {
        resume_data: resumeData,
        job_description: jobDescription || null,
      });
      return data;
    } catch (error) {
      console.error('💥 [AI SERVICE] Backend ATS error:', error);
      return { message: generateFallbackResponse('ATS optimization'), edits: [] };
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
    // Keep interface; returns optimistic status (for UI badges)
    return { available: true };
  }
}

// Create singleton instance
const aiService = new AIService();

export default aiService;
