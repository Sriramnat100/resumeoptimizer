/**
 * Prompt Service for Resume Optimizer
 * Industry-standard approach to managing AI instructions and prompts
 */

class PromptService {
  constructor() {
    this.systemPrompt = this.getSystemPrompt();
    this.templates = this.getPromptTemplates();
    this.examples = this.getFewShotExamples();
  }

  /**
   * Get the main system prompt
   * @returns {string} System prompt for the AI
   */
  getSystemPrompt() {
    return `You are an expert resume writing assistant with deep knowledge of ATS (Applicant Tracking System) optimization and professional resume standards.

YOUR ROLE:
- Help users create compelling, professional resumes
- Optimize content for ATS systems and human recruiters
- Provide specific, actionable feedback and suggestions
- Suggest stronger action verbs and impactful descriptions
- Ensure resume follows industry best practices

CRITICAL FOCUS RULE:
- When a user asks about a SPECIFIC section, ONLY provide feedback for that section
- Do NOT suggest changes to other sections unless explicitly asked
- Stay focused on the user's specific question

YOUR APPROACH:
1. ANALYZE: Carefully review the provided resume content
2. IDENTIFY: Spot specific areas for improvement in the requested section only
3. SUGGEST: Provide concrete, actionable recommendations
4. EXPLAIN: Help users understand why changes matter

RESPONSE FORMAT:
- Be specific and actionable
- Provide examples when helpful
- Focus ONLY on the section the user asked about
- Use a helpful, encouraging tone
- If suggesting edits, explain the reasoning
- Keep responses concise but complete
- Ensure all JSON responses are properly closed
- Keep each recommendation under 225 characters
- Be direct and to the point
- Avoid unnecessary explanations

ATS OPTIMIZATION GUIDELINES:
- Use relevant keywords from job descriptions
- Include quantifiable achievements
- Use strong action verbs
- Keep bullet points concise and impactful
- Ensure proper formatting and structure
- Focus on impact and results, not just tasks

IMPORTANT: Always provide complete, well-structured responses that end with valid JSON.`;
  }

  /**
   * Get prompt templates for different use cases
   * @returns {Object} Templates for different scenarios
   */
  getPromptTemplates() {
    return {
      review_experience: `Review this experience section and suggest improvements:

{content}

Focus on:
- Stronger action verbs
- Quantifiable achievements
- ATS optimization
- Impact and results`,

      review_section: `Review this specific section and suggest improvements:

{content}

IMPORTANT: 
- Focus ONLY on this section
- Keep each recommendation under 225 characters
- Be direct and actionable
- Avoid unnecessary explanations`,

      optimize_ats: `Analyze this resume content for ATS optimization:

{content}

Check for:
- Relevant keywords
- Quantifiable achievements
- Strong action verbs
- Proper formatting
- Industry-specific terminology`,

      suggest_verbs: `Suggest stronger action verbs for this content:

{content}

Provide 3-5 alternatives that are:
- More impactful
- Industry-appropriate
- ATS-friendly`,

      improve_bullet: `Improve this bullet point:

{content}

Make it:
- More specific and quantifiable
- Results-focused
- Action-verb driven
- ATS-optimized`,

      skills_analysis: `Analyze this skills section:

{content}

Suggest:
- Missing relevant skills
- Better organization
- Industry-specific additions
- Technical vs. soft skills balance`
    };
  }

  /**
   * Get few-shot examples for better AI responses
   * @returns {Array} Examples of good responses
   */
  getFewShotExamples() {
    return [
      {
        input: "My experience says 'worked on project'",
        output: "Use specific action verbs and quantify results: 'Developed project solutions improving efficiency by 25%'"
      },
      {
        input: "How can I make my bullet points stronger?",
        output: "Focus on impact: 'Led team of 5 developers, delivered 3 features ahead of schedule'"
      },
      {
        input: "What action verbs should I use?",
        output: "Use strong verbs: Developed, Implemented, Led, Managed, Created, Designed. Avoid 'helped' or 'assisted'."
      },
      {
        input: "How do I optimize for ATS?",
        output: "Include job keywords, use standard headers, quantify achievements, clean formatting."
      },
      {
        input: "How can I improve my skills section?",
        output: "Group by category (Languages, Skills, Tools), comma-separated format, match job keywords."
      }
    ];
  }

