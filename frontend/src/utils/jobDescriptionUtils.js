/**
 * Job Description Detection and Parsing Utilities
 */

/**
 * Detect if the input is a job description
 * @param {string} input - User input text
 * @returns {boolean} True if it appears to be a job description
 */
export const isJobDescription = (input) => {
  if (!input || input.length < 50) return false;
  
  const jobKeywords = [
    'job description', 'position', 'role', 'responsibilities', 'requirements',
    'qualifications', 'experience', 'skills', 'duties', 'requirements',
    'minimum', 'preferred', 'bachelor', 'degree', 'years of experience',
    'salary', 'benefits', 'location', 'remote', 'hybrid', 'full-time',
    'part-time', 'contract', 'permanent', 'entry-level', 'senior',
    'junior', 'lead', 'manager', 'director', 'engineer', 'developer',
    'analyst', 'specialist', 'coordinator', 'assistant'
  ];
  
  const lowerInput = input.toLowerCase();
  const keywordMatches = jobKeywords.filter(keyword => 
    lowerInput.includes(keyword)
  ).length;
  
  // If it has multiple job-related keywords, it's likely a job description
  return keywordMatches >= 3;
};

/**
 * Extract key information from job description
 * @param {string} jobDescription - The job description text
 * @returns {Object} Parsed job information
 */
export const parseJobDescription = (jobDescription) => {
  const parsed = {
    title: '',
    company: '',
    requirements: [],
    responsibilities: [],
    skills: [],
    experience: '',
    education: '',
    location: '',
    type: ''
  };
  
  const lines = jobDescription.split('\n').map(line => line.trim()).filter(line => line);
  
  // Extract job title (usually in first few lines)
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (line.length > 0 && line.length < 100 && 
        !line.toLowerCase().includes('job description') &&
        !line.toLowerCase().includes('requirements') &&
        !line.toLowerCase().includes('responsibilities')) {
      parsed.title = line;
      break;
    }
  }
  
  // Extract skills and requirements
  const skillKeywords = [
    'skills', 'technologies', 'tools', 'languages', 'frameworks',
    'databases', 'platforms', 'software', 'programming'
  ];
  
  const requirementKeywords = [
    'requirements', 'qualifications', 'minimum', 'preferred',
    'experience', 'education', 'degree', 'certification'
  ];
  
  let inSkillsSection = false;
  let inRequirementsSection = false;
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Detect sections
    if (skillKeywords.some(keyword => lowerLine.includes(keyword))) {
      inSkillsSection = true;
      inRequirementsSection = false;
    } else if (requirementKeywords.some(keyword => lowerLine.includes(keyword))) {
      inRequirementsSection = true;
      inSkillsSection = false;
    }
    
    // Extract skills
    if (inSkillsSection && line.includes(',')) {
      const skills = line.split(',').map(skill => skill.trim()).filter(skill => skill);
      parsed.skills.push(...skills);
    }
    
    // Extract requirements
    if (inRequirementsSection && line.length > 0) {
      parsed.requirements.push(line);
    }
  }
  
  return parsed;
};

/**
 * Generate ATS optimization advice based on job description
 * @param {Object} jobInfo - Parsed job information
 * @returns {string} Tailored advice
 */
export const generateJobSpecificAdvice = (jobInfo) => {
  let advice = [];
  
  if (jobInfo.skills.length > 0) {
    advice.push(`Include these skills: ${jobInfo.skills.slice(0, 5).join(', ')}`);
  }
  
  if (jobInfo.title) {
    advice.push(`Tailor experience for: ${jobInfo.title}`);
  }
  
  if (jobInfo.requirements.length > 0) {
    advice.push(`Address requirements: ${jobInfo.requirements.slice(0, 3).join('; ')}`);
  }
  
  return advice.join('. ');
};

/**
 * Check if text contains job description patterns
 * @param {string} text - Text to analyze
 * @returns {Object} Analysis result
 */
export const analyzeJobDescription = (text) => {
  const isJobDesc = isJobDescription(text);
  
  if (isJobDesc) {
    const parsed = parseJobDescription(text);
    return {
      isJobDescription: true,
      parsed,
      advice: generateJobSpecificAdvice(parsed)
    };
  }
  
  return {
    isJobDescription: false,
    parsed: null,
    advice: null
  };
}; 