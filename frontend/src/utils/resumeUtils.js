/**
 * Formats resume content with support for markdown-like formatting
 * @param {string} text - The text content to format
 * @returns {Array} Array of React elements with formatting applied
 */
export const formatResumeContent = (text) => {
  if (!text) return [];
  
  return text.split('\n').map((line, index) => {
    // Handle Skills section category: skills format
    const skillsPattern = /^([A-Za-z]+):\s*(.+)$/;
    const skillsMatch = line.trim().match(skillsPattern);
    
    if (skillsMatch) {
      const [, category, skills] = skillsMatch;
      return (
        <div key={index} className="mb-1">
          <span className="font-semibold">{category}:</span> {formatInlineText(skills.trim())}
        </div>
      );
    }
    
    // Handle bullet points
    if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
      return (
        <div key={index} className="flex items-start gap-2 mb-1">
          <span className="text-gray-600 mt-1">•</span>
          <span className="flex-1">{formatInlineText(line.trim().substring(1).trim())}</span>
        </div>
      );
    }
    
    // Handle section headers (all caps)
    if (line.trim() === line.trim().toUpperCase() && line.trim().length > 3) {
      return (
        <div key={index} className="font-semibold text-gray-800 mb-2 mt-3 first:mt-0">
          {line}
        </div>
      );
    }
    
    // Handle lines with company, position, and date (comma-separated)
    const commaDatePattern = /(.+),\s*(.+),\s*([A-Za-z]{3}\s+\d{4}\s*[-–]\s*(?:Present|[A-Za-z]{3}\s+\d{4})|[A-Za-z]{3}\s+\d{4})$/;
    const commaDateMatch = line.match(commaDatePattern);
    
    if (commaDateMatch) {
      const [, company, position, date] = commaDateMatch;
      return (
        <div key={index} className="flex justify-between items-start mb-1">
          <span className="flex-1">
            <strong>{formatInlineText(company.trim())}</strong>, {formatInlineText(position.trim())}
          </span>
          <span className="text-gray-600 ml-4 flex-shrink-0">{date}</span>
        </div>
      );
    }
    
    // Handle lines with position and date separated by spaces (filler text format)
    const positionDatePattern = /^(.+?)\s{3,}([A-Za-z]{3}\s+\d{4}\s*[-–]\s*(?:Present|[A-Za-z]{3}\s+\d{4})|[A-Za-z]{3}\s+\d{4})$/;
    const positionDateMatch = line.match(positionDatePattern);
    
    if (positionDateMatch) {
      const [, position, date] = positionDateMatch;
      return (
        <div key={index} className="flex justify-between items-start mb-1">
          <span className="flex-1">{formatInlineText(position.trim())}</span>
          <span className="text-gray-600 ml-4 flex-shrink-0">{date}</span>
        </div>
      );
    }
    
    // Handle lines with project name and date separated by spaces
    const projectDatePattern = /^(.+?)\s{3,}([A-Za-z]{3}\s+\d{4})$/;
    const projectDateMatch = line.match(projectDatePattern);
    
    if (projectDateMatch) {
      const [, project, date] = projectDateMatch;
      return (
        <div key={index} className="flex justify-between items-start mb-1">
          <span className="flex-1">{formatInlineText(project.trim())}</span>
          <span className="text-gray-600 ml-4 flex-shrink-0">{date}</span>
        </div>
      );
    }
    
    // Handle lines with dates (right-align the dates) - fallback for other formats
    const datePattern = /(.*?)\s+([A-Za-z]{3}\s+\d{4}\s*[-–]\s*(?:Present|[A-Za-z]{3}\s+\d{4})|[A-Za-z]{3}\s+\d{4})$/;
    const dateMatch = line.match(datePattern);
    
    if (dateMatch) {
      const [, content, date] = dateMatch;
      return (
        <div key={index} className="flex justify-between items-start mb-1">
          <span className="flex-1">{formatInlineText(content.trim())}</span>
          <span className="text-gray-600 ml-4 flex-shrink-0">{date}</span>
        </div>
      );
    }
    
    // Handle lines with just dates (center them)
    const justDatePattern = /^([A-Za-z]{3}\s+\d{4}\s*[-–]\s*(?:Present|[A-Za-z]{3}\s+\d{4})|[A-Za-z]{3}\s+\d{4})$/;
    const justDateMatch = line.trim().match(justDatePattern);
    
    if (justDateMatch) {
      return (
        <div key={index} className="text-center mb-1">
          <span className="text-gray-600">{justDateMatch[1]}</span>
        </div>
      );
    }
    
    // Regular line with inline formatting
    return (
      <div key={index} className="mb-1">
        {formatInlineText(line) || <br />}
      </div>
    );
  });
};