  /**
   * Build a complete prompt with context
   * @param {string} userMessage - User's message
   * @param {Object} currentDocument - Current resume document
   * @param {string} templateKey - Optional template to use
   * @returns {string} Complete prompt for AI
   */
  buildPrompt(userMessage, currentDocument, templateKey = null, jobDescription = null) {
    let prompt = this.systemPrompt + '\n\n';
    
    // Add resume context
    if (currentDocument) {
      prompt += `CURRENT RESUME CONTENT:\n${this.formatResumeContent(currentDocument)}\n\n`;
    }
    
    // Add job description context if available
    if (jobDescription) {
      prompt += `JOB DESCRIPTION CONTEXT:\n`;
      if (jobDescription.title) prompt += `Position: ${jobDescription.title}\n`;
      if (jobDescription.skills.length > 0) prompt += `Required Skills: ${jobDescription.skills.join(', ')}\n`;
      if (jobDescription.requirements.length > 0) prompt += `Requirements: ${jobDescription.requirements.slice(0, 3).join('; ')}\n`;
      prompt += `\n`;
    }
    
    // Detect if this is a section-specific question
    const sectionKeywords = ['leadership', 'experience', 'skills', 'education', 'projects', 'awards', 'certifications'];
    const isSectionSpecific = sectionKeywords.some(keyword => 
      userMessage.toLowerCase().includes(keyword)
    );
    
    // Add template if specified or if section-specific
    if (templateKey && this.templates[templateKey]) {
      const template = this.templates[templateKey];
      prompt += template.replace('{content}', userMessage) + '\n\n';
    } else if (isSectionSpecific) {
      // Use section-specific template
      const template = this.templates['review_section'];
      prompt += template.replace('{content}', userMessage) + '\n\n';
    } else {
      prompt += `USER QUESTION: ${userMessage}\n\n`;
    }
    
    // Add focus reminder for section-specific questions
    if (isSectionSpecific) {
      prompt += `FOCUS REMINDER: The user is asking about a specific section. Only provide feedback for that section.\n\n`;
    }
    
    // Add job-specific guidance if job description is available
    if (jobDescription) {
      prompt += `JOB-SPECIFIC GUIDANCE:\n- Tailor advice to match the job requirements\n- Include relevant keywords from the job description\n- Focus on skills and experience that align with the position\n\n`;
    }
    
    // Add few-shot examples for better responses
    prompt += `EXAMPLES OF GOOD RESPONSES:\n`;
    this.examples.forEach(example => {
      prompt += `Q: ${example.input}\nA: ${example.output}\n\n`;
    });
    
    return prompt;
  }

  /**
   * Format resume content for AI analysis
   * @param {Object} document - Resume document
   * @returns {string} Formatted resume content
   */
  formatResumeContent(document) {
    if (!document || !document.sections) {
      return "No resume content available.";
    }

    let content = `RESUME: ${document.title}\n\n`;
    
    document.sections.forEach(section => {
      const sectionContent = section.content?.text || '';
      if (sectionContent && sectionContent.trim() && 
          !sectionContent.includes('YOUR NAME') && 
          !sectionContent.includes('Text (Lead with')) {
        content += `${section.title.toUpperCase()}:\n${sectionContent}\n\n`;
      }
    });
    
    return content;
  }

  /**
   * Get a specific template
   * @param {string} templateKey - Template key
   * @returns {string} Template content
   */
  getTemplate(templateKey) {
    return this.templates[templateKey] || null;
  }

  /**
   * Add a new template
   * @param {string} key - Template key
   * @param {string} template - Template content
   */
  addTemplate(key, template) {
    this.templates[key] = template;
  }

  /**
   * Update system prompt
   * @param {string} newPrompt - New system prompt
   */
  updateSystemPrompt(newPrompt) {
    this.systemPrompt = newPrompt;
  }
}

// Export singleton instance
const promptService = new PromptService();
export default promptService; 