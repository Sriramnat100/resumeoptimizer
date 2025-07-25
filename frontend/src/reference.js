import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { FileText, Plus, Save, History, Trash2, Edit3, Clock, ArrowLeft, ChevronUp, ChevronDown, LogOut, User, Linkedin, Globe, Sparkles, Zap, Award, Users, Bot, Send, Download } from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Register from './Register';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import AddEntryForm from './components/AddEntryForm';
import AIAssistant from './components/AIAssistant';
import EditableSection from './components/EditableSection';
import LabelManager from './components/LabelManager';
import { formatResumeContent } from './utils/resumeUtils';
import { useDocuments } from './hooks/useDocuments';
import { getDefaultContent } from './utils/resumeUtils';
const {
  documents,
  currentDocument,
  loading,
  saving,
  versions,
  newDocumentTitle,
  newDocumentLabel,
  fetchDocuments,
  createDocument,
  saveDocument,
  deleteDocument,
  setNewDocumentTitle,
  setNewDocumentLabel
} = useDocuments();
console.log("hello");
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function AppContent() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
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
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  

  
  

  // Label System State
  const [labels, setLabels] = useState([]); // Start with empty labels
  const [selectedLabel, setSelectedLabel] = useState('all');
  const [newDocumentLabel, setNewDocumentLabel] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments();
    }
  }, [isAuthenticated]);

  // Add these functions right after the existing useEffect hooks (around line 100)

  // Label Management Functions
  const fetchLabels = async () => {
    console.log('🔄 fetchLabels called!');
    console.log('🔄 Current labels state before fetch:', labels);
    
    // If we already have labels, don't fetch again
    if (labels.length > 0) {
      console.log('🏷️ Labels already loaded, skipping fetch');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token from localStorage:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        console.log('⚠️ No token found, skipping label fetch');
        return;
      }
      
      console.log('📡 Making GET request to fetch labels...');
      const response = await axios.get(`${API_BASE_URL}/api/labels`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Labels fetched from backend:', response.data);
      console.log('✅ About to call setLabels with:', response.data);
      
      setLabels(response.data);
      
    } catch (error) {
      console.error('❌ Error fetching labels:', error);
      console.error('❌ Error details:', error.response?.data);
    }
  };

  const createLabelInBackend = async (name, color) => {
    console.log('🚀 createLabelInBackend called with:', { name, color });
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Token check:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      console.log('📡 Making API call to:', `${API_BASE_URL}/api/labels`);
      
      const response = await axios.post(`${API_BASE_URL}/api/labels`, {
        name: name,
        color: color
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw error;
    }
  };

  // Add useEffect to load labels when user is authenticated (around line 80)
  useEffect(() => {
    console.log('🔄 useEffect triggered - User authentication changed:');
    console.log('   isAuthenticated:', isAuthenticated);
    console.log('   user:', user);
    console.log('   authLoading:', authLoading);
    
    // Only fetch data when user becomes authenticated AND we don't already have data
    if (isAuthenticated && user && !authLoading) {
      console.log('👤 User is authenticated, fetching data...');
      
      // Only fetch documents if we don't have any
      if (documents.length === 0) {
        console.log('📄 Fetching documents...');
        fetchDocuments();
      }
      
      // Only fetch labels if we don't have any  
      if (labels.length === 0) {
        console.log('🏷️ Fetching labels...');
        fetchLabels();
      }
    } else {
      console.log('❌ User not authenticated or still loading');
    }
  }, [isAuthenticated, user, authLoading]); // Add authLoading to dependencies

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication forms if not authenticated
  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <Login onSwitchToRegister={() => setAuthMode('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      console.log('Fetching documents from:', `${API_BASE_URL}/api/documents`);
      const response = await axios.get(`${API_BASE_URL}/api/documents`);
      console.log('Documents fetched successfully:', response.data);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      console.error('Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add this helper function after the existing helper functions
  const getMostRecentDocumentWithLabel = (labelId) => {
    const documentsWithLabel = documents.filter(doc => doc.label === labelId);
    if (documentsWithLabel.length === 0) return null;
    
    // Sort by updated_at and return the most recent
    return documentsWithLabel.sort((a, b) => 
      new Date(b.updated_at) - new Date(a.updated_at)
    )[0];
  };

  // Update the createDocument function
  const createDocument = async () => {
    if (!newDocumentTitle.trim()) return;
    
    // If a label is selected, check if we should open existing or create new
    if (newDocumentLabel) {
      const existingDocument = getMostRecentDocumentWithLabel(newDocumentLabel);
      
      if (existingDocument) {
        // Open the most recent document with this label
        console.log('Opening existing document with label:', newDocumentLabel);
        await openDocument(existingDocument.id);
        setNewDocumentTitle('');
        setNewDocumentLabel('');
        setShowCreateForm(false);
        return;
      }
    }
    
    // Create new document if no existing document with label found
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/documents`, {
        title: newDocumentTitle
      });
      
      // Add label to the document locally
      const documentWithLabel = { ...response.data, label: newDocumentLabel };
      setDocuments([documentWithLabel, ...documents]);
      setNewDocumentTitle('');
      setNewDocumentLabel('');
      setShowCreateForm(false);
      setCurrentDocument(documentWithLabel);
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

  const getResumeContext = () => {
    console.log('📄 [CONTEXT DEBUG] getResumeContext called');
    console.log('📄 [CONTEXT DEBUG] currentDocument exists:', !!currentDocument);
    
    if (!currentDocument) {
      console.log('⚠️ [CONTEXT DEBUG] No current document, returning default message');
      return "No resume is currently open.";
    }
    
    console.log('📄 [CONTEXT DEBUG] Document title:', currentDocument.title);
    console.log('📄 [CONTEXT DEBUG] Document sections count:', currentDocument.sections.length);
    
    let context = `RESUME: ${currentDocument.title}\n\n`;
    
    currentDocument.sections.forEach((section, index) => {
      console.log(`📄 [CONTEXT DEBUG] Processing section ${index + 1}:`, section.title);
      const content = section.content?.text || getDefaultContent(section.title);
      console.log(`📄 [CONTEXT DEBUG] Section ${index + 1} content length:`, content ? content.length : 0);
      console.log(`📄 [CONTEXT DEBUG] Section ${index + 1} has placeholder text:`, content ? (content.includes('YOUR NAME') || content.includes('Text (Lead with')) : false);
      
      if (content && content.trim() && !content.includes('YOUR NAME') && !content.includes('Text (Lead with')) {
        context += `${section.title.toUpperCase()}:\n${content}\n\n`;
        console.log(`📄 [CONTEXT DEBUG] Added section ${index + 1} to context`);
      } else {
        console.log(`📄 [CONTEXT DEBUG] Skipped section ${index + 1} (empty or placeholder)`);
      }
    });
    
    console.log('📄 [CONTEXT DEBUG] Final context length:', context.length);
    console.log('📄 [CONTEXT DEBUG] Final context preview:', context.substring(0, 200) + '...');
    
    return context;
  };

  const parseAiResponse = (aiText) => {
    console.log('🔍 [PARSE DEBUG] parseAiResponse called with text length:', aiText.length);
    console.log('🔍 [PARSE DEBUG] Text preview:', aiText.substring(0, 200) + '...');
    console.log('🔍 [PARSE DEBUG] Text ends with:', aiText.slice(-50));
    
    try {
      // Check if response seems truncated
      const seemsTruncated = aiText.endsWith('{') || aiText.endsWith(',') || aiText.endsWith('[') || !aiText.trim().endsWith('}');
      
      if (seemsTruncated) {
        console.log('⚠️ [PARSE DEBUG] AI response appears truncated:', aiText.slice(-50));
        return { 
          message: aiText + "\n\n⚠️ Response was truncated. Please try asking again for complete suggestions.", 
          edits: [] 
        };
      }

      // Look for the JSON pattern that starts with { and contains "edits"
      console.log('🔍 [PARSE DEBUG] Looking for JSON pattern...');
      const jsonMatch = aiText.match(/\{\s*"edits"\s*:\s*\[[\s\S]*?\]\s*\}/);
      
      if (jsonMatch) {
        console.log('✅ [PARSE DEBUG] Found JSON match!');
        const jsonString = jsonMatch[0];
        console.log('🔍 [PARSE DEBUG] JSON string length:', jsonString.length);
        console.log('🔍 [PARSE DEBUG] JSON string:', jsonString);
        
        // Validate JSON completeness - check for balanced brackets
        const openBraces = (jsonString.match(/\{/g) || []).length;
        const closeBraces = (jsonString.match(/\}/g) || []).length;
        const openBrackets = (jsonString.match(/\[/g) || []).length;
        const closeBrackets = (jsonString.match(/\]/g) || []).length;
        
        console.log('🔍 [PARSE DEBUG] Bracket count - Braces:', openBraces, '/', closeBraces, 'Brackets:', openBrackets, '/', closeBrackets);
        
        if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
          console.log('⚠️ [PARSE DEBUG] JSON appears incomplete - unmatched brackets');
          return { 
            message: aiText + "\n\n⚠️ Suggestions were incomplete. Please try again.", 
            edits: [] 
          };
        }
        
        // Log what we're trying to parse for debugging
        console.log('🔍 [PARSE DEBUG] Attempting to parse JSON...');
        
        const parsed = JSON.parse(jsonString);
        console.log('✅ [PARSE DEBUG] JSON parsed successfully!');
        console.log('🔍 [PARSE DEBUG] Parsed object keys:', Object.keys(parsed));
        console.log('🔍 [PARSE DEBUG] Edits array length:', parsed.edits ? parsed.edits.length : 0);
        
        // Remove the JSON from the message text
        const cleanMessage = aiText.replace(jsonMatch[0], '').trim();
        console.log('🔍 [PARSE DEBUG] Clean message length:', cleanMessage.length);
        
        return {
          message: cleanMessage,
          edits: parsed.edits || []
        };
      } else {
        console.log('⚠️ [PARSE DEBUG] No JSON pattern found in response');
      }
    } catch (e) {
      console.error('💥 [PARSE DEBUG] Failed to parse AI JSON response:', e);
      console.error('💥 [PARSE DEBUG] Error name:', e.name);
      console.error('💥 [PARSE DEBUG] Error message:', e.message);
      console.log('🔍 [PARSE DEBUG] Raw AI text:', aiText);
      
      // Try alternative parsing - look for just the edits array
      try {
        console.log('🔍 [PARSE DEBUG] Trying alternative parsing...');
        const editsMatch = aiText.match(/"edits"\s*:\s*\[[^\]]*\]/);
        if (editsMatch) {
          console.log('✅ [PARSE DEBUG] Found edits match with alternative method');
          const editsJson = `{${editsMatch[0]}}`;
          console.log('🔍 [PARSE DEBUG] Alternative JSON:', editsJson);
          const parsed = JSON.parse(editsJson);
          console.log('✅ [PARSE DEBUG] Alternative parsing successful');
          return {
            message: aiText.replace(editsMatch[0], '').trim(),
            edits: parsed.edits || []
          };
        } else {
          console.log('⚠️ [PARSE DEBUG] No edits match found with alternative method');
        }
      } catch (e2) {
        console.error('💥 [PARSE DEBUG] Alternative parsing also failed:', e2);
        console.error('💥 [PARSE DEBUG] Alternative error name:', e2.name);
        console.error('💥 [PARSE DEBUG] Alternative error message:', e2.message);
      }
    }
    
    // Fallback if no JSON found or parsing failed
    console.log('🔄 [PARSE DEBUG] Using fallback - no JSON found or parsing failed');
    return { message: aiText, edits: [] };
  };





  // Add the missing applyEdit function
  const applyEdit = async (edit) => {
    if (!currentDocument) {
      console.error('No document loaded');
      return;
    }

    if (!currentDocument._id && !currentDocument.id) {
      console.error('Document has no ID:', currentDocument);
      return;
    }

    try {
      console.log('Applying edit:', edit);
      console.log('Current document:', currentDocument);

      // Find the section to edit
      const section = currentDocument.sections.find(s => 
        s.id === edit.sectionId || 
        s.title.toLowerCase().replace(/\s+/g, '-') === edit.sectionId ||
        edit.sectionId.includes(s.title.toLowerCase().replace(/\s+/g, '-'))
      );
      
      if (!section) {
        console.error('Section not found for edit:', edit);
        console.log('Available sections:', currentDocument.sections.map(s => ({ id: s.id, title: s.title })));
        return;
      }

      let newContent = section.content?.text || getDefaultContent(section.title);

      // Apply the edit based on action type
      if (edit.action === 'replace' && edit.find && edit.replace) {
        newContent = newContent.replace(edit.find, edit.replace);
      } else if (edit.action === 'add' && edit.addition) {
        newContent = newContent + '\n' + edit.addition;
      } else if (edit.action === 'remove' && edit.find) {
        newContent = newContent.replace(edit.find, '');
      }

      // Update the document
      const updatedSections = currentDocument.sections.map(s => 
        s.id === section.id 
          ? { ...s, content: { ...s.content, text: newContent } }
          : s
      );

      const updatedDocument = {
        ...currentDocument,
        sections: updatedSections
      };

      // Use _id or id, whichever exists
      const documentId = currentDocument._id || currentDocument.id;
      
      // Save to backend
      await axios.put(`${API_BASE_URL}/api/documents/${documentId}`, updatedDocument);
      
      // Update local state
      setCurrentDocument(updatedDocument);
      
      console.log('Edit applied successfully');
    } catch (error) {
      console.error('Error applying edit:', error);
    }
  };



  const downloadPDF = async () => {
    if (!currentDocument) return;
    
    try {
      // Create a temporary div to render the resume for PDF
      const resumeElement = document.querySelector('.resume-container');
      if (!resumeElement) {
        console.error('Resume container not found');
        return;
      }

      // Use html2canvas to capture the resume
      const canvas = await html2canvas(resumeElement, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Convert canvas to PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      pdf.save(`${currentDocument.title || 'resume'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
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
          className="p-1 text-gray-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed rounded"
          title="Move down"
        >
          <ChevronDown size={16} />
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
        
        {showAddForm === section.id && (
          <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-900">
                Adding to {section.title}
              </h4>
              <button
                onClick={() => setShowAddForm(null)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ✕ Close
              </button>
            </div>
            <AddEntryForm
              section={section}
              onAdd={addNewEntry}
              onCancel={() => setShowAddForm(null)}
            />
          </div>
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
            {formatResumeContent(content)}
          </div>
        </div>
      </div>
    );
  };

  // Add helper functions after the existing functions
  const getLabelColor = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      red: 'bg-red-100 text-red-700 border-red-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      pink: 'bg-pink-100 text-pink-700 border-pink-200',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200'
    };
    return colors[color] || colors.blue;
  };

  const getFilteredDocuments = () => {
    if (selectedLabel === 'all') {
      return documents;
    }
    return documents.filter(doc => doc.label === selectedLabel);
  };

  const addLabelToDocument = (documentId, labelId) => {
    setDocuments(docs => 
      docs.map(doc => 
        doc.id === documentId 
          ? { ...doc, label: labelId }
          : doc
      )
    );
  };

  // Add helper functions for custom label management
  const createCustomLabel = async (name, color) => {
    console.log('🔥 createCustomLabel function called with:', { name, color });
    
    if (!name.trim()) {
      console.log('⚠️ Label name is empty');
      throw new Error('Label name cannot be empty');
    }
    
    console.log('🚀 About to call backend...');
    
    try {
      // Call the backend to create the label
      const createdLabel = await createLabelInBackend(name.trim(), color);
      console.log('✅ Label created in backend:', createdLabel);
      
      // Update local state with the backend response
      setLabels([...labels, createdLabel]);
      
      console.log('✅ Label added to frontend state');
      return createdLabel;
    } catch (error) {
      console.error('❌ Failed to create label:', error);
      throw error;
    }
  };

  const deleteLabel = (labelId) => {
    setLabels(labels.filter(label => label.id !== labelId));
    // Remove label from documents that use it
    setDocuments(docs => 
      docs.map(doc => 
        doc.label === labelId ? { ...doc, label: '' } : doc
      )
    );
    if (selectedLabel === labelId) {
      setSelectedLabel('all');
    }
  };

  const editLabel = async (labelId, name, color) => {
    console.log('✏️ editLabel called with:', { labelId, name, color });
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.put(`${API_BASE_URL}/api/labels/${labelId}`, {
        name: name,
        color: color
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Label updated in backend:', response.data);
      
      // Update the label in the frontend state
      setLabels(labels.map(label => 
        label.id === labelId 
          ? { ...label, name: name, color: color }
          : label
      ));

      return response.data;
    } catch (error) {
      console.error('❌ Failed to update label:', error);
      throw error;
    }
  };

  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Modern Navbar */}
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Resume Optimizer
                  </h1>
                  <p className="text-xs text-gray-500">Powered by AI</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                {/* Social Links */}
                <div className="flex items-center gap-3">
                  <a
                    href="https://www.linkedin.com/in/sriramnat/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-blue-50"
                  >
                    <Linkedin size={16} />
                    <span className="text-sm font-medium">LinkedIn</span>
                  </a>
                  <a
                    href="https://sriramportfolio-w9pq.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-colors px-3 py-2 rounded-lg hover:bg-indigo-50"
                  >
                    <Globe size={16} />
                    <span className="text-sm font-medium">Portfolio</span>
                  </a>
                </div>
                
                {/* User Menu */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-gray-700 bg-white/60 px-3 py-2 rounded-lg">
                    <User size={16} />
                    <span className="text-sm font-medium">{user?.full_name || user?.username}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 text-gray-600 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap size={16} />
              Professional Resume Builder
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Create Stunning Resumes
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                That Get You Hired
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Build professional resumes with AI-powered suggestions, real-time collaboration, and version control. 
              Stand out from the crowd with our modern, ATS-friendly templates.
            </p>
            
            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">ATS Optimized</h3>
                <p className="text-gray-600 text-sm">Ensure your resume passes through Applicant Tracking Systems</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
                <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Professional Templates</h3>
                <p className="text-gray-600 text-sm">Choose from industry-standard, recruiter-approved formats</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
                <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <History className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Version Control</h3>
                <p className="text-gray-600 text-sm">Track changes and restore previous versions anytime</p>
              </div>
            </div>
          </div>

          {/* Create Resume Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 mb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Building Your Resume</h2>
              <p className="text-gray-600">Create a new resume or continue working on existing ones</p>
            </div>
            
            <div className="flex justify-center mb-8">
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <Plus size={24} />
                  <span className="text-lg font-semibold">Create New Resume</span>
                </button>
              ) : (
                <div className="space-y-4 w-full max-w-md mx-auto">
                  <input
                    type="text"
                    value={newDocumentTitle}
                    onChange={(e) => setNewDocumentTitle(e.target.value)}
                    placeholder="Enter resume title..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && createDocument()}
                  />
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Label (optional)</label>
                    <select
                      value={newDocumentLabel}
                      onChange={(e) => setNewDocumentLabel(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">No label</option>
                      {labels.map(label => (
                        <option key={label.id} value={label.id}>
                          {label.name}
                        </option>
                      ))}
                    </select>
                    

                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={createDocument}
                      disabled={!newDocumentTitle.trim() || loading}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewDocumentTitle('');
                        setNewDocumentLabel('');
                      }}
                      className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Label Manager */}
          <LabelManager
            labels={labels}
            selectedLabel={selectedLabel}
            documents={documents}
            onLabelSelect={setSelectedLabel}
            onCreateLabel={createCustomLabel}
            onDeleteLabel={deleteLabel}
            onEditLabel={editLabel}
          />

          {/* Documents Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your resumes...</p>
            </div>
          ) : documents.length > 0 ? (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Your Resumes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredDocuments().map((doc) => (
                  <div key={doc.id} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200/50 overflow-hidden group">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-lg">
                          <FileText className="text-white" size={24} />
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => fetchVersions(doc.id)}
                            className="text-gray-500 hover:text-blue-600 transition-colors p-2 rounded-lg hover:bg-blue-50"
                            title="View versions"
                          >
                            <History size={16} />
                          </button>
                          <button
                            onClick={() => deleteDocument(doc.id)}
                            className="text-gray-500 hover:text-red-600 transition-colors p-2 rounded-lg hover:bg-red-50"
                            title="Delete document"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{doc.title}</h3>
                      
                      {/* Label Display */}
                      {doc.label && (
                        <div className="mb-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getLabelColor(labels.find(l => l.id === doc.label)?.color)}`}>
                            {labels.find(l => l.id === doc.label)?.name}
                          </span>
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-600 mb-4">
                        Last modified: {formatDate(doc.updated_at)}
                      </p>
                      
                      <button
                        onClick={() => openDocument(doc.id)}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium"
                      >
                        Open Document
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText size={48} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">No resumes yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first professional resume to get started on your career journey
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium"
              >
                Create Your First Resume
              </button>
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

                <button
                  onClick={downloadPDF}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download size={16} />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-screen">
          {/* Left Toolbar - Section Tools */}
          <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
            {/* Toolbar Header */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Section Tools</h3>
                  <p className="text-sm text-gray-500">Add content to your resume</p>
                </div>
              </div>
            </div>

            {/* Section Tools */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Add Content</h4>
                
                {currentDocument.sections.map((section) => (
                  // Skip Personal Information section as it doesn't need an add form
                  section.title !== 'Personal Information' && (
                    <button
                      key={section.id}
                      onClick={() => setShowAddForm(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 border rounded-lg transition-all text-left group ${
                        showAddForm === section.id 
                          ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-200' 
                          : 'bg-gray-50 hover:bg-blue-50 border-gray-200 hover:border-blue-200'
                      }`}
                    >
                      <div className={`p-2 rounded ${
                        showAddForm === section.id 
                          ? 'bg-blue-200' 
                          : 'bg-blue-100 group-hover:bg-blue-200'
                      }`}>
                        <Plus className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {getAddButtonText(section.title)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {section.title}
                          {showAddForm === section.id && (
                            <span className="ml-2 text-blue-600 font-medium">• Active</span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                ))}
              </div>

              {/* Section Reordering */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Reorder Sections</h4>
                <div className="space-y-2">
                  {currentDocument.sections.map((section, index) => (
                    // Skip Personal Information section as it should always be at the top
                    section.title !== 'Personal Information' && (
                      <div key={section.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <span className="flex-1 text-sm text-gray-700 truncate">
                          {section.title}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => moveSectionUp(section.id)}
                            disabled={index === 0}
                            className="p-1 text-gray-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed rounded"
                            title="Move up"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            onClick={() => moveSectionDown(section.id)}
                            disabled={index === currentDocument.sections.length - 1}
                            className="p-1 text-gray-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed rounded"
                            title="Move down"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={saveDocument}
                    disabled={saving}
                    className="w-full flex items-center gap-3 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all text-left"
                  >
                    <Save className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">
                      {saving ? 'Saving...' : 'Save Resume'}
                    </span>
                  </button>
                  
                  <button
                    onClick={downloadPDF}
                    className="w-full flex items-center gap-3 px-4 py-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-all text-left"
                  >
                    <Download className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Download PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Resume Editor - Center */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto p-6">
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
                        getDefaultContent={getDefaultContent}
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
          </div>

          {/* AI Assistant Component */}
          <div className="w-96 border-l border-gray-200">
            <AIAssistant
              currentDocument={currentDocument}
              onEditApply={applyEdit}
              onEditReject={(edit) => {
                // Just remove the edit from the UI
                console.log('Edit rejected:', edit);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// Add a global test function for debugging
window.testGeminiAPI = async () => {
  console.log('🧪 [TEST] Testing Gemini API directly...');
  
  const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
  console.log('🧪 [TEST] API key exists:', !!apiKey);
  
  if (!apiKey) {
    console.error('🧪 [TEST] No API key found!');
    return;
  }
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Hello! Can you respond with a simple test message?"
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
        }
      })
    });
    
    console.log('🧪 [TEST] Response status:', response.status);
    console.log('🧪 [TEST] Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🧪 [TEST] HTTP Error:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('🧪 [TEST] Success! Response:', data);
    
  } catch (error) {
    console.error('🧪 [TEST] Error:', error);
    console.error('🧪 [TEST] Error name:', error.name);
    console.error('🧪 [TEST] Error message:', error.message);
  }
};

export default App;