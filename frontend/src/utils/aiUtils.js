/**
 * AI utility functions for parsing responses and generating fallbacks
 */

/**
 * Parse AI response to extract message and edits
 * @param {string} aiText - Raw AI response text
 * @returns {Object} Object with message and edits array
 */
export const parseAiResponse = (aiText) => {
  console.log('🔍 [PARSE DEBUG] parseAiResponse called with text length:', aiText.length);
  
  try {
    // Check if response seems truncated
    const seemsTruncated = aiText.endsWith('{') || aiText.endsWith(',') || aiText.endsWith('[') || 
                           !aiText.trim().endsWith('}') || 
                           aiText.includes('⚠️ Response was truncated') ||
                           aiText.includes('incomplete') ||
                           aiText.includes('JSON was cut off') ||
                           aiText.includes('⚠️ Response was incomplete') ||
                           aiText.includes('JSON was malformed') ||
                           aiText.includes('JSON response was incomplete') ||
                           aiText.includes('JSON response was malformed');
    
    if (seemsTruncated) {
      console.log('⚠️ [PARSE DEBUG] AI response appears truncated:', aiText.slice(-100));
      return { 
        message: aiText + "\n\n⚠️ Response was incomplete. Please try asking again for complete suggestions.", 
        edits: [] 
      };
    }
    
    // Check for overly verbose responses
    const messageWithoutJson = aiText.replace(/\{[\s\S]*\}/, '').trim();
    if (messageWithoutJson.length > 1000) {
      console.log('⚠️ [PARSE DEBUG] Response is too verbose:', messageWithoutJson.length, 'characters');
      return {
        message: "Response was too verbose. Please provide more concise feedback.",
        edits: []
      };
    }

    console.log('🔍 [PARSE DEBUG] Looking for JSON pattern...');
    // Look for the JSON pattern that starts with { and contains "edits"
    const jsonMatch = aiText.match(/\{\s*"edits"\s*:\s*\[[\s\S]*?\]\s*\}/);
    
    if (jsonMatch) {
      console.log('✅ [PARSE DEBUG] Found JSON match!');
      const jsonString = jsonMatch[0];
      
      // Validate JSON completeness
      const openBraces = (jsonString.match(/\{/g) || []).length;
      const closeBraces = (jsonString.match(/\}/g) || []).length;
      const openBrackets = (jsonString.match(/\[/g) || []).length;
      const closeBrackets = (jsonString.match(/\]/g) || []).length;
      
      if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
        console.log('⚠️ [PARSE DEBUG] JSON brackets/braces mismatch:', { openBraces, closeBraces, openBrackets, closeBrackets });
        return { 
          message: aiText + "\n\n⚠️ JSON response was incomplete. Please try again.", 
          edits: [] 
        };
      }
      
      // Check for incomplete JSON structure
      if (!jsonString.includes('"edits"') || !jsonString.includes('[') || !jsonString.includes(']')) {
        console.log('⚠️ [PARSE DEBUG] JSON missing required structure elements');
        return { 
          message: aiText + "\n\n⚠️ JSON response was malformed. Please try again.", 
          edits: [] 
        };
      }
      
      console.log('🔍 [PARSE DEBUG] Attempting to parse JSON...');
      const parsed = JSON.parse(jsonString);
      const cleanMessage = aiText.replace(jsonMatch[0], '').trim();
      console.log('🔍 [PARSE DEBUG] Clean message length:', cleanMessage.length);
      return {
        message: cleanMessage,
        edits: parsed.edits || []
      };
    }
  } catch (e) {
    console.error('💥 [PARSE DEBUG] Failed to parse AI JSON response:', e);
    
    // Try alternative parsing
    try {
      console.log('🔍 [PARSE DEBUG] Trying alternative parsing...');
      const editsMatch = aiText.match(/"edits"\s*:\s*\[[^\]]*\]/);
      if (editsMatch) {
        const editsJson = `{${editsMatch[0]}}`;
        const parsed = JSON.parse(editsJson);
        return {
          message: aiText.replace(editsMatch[0], '').trim(),
          edits: parsed.edits || []
        };
      }
    } catch (e2) {
      console.error('💥 [PARSE DEBUG] Alternative parsing also failed:', e2);
      console.error('💥 [PARSE DEBUG] Alternative error name:', e2.name);
      console.error('💥 [PARSE DEBUG] Alternative error message:', e2.message);
    }
  }
  
  console.log('🔍 [PARSE DEBUG] Returning fallback response');
  return { message: aiText, edits: [] };
};

/**
 * Generate fallback response when AI API is unavailable
 * @param {string} message - User's message
 * @returns {string} Appropriate fallback response
 */
export const generateFallbackResponse = (message) => {
  const responses = {
    'help': "I'd be happy to help you improve your resume! Here are some areas I can assist with:\n\n• **Skills Section**: Make your skills more specific and relevant\n• **Experience Descriptions**: Use strong action verbs and quantify achievements\n• **ATS Optimization**: Ensure your resume passes through Applicant Tracking Systems\n• **Content Review**: Check for clarity, conciseness, and impact\n\nWhat specific area would you like to focus on?",
    'skills': "For your skills section, consider:\n\n• **Use Categories**: Group skills by type (Languages, Skills, Tools, Frameworks)\n• **Comma-Separated**: List skills within each category with commas\n• **Be Specific**: Instead of 'Python', try 'Python, Django, Flask'\n• **Match Job Requirements**: Align skills with the job description\n• **Format**: Use 'Category: skill1, skill2, skill3' format\n\nExample:\nLanguages: Python, Java, C++\nSkills: AWS, React, SQL\nTools: Git, Docker, Jenkins\n\nWould you like me to help you rewrite your skills?",
    'experience': "To improve your experience descriptions:\n\n• **Use Action Verbs**: Start with strong verbs like 'Developed', 'Implemented', 'Led'\n• **Quantify Achievements**: Include numbers, percentages, and metrics\n• **Focus on Results**: Emphasize outcomes and impact\n• **Use PAR Format**: Problem, Action, Result\n\nWhich experience would you like to enhance?",
    'ats': "For ATS optimization:\n\n• **Use Standard Section Headers**: 'Experience', 'Education', 'Skills'\n• **Include Keywords**: Match job description keywords\n• **Simple Formatting**: Avoid tables, graphics, or complex layouts\n• **Clear Contact Info**: Make sure it's easily readable\n• **Consistent Formatting**: Use standard fonts and bullet points\n\nWould you like me to review your current format?",
    'default': "I'm here to help you create a professional resume! I can assist with:\n\n• Improving your skills section\n• Enhancing experience descriptions\n• Optimizing for ATS systems\n• Suggesting better action verbs\n• Reviewing overall content and structure\n\nWhat would you like to work on?"
  };

  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('skill')) return responses.skills;
  if (lowerMessage.includes('experience') || lowerMessage.includes('work')) return responses.experience;
  if (lowerMessage.includes('ats') || lowerMessage.includes('tracking')) return responses.ats;
  if (lowerMessage.includes('help')) return responses.help;
  return responses.default;
};