/**
 * Formats inline text with bold formatting
 * @param {string} text - The text to format
 * @returns {Array} Array of React elements with bold formatting
 */
const formatInlineText = (text) => {
  if (!text) return '';
  
  // Handle bold text (wrapped in **)
  if (text.includes('**')) {
    const parts = text.split('**');
    return parts.map((part, partIndex) => 
      partIndex % 2 === 1 ? (
        <strong key={partIndex} className="font-semibold">{part}</strong>
      ) : (
        <span key={partIndex}>{part}</span>
      )
    );
  }
  
  return text;
};

/**
 * Converts formatted text back to markdown format for editing
 * @param {string} text - The text to convert
 * @returns {string} Text in markdown format
 */
export const convertToMarkdown = (text) => {
  if (!text) return '';
  
  // Convert bold text back to markdown format
  // This is a simple conversion - in a real app you might want more sophisticated parsing
  return text;
};

/**
 * Gets the default content for a resume section
 * @param {string} title - The section title
 * @returns {string} Default content for the section
 */
export const getDefaultContent = (title) => {
  const defaults = {
    'Personal Information': '**YOUR NAME**\nYour Number | youremail@address.com | Location | Your Website',
    'Skills': 'Languages: Python, Java, C++, JavaScript\nSkills: AWS, React, SQL, MongoDB, Node.js\nTools: Git, Docker, Jenkins, VS Code',
    'Education': '**Your School**, (Degree Name ex Bachelor of Science)                                        **Expected Graduation Date:** Month Year\n**Major:** (Ex: Computer Science), **Minor:** Certificate or Minor in, **GPA:** Out of 4.0\n**Relevant Coursework**: (Optional, only list a couple of the most relevant courses taken)',
    'Experience': '**MOST RECENT EMPLOYER**, Position Title                                                                                     Month Year - Present\n• Text (Lead with STRONG action verb, describe task/duty, your actions, and the result)\n• Text (Check out our guide on how to write strong bullet points for technical resumes)\n• Text\n\n**PREVIOUS EMPLOYER**, Position Title                                                                                       Month Year - Month Year\n**Position Title**\n• Text (Lead with STRONG action verb, describe task/duty, your actions, and the result)\n• Text',
    'Projects': '**PROJECT NAME**                                                                                                                           Month Year - Month Year\n• Text (List a description of academic or personal projects relevant to industry of interest, including awards/accomplishments/outcomes achieved based on some bullet point format from experience)\n• Text\n\n**ANOTHER PROJECT NAME**                                                                                                      Month Year - Month Year\n• Text (List a description of academic or personal projects relevant to industry of interest)\n• Text',
    'Leadership & Community': '**ORGANIZATION**, Position Title                                                                                                    Month Year - Month Year\n**Position Title**\n• Text (Volunteer positions, student organizations, campus engagement - follow the same bullet point format from experience)\n• Text',
    'Awards & Honors': '**ORGANIZATION**                                                                                                                           Month Year - Month Year\n• Text (Volunteer positions, student organizations, campus engagement - follow the same bullet point format from experience)\n• Text',
    'Certifications': '[Certification Name] | [Issuing Organization] | [Date Earned]\n[Certification ID or Credential Number]\n\n[Another Certification] | [Organization] | [Date]\n[Credential details]'
  };
  
  return defaults[title] || 'Enter your content here...';
};
