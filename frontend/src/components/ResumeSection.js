import React, { useState } from 'react';
import { formatResumeContent, getDefaultContent } from '../utils/resumeUtils';
import AddEntryForm from './AddEntryForm';

const ResumeSection = ({ 
  section, 
  isEditing, 
  onEdit, 
  isFirst, 
  isLast,
  onAddEntry // New prop to handle adding entries
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  
  const content = section.content?.text || getDefaultContent(section.title);
  
  const handleAddEntry = (sectionId, newEntry) => {
    onAddEntry(sectionId, newEntry);
    setShowAddForm(false);
  };
  
  if (section.title === 'Personal Information') {
    const lines = content.split('\n');
    return (
      <div className="mb-6">
        <div 
          className="resume-header cursor-pointer hover:bg-blue-50 p-2 rounded border border-transparent hover:border-blue-200 transition-all"
          onClick={() => onEdit(section.id)}
          title="Click to edit"
        >
          <div className="name">{lines[0] || 'YOUR NAME'}</div>
          <div className="contact-info">{lines[1] || 'Contact Information'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Add Form */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-blue-900">
              Adding to {section.title}
            </h4>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ✕ Close
            </button>
          </div>
          <AddEntryForm
            section={section}
            onAdd={handleAddEntry}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}
      
      {/* Resume Section Content */}
      <div className="resume-section">
        <div 
          className="section-header cursor-pointer hover:bg-blue-50 p-1 rounded border border-transparent hover:border-blue-200 transition-all"
          onClick={() => onEdit(section.id)}
          title="Click to edit"
        >
          {section.title.toUpperCase()}
        </div>
        <div 
          className="section-content cursor-pointer hover:bg-blue-50 p-2 rounded border border-transparent hover:border-blue-200 transition-all"
          onClick={() => onEdit(section.id)}
          title="Click to edit"
        >
          {formatResumeContent(content)}
        </div>
      </div>
    </div>
  );
};

export default ResumeSection;
