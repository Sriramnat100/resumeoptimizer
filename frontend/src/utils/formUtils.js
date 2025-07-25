import { formatDateRange } from './dateUtils';

//A smart form that changes its fields based on the section type    
//It should be able to handle the following section types:
// - Education
// - Experience
// - Skills
// - Projects
// - Leadership & Community
// - Awards & Honors
// - Certifications
// - Personal Information

export const formatFormDataToText = (sectionTitle, formData) => {
  switch (sectionTitle) {
    case 'Education':
      const educationLines = [];
      if (formData.school) educationLines.push(formData.school);
      if (formData.degree) educationLines.push(formData.degree);
      if (formData.graduationDate) educationLines.push(formData.graduationDate);
      if (formData.major) educationLines.push(`Major: ${formData.major}`);
      if (formData.gpa) educationLines.push(`GPA: ${formData.gpa}`);
      if (formData.coursework) educationLines.push(`\nRelevant Coursework: ${formData.coursework}`);
      return educationLines.join('\n');
    
    case 'Experience':
      const experienceLines = [];
      const companyInfo = [];
      if (formData.company) companyInfo.push(formData.company);
      if (formData.title) companyInfo.push(formData.title);
      if (formData.startDate && formData.endDate) {
        companyInfo.push(formatDateRange(formData.startDate, formData.endDate));
      } else if (formData.startDate) {
        companyInfo.push(formatDateRange(formData.startDate));
      }
      if (companyInfo.length > 0) {
        experienceLines.push(companyInfo.join(', '));
      }
      if (formData.achievements) experienceLines.push(formData.achievements);
      return experienceLines.join('\n');
    
    case 'Skills':
      if (formData.category && formData.skills) {
        return `${formData.category}:\n${formData.skills}`;
      } else if (formData.skills) {
        return formData.skills;
      }
      return '';
    
    case 'Projects':
      const projectLines = [];
      if (formData.projectName) projectLines.push(formData.projectName);
      if (formData.technologies) projectLines.push(`Technologies: ${formData.technologies}`);
      if (formData.description) projectLines.push(formData.description);
      if (formData.features) projectLines.push(formData.features);
      return projectLines.join('\n');
    
    case 'Leadership & Community':
      const leadershipLines = [];
      const orgInfo = [];
      if (formData.organization) orgInfo.push(formData.organization);
      if (formData.position) orgInfo.push(formData.position);
      if (formData.startDate && formData.endDate) {
        orgInfo.push(formatDateRange(formData.startDate, formData.endDate));
      } else if (formData.startDate) {
        orgInfo.push(formatDateRange(formData.startDate));
      }
      if (orgInfo.length > 0) {
        leadershipLines.push(orgInfo.join(', '));
      }
      if (formData.responsibilities) leadershipLines.push(formData.responsibilities);
      return leadershipLines.join('\n');
    
    case 'Awards & Honors':
      const awardLines = [];
      const awardLine = [];
      if (formData.awardName) awardLine.push(formData.awardName);
      if (formData.issuingOrg) awardLine.push(formData.issuingOrg);
      if (formData.dateReceived) awardLine.push(formatDate(formData.dateReceived, 'month-year'));
      if (awardLine.length > 0) {
        awardLines.push(awardLine.join(' | '));
      }
      if (formData.description) awardLines.push(formData.description);
      return awardLines.join('\n');
    
    case 'Certifications':
      const certLines = [];
      const certLine = [];
      if (formData.certName) certLine.push(formData.certName);
      if (formData.issuingOrg) certLine.push(formData.issuingOrg);
      if (formData.dateEarned) certLine.push(formatDate(formData.dateEarned, 'month-year'));
      if (certLine.length > 0) {
        certLines.push(certLine.join(' | '));
      }
      if (formData.credentialId) certLines.push(formData.credentialId);
      return certLines.join('\n');
    
    case 'Personal Information':
      const personalLines = [];
      if (formData.fullName) personalLines.push(formData.fullName);
      const contactInfo = [];
      if (formData.phone) contactInfo.push(formData.phone);
      if (formData.email) contactInfo.push(formData.email);
      if (formData.location) contactInfo.push(formData.location);
      if (formData.website) contactInfo.push(formData.website);
      if (contactInfo.length > 0) {
        personalLines.push(contactInfo.join(' | '));
      }
      return personalLines.join('\n');
    
    default:
      return formData.content || '';
  }
};

