/**
 * Date utility functions for resume building
 * Handles various date formats and calculations commonly used in resumes
 */

/**
 * Format a date string to a readable format
 * @param {string|Date} date - Date to format
 * @param {string} format - Format type ('short', 'long', 'month-year', 'year')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    
    case 'long':
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    
    case 'month-year':
      return dateObj.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    
    case 'year':
      return dateObj.getFullYear().toString();
    
    case 'abbreviated':
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      });
    
    default:
      return dateObj.toLocaleDateString();
  }
};

/**
 * Calculate duration between two dates
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date (optional, uses current date if not provided)
 * @returns {object} Duration object with years, months, and formatted string
 */
export const calculateDuration = (startDate, endDate = null) => {
  if (!startDate) return { years: 0, months: 0, formatted: '' };
  
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { years: 0, months: 0, formatted: '' };
  }
  
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  
  let formatted = '';
  if (years > 0) {
    formatted += `${years} year${years !== 1 ? 's' : ''}`;
    if (months > 0) {
      formatted += ` ${months} month${months !== 1 ? 's' : ''}`;
    }
  } else if (months > 0) {
    formatted += `${months} month${months !== 1 ? 's' : ''}`;
  } else {
    formatted = 'Less than 1 month';
  }
  
  return { years, months, formatted };
};

/**
 * Format date range for resume (e.g., "Jan 2023 - Present")
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date (optional)
 * @param {string} presentText - Text to show for current position (default: "Present")
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate = null, presentText = 'Present') => {
  if (!startDate) return '';
  
  const startFormatted = formatDate(startDate, 'abbreviated');
  const endFormatted = endDate ? formatDate(endDate, 'abbreviated') : presentText;
  
  return `${startFormatted} - ${endFormatted}`;
};

/**
 * Check if a date is in the future
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the future
 */
export const isFutureDate = (date) => {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj > new Date();
};

/**
 * Check if a date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isPastDate = (date) => {
  if (!date) return false;
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj < new Date();
};

/**
 * Get relative time description (e.g., "2 years ago", "3 months ago")
 * @param {string|Date} date - Date to get relative time for
 * @returns {string} Relative time description
 */
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffTime = Math.abs(now - dateObj);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`;
  
  const years = Math.floor(diffDays / 365);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
};

/**
 * Validate date format
 * @param {string} dateString - Date string to validate
 * @param {string} format - Expected format ('YYYY-MM-DD', 'MM/DD/YYYY', etc.)
 * @returns {boolean} True if date is valid
 */
export const isValidDate = (dateString, format = 'auto') => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Get current date in various formats
 * @param {string} format - Format type
 * @returns {string} Current date formatted
 */
export const getCurrentDate = (format = 'short') => {
  return formatDate(new Date(), format);
};

/**
 * Get month name from month number
 * @param {number} month - Month number (1-12)
 * @param {boolean} abbreviated - Whether to return abbreviated name
 * @returns {string} Month name
 */
export const getMonthName = (month, abbreviated = false) => {
  const months = abbreviated 
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  return months[month - 1] || '';
};

/**
 * Parse date from various input formats
 * @param {string} dateString - Date string to parse
 * @returns {Date|null} Parsed date or null if invalid
 */
export const parseDate = (dateString) => {
  if (!dateString) return null;
  
  // Try parsing as ISO string
  let date = new Date(dateString);
  if (!isNaN(date.getTime())) return date;
  
  // Try parsing common formats
  const formats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
    /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
    /(\d{1,2})-(\d{1,2})-(\d{4})/,   // MM-DD-YYYY
  ];
  
  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      const [, month, day, year] = match;
      date = new Date(year, month - 1, day);
      if (!isNaN(date.getTime())) return date;
    }
  }
  
  return null;
};

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param {string|Date} date - Date to format
 * @returns {string} Date in YYYY-MM-DD format
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Get academic year from date
 * @param {string|Date} date - Date to get academic year for
 * @returns {string} Academic year (e.g., "2023-2024")
 */
export const getAcademicYear = (date) => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  
  // Academic year typically starts in August/September
  if (month >= 8) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

/**
 * Check if date is within a specific range
 * @param {string|Date} date - Date to check
 * @param {string|Date} startDate - Range start date
 * @param {string|Date} endDate - Range end date
 * @returns {boolean} True if date is within range
 */
export const isDateInRange = (date, startDate, endDate) => {
  if (!date || !startDate) return false;
  
  const dateObj = new Date(date);
  const startObj = new Date(startDate);
  const endObj = endDate ? new Date(endDate) : new Date();
  
  if (isNaN(dateObj.getTime()) || isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
    return false;
  }
  
  return dateObj >= startObj && dateObj <= endObj;
};

/**
 * Get age from birth date
 * @param {string|Date} birthDate - Birth date
 * @returns {number} Age in years
 */
export const getAge = (birthDate) => {
  if (!birthDate) return 0;
  
  const birth = new Date(birthDate);
  const today = new Date();
  
  if (isNaN(birth.getTime())) return 0;
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};
