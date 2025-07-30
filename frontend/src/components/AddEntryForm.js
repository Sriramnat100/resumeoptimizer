import React, { useState } from 'react';
import { formatFormDataToText } from '../utils/formUtils';
import { formatDateForInput } from '../utils/dateUtils';

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

const AddEntryForm = ({ section, onAdd, onCancel }) => {
  const [formData, setFormData] = useState({});
  
  const handleAdd = () => {
    // Validate required fields for Education
    if (section.title === 'Education') {
      if (!formData.school || !formData.degree || !formData.graduationDate || !formData.major) {
        alert('Please fill in all required fields (School Name, Degree, Expected Graduation Date, and Major)');
        return;
      }
    }
    
    // Convert form data to formatted text based on section type
    const formattedContent = formatFormDataToText(section.title, formData);
    console.log('🔍 [ADD ENTRY FORM DEBUG] section.title:', section.title);
    console.log('🔍 [ADD ENTRY FORM DEBUG] formData:', formData);
    console.log('🔍 [ADD ENTRY FORM DEBUG] formattedContent:', formattedContent);
    
    if (formattedContent.trim()) {
      console.log('🔍 [ADD ENTRY FORM DEBUG] Calling onAdd with formatted content');
      onAdd(formattedContent); // Remove section.id parameter
    } else {
      console.log('🔍 [ADD ENTRY FORM DEBUG] No content to add, skipping');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      return newData;
    });
  };

  const renderEducationForm = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">School Name *</label>
        <input
          type="text"
          value={formData.school || ''}
          onChange={(e) => handleInputChange('school', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., University of Illinois, Urbana-Champaign"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Degree *</label>
        <input
          type="text"
          value={formData.degree || ''}
          onChange={(e) => handleInputChange('degree', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Bachelor of Science"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expected Graduation Date *</label>
          <input
            type="month"
            value={formData.graduationDate || ''}
            onChange={(e) => handleInputChange('graduationDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2027-05"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GPA (Optional)</label>
          <input
            type="text"
            value={formData.gpa || ''}
            onChange={(e) => handleInputChange('gpa', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 3.93"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Major *</label>
          <input
            type="text"
            value={formData.major || ''}
            onChange={(e) => handleInputChange('major', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Computer Science"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minor (Optional)</label>
          <input
            type="text"
            value={formData.minor || ''}
            onChange={(e) => handleInputChange('minor', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Data Science"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Relevant Coursework (Optional)</label>
        <textarea
          value={formData.coursework || ''}
          onChange={(e) => handleInputChange('coursework', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="2"
          placeholder="e.g., Data Structures and Algorithms(C++), Statistical & Probabilistic Analysis(R), Data Science & Statistical Foundations (Python)"
        />
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Formatting Tips:</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• School name will be bolded automatically</li>
          <li>• Graduation date will be right-aligned</li>
          <li>• Major, Minor, and GPA will be formatted with labels</li>
          <li>• Relevant coursework is optional but recommended</li>
        </ul>
      </div>
    </div>
  );

  const renderExperienceForm = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
        <input
          type="text"
          value={formData.company || ''}
          onChange={(e) => handleInputChange('company', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Google Inc."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
        <input
          type="text"
          value={formData.title || ''}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Senior Software Engineer"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="month"
            value={formData.startDate || ''}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2022-06"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="month"
            value={formData.endDate || ''}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2024-12"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Key Achievements</label>
        <textarea
          value={formData.achievements || ''}
          onChange={(e) => handleInputChange('achievements', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="4"
          placeholder="• Led development of new feature that increased user engagement by 25%&#10;• Mentored 3 junior developers and improved team productivity&#10;• Optimized database queries reducing load times by 40%"
        />
      </div>
      <div className="bg-green-50 border border-green-200 rounded-md p-3 mt-4">
        <h4 className="text-sm font-medium text-green-800 mb-2">💡 Formatting Tips:</h4>
        <ul className="text-xs text-green-700 space-y-1">
          <li>• Company name and job title will be bolded automatically</li>
          <li>• Dates will be right-aligned</li>
          <li>• Use bullet points (•) for achievements</li>
          <li>• Start with strong action verbs (Led, Developed, Implemented)</li>
          <li>• Include quantifiable results when possible</li>
        </ul>
      </div>
    </div>
  );

  const renderSkillsForm = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Skill Category</label>
        <input
          type="text"
          value={formData.category || ''}
          onChange={(e) => handleInputChange('category', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Languages, Skills, Tools, Frameworks, Databases"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
        <textarea
          value={formData.skills || ''}
          onChange={(e) => handleInputChange('skills', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="Enter skills separated by commas or new lines&#10;e.g., Python, JavaScript, React&#10;or:&#10;Python&#10;JavaScript&#10;React"
        />
      </div>
      <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mt-4">
        <h4 className="text-sm font-medium text-orange-800 mb-2">💡 Formatting Tips:</h4>
        <ul className="text-xs text-orange-700 space-y-1">
          <li>• Skills will be grouped by category</li>
          <li>• Multiple skills will be separated by commas</li>
          <li>• Common categories: Languages, Tools, Frameworks</li>
          <li>• List most relevant skills first</li>
        </ul>
      </div>
    </div>
  );

  const renderProjectForm = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
        <input
          type="text"
          value={formData.projectName || ''}
          onChange={(e) => handleInputChange('projectName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., E-commerce Platform"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="month"
            value={formData.startDate || ''}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2023-09"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="month"
            value={formData.endDate || ''}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2024-12"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="4"
          placeholder="• Developed a full-stack e-commerce platform with user authentication&#10;• Implemented payment processing and order management system&#10;• Built responsive UI with modern design patterns&#10;• Deployed application using cloud infrastructure"
        />
      </div>
      <div className="bg-purple-50 border border-purple-200 rounded-md p-3 mt-4">
        <h4 className="text-sm font-medium text-purple-800 mb-2">💡 Formatting Tips:</h4>
        <ul className="text-xs text-purple-700 space-y-1">
          <li>• Project name will be bolded automatically</li>
          <li>• Dates will be right-aligned</li>
          <li>• Use bullet points (•) for project description</li>
          <li>• Focus on your role and technical skills used</li>
          <li>• Include outcomes and impact of the project</li>
        </ul>
      </div>
    </div>
  );

  const renderLeadershipForm = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
        <input
          type="text"
          value={formData.organization || ''}
          onChange={(e) => handleInputChange('organization', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Computer Science Club"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
        <input
          type="text"
          value={formData.position || ''}
          onChange={(e) => handleInputChange('position', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., President"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="month"
            value={formData.startDate || ''}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2023-09"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="month"
            value={formData.endDate || ''}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 2024-12"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities & Achievements</label>
        <textarea
          value={formData.responsibilities || ''}
          onChange={(e) => handleInputChange('responsibilities', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="3"
          placeholder="• Led team of 15 members in organizing tech events&#10;• Increased membership by 40% through outreach programs&#10;• Coordinated with faculty for curriculum improvements"
        />
      </div>
      <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3 mt-4">
        <h4 className="text-sm font-medium text-indigo-800 mb-2">💡 Formatting Tips:</h4>
        <ul className="text-xs text-indigo-700 space-y-1">
          <li>• Organization and position will be bolded automatically</li>
          <li>• Dates will be right-aligned</li>
          <li>• Use bullet points (•) for responsibilities</li>
          <li>• Focus on leadership and impact</li>
          <li>• Include team size and achievements</li>
        </ul>
      </div>
    </div>
  );

  const renderAwardsForm = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Award/Honor Name</label>
        <input
          type="text"
          value={formData.awardName || ''}
          onChange={(e) => handleInputChange('awardName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Dean's List"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Organization</label>
        <input
          type="text"
          value={formData.issuingOrg || ''}
          onChange={(e) => handleInputChange('issuingOrg', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., University of California"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
        <input
          type="month"
          value={formData.dateReceived || ''}
          onChange={(e) => handleInputChange('dateReceived', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., 2024-05"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows="2"
          placeholder="Brief description of the award criteria or significance"
        />
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">💡 Formatting Tips:</h4>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>• Award name and organization will be formatted with separators</li>
          <li>• Date will be formatted as Month Year</li>
          <li>• Include brief description of the award</li>
          <li>• Focus on prestigious or relevant awards</li>
        </ul>
      </div>
    </div>
  );

  const renderCertificationsForm = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Certification Name</label>
        <input
          type="text"
          value={formData.certName || ''}
          onChange={(e) => handleInputChange('certName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., AWS Certified Solutions Architect"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Organization</label>
        <input
          type="text"
          value={formData.issuingOrg || ''}
          onChange={(e) => handleInputChange('issuingOrg', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Amazon Web Services"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date Earned</label>
        <input
          type="month"
          value={formData.dateEarned || ''}
          onChange={(e) => handleInputChange('dateEarned', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., 2024-03"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Credential ID (Optional)</label>
        <input
          type="text"
          value={formData.credentialId || ''}
          onChange={(e) => handleInputChange('credentialId', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., AWS-123456789"
        />
      </div>
      <div className="bg-teal-50 border border-teal-200 rounded-md p-3 mt-4">
        <h4 className="text-sm font-medium text-teal-800 mb-2">💡 Formatting Tips:</h4>
        <ul className="text-xs text-teal-700 space-y-1">
          <li>• Certification name and organization will be formatted with separators</li>
          <li>• Date will be formatted as Month Year</li>
          <li>• Include credential ID if available</li>
          <li>• Focus on industry-recognized certifications</li>
        </ul>
      </div>
    </div>
  );

  const renderPersonalInfoForm = () => (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
        <input
          type="text"
          value={formData.fullName || ''}
          onChange={(e) => handleInputChange('fullName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., John Doe"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
        <input
          type="text"
          value={formData.phone || ''}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., (555) 123-4567"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input
          type="email"
          value={formData.email || ''}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., john.doe@email.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input
          type="text"
          value={formData.location || ''}
          onChange={(e) => handleInputChange('location', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., San Francisco, CA"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Website/LinkedIn (Optional)</label>
        <input
          type="text"
          value={formData.website || ''}
          onChange={(e) => handleInputChange('website', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., linkedin.com/in/johndoe"
        />
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mt-4">
        <h4 className="text-sm font-medium text-gray-800 mb-2">💡 Formatting Tips:</h4>
        <ul className="text-xs text-gray-700 space-y-1">
          <li>• Your name will be bolded automatically</li>
          <li>• Contact info will be separated by pipes (|)</li>
          <li>• Include phone, email, location, and website</li>
          <li>• Keep it professional and concise</li>
        </ul>
      </div>
    </div>
  );

  const renderFormBySection = () => {
    switch (section.title) {
      case 'Education':
        return renderEducationForm();
      case 'Experience':
        return renderExperienceForm();
      case 'Skills':
        return renderSkillsForm();
      case 'Projects':
        return renderProjectForm();
      case 'Leadership & Community':
        return renderLeadershipForm();
      case 'Awards & Honors':
        return renderAwardsForm();
      case 'Certifications':
        return renderCertificationsForm();
      case 'Personal Information':
        return renderPersonalInfoForm();
      default:
        return (
          <div className="space-y-3">
            <textarea
              value={formData.content || ''}
              onChange={(e) => handleInputChange('content', e.target.value)}
              className="w-full h-24 p-3 border border-blue-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder={`Enter new ${section.title.toLowerCase()}...`}
            />
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Formatting Tips:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Use bullet points (•) for lists</li>
                <li>• Use **text** for bold formatting</li>
                <li>• Keep content concise and professional</li>
                <li>• Focus on relevant information for this section</li>
              </ul>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-md font-semibold text-blue-900">Add New {section.title}</h4>
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Add
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
      {renderFormBySection()}
    </div>
  );
};

export default AddEntryForm;
