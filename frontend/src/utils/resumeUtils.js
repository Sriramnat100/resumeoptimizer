/**
 * Formats resume content with support for markdown-like formatting
 * @param {string} text - The text content to format
 * @returns {Array} Array of React elements with formatting applied
 */
export const formatResumeContent = (text) => {
  if (!text) return [];
  
  return text.split('\n').map((line, index) => {
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
 * Gets the default content for a resume section
 * @param {string} title - The section title
 * @returns {string} Default content for the section
 */
export const getDefaultContent = (title) => {
  const defaults = {
    'Personal Information': 'YOUR NAME\nEmail • Phone • Location • LinkedIn',
    'Skills': '• Python (Intermediate)\n• JavaScript (Advanced)\n• React (Intermediate)\n• Node.js (Beginner)\n• MongoDB (Beginner)',
    'Education': '**UNIVERSITY NAME**\nBachelor of Science in Computer Science\nGraduation Date: May 2024\nGPA: 3.8/4.0',
    'Experience': '**MOST RECENT EMPLOYER**, City, State (Achievement)\nPosition Title                    Jun 2023 - Present\n• Text (Lead with STRONG action verb, describe task/duty, your actions, and the result)\n• Text (Check out our guide on how to write strong bullet points for technical resumes)\n• Text',
    'Projects': '**PROJECT NAME** - Full Stack Web Application\n• Built a responsive web app using React, Node.js, and MongoDB\n• Implemented user authentication and real-time data updates\n• Deployed on AWS with CI/CD pipeline',
    'Leadership & Community': '**ORGANIZATION NAME**, City, State (Achievement)\nPosition Title                    Sep 2023 - Present\n• Text (Lead with STRONG action verb, describe task/duty, your actions, and the result)\n• Text',
    'Awards & Honors': '• Dean\'s List - All Semesters\n• Outstanding Student Award - Computer Science Department\n• Hackathon Winner - University Tech Competition',
    'Certifications': '• AWS Certified Developer Associate\n• Google Cloud Professional Developer\n• Microsoft Azure Fundamentals'
  };
  
  return defaults[title] || 'Enter your content here...';
};
