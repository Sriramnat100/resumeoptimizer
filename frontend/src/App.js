import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { FileText, Plus, Save, History, Download, Trash2, Edit3, Clock, ArrowLeft, ChevronUp, ChevronDown } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [currentView, setCurrentView] = useState('home'); // 'home', 'editor', 'versions'
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [showAddForm, setShowAddForm] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/documents`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    if (!newDocumentTitle.trim()) return;
    
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/documents`, {
        title: newDocumentTitle
      });
      setDocuments([response.data, ...documents]);
      setNewDocumentTitle('');
      setShowCreateForm(false);
      setCurrentDocument(response.data);
      setCurrentView('editor');
    } catch (error) {
      console.error('Error creating document:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDocument = async (documentId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/documents/${documentId}`);
      setCurrentDocument(response.data);
      setCurrentView('editor');
    } catch (error) {
      console.error('Error opening document:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveDocument = async () => {
    if (!currentDocument) return;
    
    try {
      setSaving(true);
      await axios.put(`${API_BASE_URL}/api/documents/${currentDocument.id}`, {
        title: currentDocument.title,
        sections: currentDocument.sections
      });
      
      // Update the document in the list
      setDocuments(documents.map(doc => 
        doc.id === currentDocument.id ? currentDocument : doc
      ));
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSectionContent = (sectionId, newContent) => {
    if (!currentDocument) return;
    
    const updatedSections = currentDocument.sections.map(section =>
      section.id === sectionId 
        ? { ...section, content: { text: newContent } }
        : section
    );
    
    setCurrentDocument({
      ...currentDocument,
      sections: updatedSections
    });
  };

  const moveSectionUp = (sectionId) => {
    if (!currentDocument) return;
    
    const sections = [...currentDocument.sections];
    const index = sections.findIndex(section => section.id === sectionId);
    
    if (index > 0) {
      // Swap with previous section
      [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]];
      
      // Update order values
      sections.forEach((section, i) => {
        section.order = i + 1;
      });
      
      setCurrentDocument({
        ...currentDocument,
        sections
      });
    }
  };

  const moveSectionDown = (sectionId) => {
    if (!currentDocument) return;
    
    const sections = [...currentDocument.sections];
    const index = sections.findIndex(section => section.id === sectionId);
    
    if (index < sections.length - 1) {
      // Swap with next section
      [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
      
      // Update order values
      sections.forEach((section, i) => {
        section.order = i + 1;
      });
      
      setCurrentDocument({
        ...currentDocument,
        sections
      });
    }
  };

  const addNewEntry = (sectionId, newEntry) => {
    if (!currentDocument) return;
    
    const updatedSections = currentDocument.sections.map(section => {
      if (section.id === sectionId) {
        const currentContent = section.content?.text || '';
        const newContent = currentContent + '\n\n' + newEntry;
        return { ...section, content: { text: newContent } };
      }
      return section;
    });
    
    setCurrentDocument({
      ...currentDocument,
      sections: updatedSections
    });
  };

  const deleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/api/documents/${documentId}`);
      setDocuments(documents.filter(doc => doc.id !== documentId));
      if (currentDocument && currentDocument.id === documentId) {
        setCurrentDocument(null);
        setCurrentView('home');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const fetchVersions = async (documentId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/documents/${documentId}/versions`);
      setVersions(response.data);
      setCurrentView('versions');
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const restoreVersion = async (versionNumber) => {
    if (!currentDocument) return;
    
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/documents/${currentDocument.id}/versions/${versionNumber}/restore`);
      setCurrentDocument(response.data);
      setCurrentView('editor');
    } catch (error) {
      console.error('Error restoring version:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDefaultContent = (title) => {
    const defaults = {
      'Personal Information': 'YOUR NAME\nYour Number | youremail@address.com | Location | Your Website',
      'Skills': '• Python (Intermediate)\n• JavaScript (Native)\n• React (Advanced)\n• Node.js (Intermediate)\n• MongoDB (Beginner)',
      'Education': 'Your School, (Degree Name ex Bachelor of Science)                    (Anticipated graduation date) Month\nYear\nMajor:        Certificate or Minor in\nGPA: (only write out if is decent and between 3.25 or 3.5+)\n\nRelevant Coursework: (Optional, only list a couple of the most relevant courses taken)',
      'Experience': 'MOST RECENT EMPLOYER, City, State (Achievement)                    Month Year - Present\nPosition Title\n• Text (Lead with STRONG action verb, describe task/duty, your actions, and the result)\n• Text (Check out our guide on how to write strong bullet points for technical resumes)\n• Text',
      'Projects': 'PROJECT NAME                                                        Month Year\n• Text (List a description of academic or personal projects relevant to industry of interest, including awards/accomplishments/outcomes achieved based on some bullet point format from experience)\n• Text',
      'Leadership & Community': 'ORGANIZATION                                                        Month Year - Month Year\nPosition Title\n• Text (Volunteer positions, student organizations, campus engagement - follow the same bullet point format from experience)\n• Text',
      'Awards & Honors': 'ORGANIZATION                                                        Month Year - Month Year\n• Text (Volunteer positions, student organizations, campus engagement - follow the same bullet point format from experience)\n• Text',
      'Certifications': '[Certification Name] | [Issuing Organization] | [Date Earned]\n[Certification ID or Credential Number]\n\n[Another Certification] | [Organization] | [Date]\n[Credential details]'
    };
    return defaults[title] || '';
  };

  const getAddButtonText = (title) => {
    const buttonTexts = {
      'Personal Information': 'Add header',
      'Skills': 'Add skills',
      'Education': 'Add education',
      'Experience': 'Add experience',
      'Projects': 'Add projects',
      'Leadership & Community': 'Add leadership & community',
      'Awards & Honors': 'Add awards & honors',
      'Certifications': 'Add certifications'
    };
    return buttonTexts[title] || `Add ${title.toLowerCase()}`;
  };

  const getNewEntryTemplate = (title) => {
    const templates = {
      'Skills': '• New Skill (Proficiency Level)',
      'Education': 'School Name, Degree                    Month Year - Month Year\nMajor: Your Major\nGPA: X.X\n\nRelevant Coursework: Course 1, Course 2',
      'Experience': 'COMPANY NAME, City, State                    Month Year - Month Year\nPosition Title\n• Achievement with strong action verb\n• Another key accomplishment\n• Third bullet point',
      'Projects': 'PROJECT NAME                                                        Month Year\n• Project description with key technologies and outcomes\n• Another achievement or feature implemented',
      'Leadership & Community': 'ORGANIZATION NAME                                                        Month Year - Month Year\nPosition/Role\n• Leadership responsibility or community impact\n• Another key contribution',
      'Awards & Honors': 'AWARD NAME                                                        Month Year\n• Description of achievement or recognition\n• Context or significance',
      'Certifications': '[Certification Name] | [Issuing Organization] | [Date Earned]\n[Certification ID or additional details]'
    };
    return templates[title] || `New ${title} entry`;
  };

  const EditableSection = ({ section, onSave, onCancel }) => {
    const [content, setContent] = useState(section.content?.text || getDefaultContent(section.title));
    
    const handleSave = () => {
      onSave(section.id, content);
    };

    return (
      <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-blue-900">Edit {section.title}</h3>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-48 p-4 border border-blue-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder={`Enter ${section.title.toLowerCase()}...`}
          autoFocus
        />
        <div className="mt-2 text-sm text-blue-600">
          <strong>Tip:</strong> Use the traditional resume format shown in the preview. Keep professional formatting and bullet points.
        </div>
      </div>
    );
  };

  const AddEntryForm = ({ section, onAdd, onCancel }) => {
    const [content, setContent] = useState(getNewEntryTemplate(section.title));
    
    const handleAdd = () => {
      onAdd(section.id, content);
      onCancel();
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
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-24 p-3 border border-blue-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder={`Enter new ${section.title.toLowerCase()}...`}
        />
      </div>
    );
  };

  const SectionControls = ({ section, isFirst, isLast }) => {
    return (
      <div className="flex items-center gap-2 ml-4">
        <button
          onClick={() => moveSectionUp(section.id)}
          disabled={isFirst}
          className="p-1 text-gray-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
          title="Move up"
        >
          <ChevronUp size={16} />
        </button>
        <button
          onClick={() => moveSectionDown(section.id)}
          disabled={isLast}
          className="p-1 text-gray-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed"
          title="Move down"
        >
          <ChevronDown size={16} />
        </button>
        <button
          onClick={() => setShowAddForm(section.id)}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors"
        >
          + {getAddButtonText(section.title)}
        </button>
      </div>
    );
  };

  const ResumeSection = ({ section, isEditing, onEdit, isFirst, isLast }) => {
    const content = section.content?.text || getDefaultContent(section.title);
    
    if (section.title === 'Personal Information') {
      const lines = content.split('\n');
      return (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 rounded flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
              </div>
              <span className="text-sm font-medium text-gray-700">Header</span>
            </div>
            <SectionControls section={section} isFirst={isFirst} isLast={isLast} />
          </div>
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
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-300 rounded flex items-center justify-center">
              <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">{section.title}</span>
          </div>
          <SectionControls section={section} isFirst={isFirst} isLast={isLast} />
        </div>
        
        {showAddForm === section.id && (
          <AddEntryForm
            section={section}
            onAdd={addNewEntry}
            onCancel={() => setShowAddForm(null)}
          />
        )}
        
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
            {content.split('\n').map((line, index) => (
              <div key={index} className="content-line">
                {line || <br />}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Google Docs 2.0</h1>
            <p className="text-gray-600">Create and edit professional resumes with traditional formatting</p>
          </div>

          <div className="mb-6">
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Create New Resume
              </button>
            ) : (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newDocumentTitle}
                  onChange={(e) => setNewDocumentTitle(e.target.value)}
                  placeholder="Enter resume title..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && createDocument()}
                />
                <button
                  onClick={createDocument}
                  disabled={!newDocumentTitle.trim() || loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewDocumentTitle('');
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading documents...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <FileText className="text-blue-600 flex-shrink-0" size={24} />
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchVersions(doc.id)}
                          className="text-gray-500 hover:text-blue-600 transition-colors"
                          title="View versions"
                        >
                          <History size={16} />
                        </button>
                        <button
                          onClick={() => deleteDocument(doc.id)}
                          className="text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete document"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{doc.title}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Last modified: {formatDate(doc.updated_at)}
                    </p>
                    
                    <button
                      onClick={() => openDocument(doc.id)}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Open Document
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {documents.length === 0 && !loading && (
            <div className="text-center py-12">
              <FileText size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
              <p className="text-gray-600">Create your first resume to get started</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'versions') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto p-6">
          <div className="mb-6">
            <button
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft size={20} />
              Back to Documents
            </button>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Version History</h1>
            <p className="text-gray-600">View and restore previous versions of your document</p>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading versions...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <div key={version.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="text-blue-600" size={20} />
                      <div>
                        <h3 className="font-semibold text-gray-900">Version {version.version_number}</h3>
                        <p className="text-sm text-gray-600">
                          {formatDate(version.created_at)}
                        </p>
                        {version.description && (
                          <p className="text-sm text-gray-500 mt-1">{version.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => restoreVersion(version.version_number)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'editor' && currentDocument) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentView('home')}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <ArrowLeft size={20} />
                  Back
                </button>
                
                <div className="flex items-center gap-2">
                  <Edit3 className="text-blue-600" size={24} />
                  <input
                    type="text"
                    value={currentDocument.title}
                    onChange={(e) => setCurrentDocument({...currentDocument, title: e.target.value})}
                    className="text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchVersions(currentDocument.id)}
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg transition-colors"
                >
                  <History size={16} />
                  Versions
                </button>
                
                <button
                  onClick={saveDocument}
                  disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-6">
          <div className="flex gap-8">
            {/* Resume Preview */}
            <div className="flex-1">
              <div className="resume-container">
                {currentDocument.sections.map((section, index) => (
                  <div key={section.id}>
                    {editingSection === section.id ? (
                      <EditableSection
                        section={section}
                        onSave={(sectionId, content) => {
                          updateSectionContent(sectionId, content);
                          setEditingSection(null);
                        }}
                        onCancel={() => setEditingSection(null)}
                      />
                    ) : (
                      <ResumeSection
                        section={section}
                        isEditing={editingSection === section.id}
                        onEdit={(sectionId) => setEditingSection(sectionId)}
                        isFirst={index === 0}
                        isLast={index === currentDocument.sections.length - 1}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="w-80">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sticky top-24">
                <h3 className="font-semibold text-blue-900 mb-2">How to Edit</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use ↑↓ arrows to reorder sections</li>
                  <li>• Click "Add [section]" for structured editing</li>
                  <li>• Click directly on text to edit manually</li>
                  <li>• Changes save automatically</li>
                  <li>• Access version history anytime</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;