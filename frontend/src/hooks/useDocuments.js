import { useState, useEffect } from 'react';
import axios from 'axios';
import { getDefaultContent } from '../utils/resumeUtils';
import { formatDate } from '../utils/dateUtils';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export const useDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState([]);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newDocumentLabel, setNewDocumentLabel] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Add this debug log

  // Fetch all documents
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

  // Helper function to get most recent document with a specific label
  const getMostRecentDocumentWithLabel = (labelId) => {
    const documentsWithLabel = documents.filter(doc => doc.label === labelId);
    if (documentsWithLabel.length === 0) return null;
    
    // Sort by updated_at and return the most recent
    return documentsWithLabel.sort((a, b) => 
      new Date(b.updated_at) - new Date(a.updated_at)
    )[0];
  };

  // Create new document
  const createDocument = async () => {
    if (!newDocumentTitle.trim()) return;
    
    console.log("requesting to create document")
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
      console.log("requesting to create document")
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
      return 'editor'; // Return view to switch to
    } catch (error) {
      console.error('Error creating document:', error);
    } finally {
      setLoading(false);
    }
  };

  // Open a specific document
  const openDocument = async (documentId) => {
    console.log('🔍 [OPEN DEBUG] openDocument called with ID:', documentId);
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/documents/${documentId}`);
      console.log('🔍 [OPEN DEBUG] API response:', response.data);
      setCurrentDocument(response.data);
      console.log('🔍 [OPEN DEBUG] currentDocument set to:', response.data);
      return 'editor';
    } catch (error) {
      console.error('❌ [OPEN DEBUG] Error opening document:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save current document
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

  // Delete a document
  const deleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/api/documents/${documentId}`);
      setDocuments(documents.filter(doc => doc.id !== documentId));
      if (currentDocument && currentDocument.id === documentId) {
        setCurrentDocument(null);
        return 'home'; // Return view to switch to
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  // Fetch document versions
  const fetchVersions = async (documentId) => {
    console.log('🔍 [FETCH VERSIONS DEBUG] fetchVersions called with documentId:', documentId);
    
    try {
      setLoading(true);
      console.log('🔍 [FETCH VERSIONS DEBUG] Making API call to:', `${API_BASE_URL}/api/documents/${documentId}/versions`);
      
      const response = await axios.get(`${API_BASE_URL}/api/documents/${documentId}/versions`);
      console.log('🔍 [FETCH VERSIONS DEBUG] API response status:', response.status);
      console.log('🔍 [FETCH VERSIONS DEBUG] API response data:', response.data);
      
      setVersions(response.data);
      return 'versions'; // Return view to switch to
    } catch (error) {
      console.error('🔍 [FETCH VERSIONS DEBUG] Error fetching versions:', error);
      console.error('🔍 [FETCH VERSIONS DEBUG] Error response:', error.response?.data);
      console.error('🔍 [FETCH VERSIONS DEBUG] Error status:', error.response?.status);
    } finally {
      setLoading(false);
    }
  };

  // Restore a specific version
  const restoreVersion = async (versionNumber) => {
    console.log('🔍 [RESTORE VERSION DEBUG] restoreVersion called with versionNumber:', versionNumber);
    console.log('🔍 [RESTORE VERSION DEBUG] currentDocument exists:', !!currentDocument);
    console.log('🔍 [RESTORE VERSION DEBUG] currentDocument.id:', currentDocument?.id);
    
    if (!currentDocument) {
      console.log('🔍 [RESTORE VERSION DEBUG] No currentDocument, returning early');
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 [RESTORE VERSION DEBUG] Making API call to:', `${API_BASE_URL}/api/documents/${currentDocument.id}/versions/${versionNumber}/restore`);
      
      const response = await axios.post(`${API_BASE_URL}/api/documents/${currentDocument.id}/versions/${versionNumber}/restore`);
      console.log('🔍 [RESTORE VERSION DEBUG] API response status:', response.status);
      console.log('🔍 [RESTORE VERSION DEBUG] API response data:', response.data);
      
      setCurrentDocument(response.data);
      console.log('🔍 [RESTORE VERSION DEBUG] Current document updated, returning "editor"');
      return 'editor'; // Return view to switch to
    } catch (error) {
      console.error('🔍 [RESTORE VERSION DEBUG] Error restoring version:', error);
      console.error('🔍 [RESTORE VERSION DEBUG] Error response:', error.response?.data);
      console.error('🔍 [RESTORE VERSION DEBUG] Error status:', error.response?.status);
    } finally {
      setLoading(false);
      console.log('🔍 [RESTORE VERSION DEBUG] Loading set to false');
    }
  };

  // Update section content
  const updateSectionContent = (sectionId, newContent) => {
    if (!currentDocument) return;
    
    setCurrentDocument({
      ...currentDocument,
      sections: currentDocument.sections.map(section =>
        section.id === sectionId
          ? { ...section, content: { ...section.content, text: newContent } }
          : section
      )
    });
  };

  // Move section up
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

  // Move section down
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
    console.log('🔍 [ADD NEW ENTRY DEBUG] addNewEntry called with:', { sectionId, newEntry });
    console.log('🔍 [ADD NEW ENTRY DEBUG] currentDocument exists:', !!currentDocument);
    
    if (!currentDocument) {
      console.log('🔍 [ADD NEW ENTRY DEBUG] No currentDocument, returning early');
      return;
    }
    
    console.log('🔍 [ADD NEW ENTRY DEBUG] Current sections:', currentDocument.sections.map(s => ({ id: s.id, title: s.title })));
    
    const updatedSections = currentDocument.sections.map(section => {
      if (section.id === sectionId) {
        const currentContent = section.content?.text || '';
        console.log('🔍 [ADD NEW ENTRY DEBUG] Section found:', section.title);
        console.log('🔍 [ADD NEW ENTRY DEBUG] Current content length:', currentContent.length);
        console.log('🔍 [ADD NEW ENTRY DEBUG] Current content preview:', currentContent.substring(0, 100));
        
        const newContent = currentContent + '\n\n' + newEntry;
        console.log('🔍 [ADD NEW ENTRY DEBUG] New content length:', newContent.length);
        console.log('🔍 [ADD NEW ENTRY DEBUG] New content preview:', newContent.substring(0, 100));
        
        return { ...section, content: { text: newContent } };
      }
      return section;
    });
    
    console.log('🔍 [ADD NEW ENTRY DEBUG] Updating currentDocument with new sections');
    setCurrentDocument({
      ...currentDocument,
      sections: updatedSections
    });
    console.log('🔍 [ADD NEW ENTRY DEBUG] CurrentDocument updated');
  };

  // Get resume context for AI
  const getResumeContext = () => {
    console.log('📄 [CONTEXT DEBUG] getResumeContext called');
    console.log('📄 [CONTEXT DEBUG] currentDocument exists:', !!currentDocument);
    console.log('📄 [CONTEXT DEBUG] currentDocument object:', currentDocument);
    
    if (!currentDocument) {
      console.log('⚠️ [CONTEXT DEBUG] No current document, returning default message');
      return "No resume is currently open.";
    }
    
    console.log('📄 [CONTEXT DEBUG] Document title:', currentDocument.title);
    console.log('📄 [CONTEXT DEBUG] Document sections count:', currentDocument.sections.length);
    
    let context = `RESUME: ${currentDocument.title}\n\n`;
    
    currentDocument.sections.forEach((section, index) => {
      console.log(`📄 [CONTEXT DEBUG] Processing section ${index + 1}:`, section.title);
      console.log(`📄 [CONTEXT DEBUG] Section ${index + 1} raw content:`, section.content);
      
      const content = section.content?.text || getDefaultContent(section.title);
      console.log(`📄 [CONTEXT DEBUG] Section ${index + 1} final content:`, content);
      console.log(`📄 [CONTEXT DEBUG] Section ${index + 1} content length:`, content ? content.length : 0);
      console.log(`📄 [CONTEXT DEBUG] Section ${index + 1} has placeholder text:`, content ? (content.includes('YOUR NAME') || content.includes('Text (Lead with')) : false);
      console.log(`📄 [CONTEXT DEBUG] Section ${index + 1} content.trim():`, content ? content.trim() : '');
      console.log(`📄 [CONTEXT DEBUG] Section ${index + 1} content.trim() length:`, content ? content.trim().length : 0);
      
      if (content && content.trim() && !content.includes('YOUR NAME') && !content.includes('Text (Lead with')) {
        context += `${section.title.toUpperCase()}:\n${content}\n\n`;
        console.log(`📄 [CONTEXT DEBUG] Added section ${index + 1} to context`);
      } else {
        console.log(`📄 [CONTEXT DEBUG] Skipped section ${index + 1} (empty or placeholder)`);
        console.log(`📄 [CONTEXT DEBUG] Skip reason - content exists:`, !!content);
        console.log(`📄 [CONTEXT DEBUG] Skip reason - content.trim():`, !!content?.trim());
        console.log(`📄 [CONTEXT DEBUG] Skip reason - has YOUR NAME:`, content?.includes('YOUR NAME'));
        console.log(`📄 [CONTEXT DEBUG] Skip reason - has Text (Lead with:`, content?.includes('Text (Lead with'));
      }
    });
    
    console.log('📄 [CONTEXT DEBUG] Final context length:', context.length);
    console.log('📄 [CONTEXT DEBUG] Final context preview:', context.substring(0, 200) + '...');
    console.log('📄 [CONTEXT DEBUG] Final context full:', context);
    
    return context;
  };

  // Apply AI edit to document
  const applyEdit = async (edit) => {
    console.log('🔧 [EDIT DEBUG] applyEdit function called with edit:', edit);
    console.log('🔧 [EDIT DEBUG] edit object type:', typeof edit);
    console.log('🔧 [EDIT DEBUG] edit object keys:', edit ? Object.keys(edit) : 'edit is null/undefined');
    console.log('🔧 [EDIT DEBUG] edit.section:', edit?.section);
    console.log('🔧 [EDIT DEBUG] edit.sectionId:', edit?.sectionId);
    console.log('🔧 [EDIT DEBUG] edit.action:', edit?.action);
    console.log('🔧 [EDIT DEBUG] edit.find:', edit?.find);
    console.log('🔧 [EDIT DEBUG] edit.replace:', edit?.replace);
    
    if (!currentDocument) {
      console.error('❌ [EDIT DEBUG] No document loaded');
      return;
    }

    if (!currentDocument._id && !currentDocument.id) {
      console.error('❌ [EDIT DEBUG] Document has no ID:', currentDocument);
      return;
    }

    console.log('🔧 [EDIT DEBUG] Current document sections:', currentDocument.sections?.map(s => s.title));
    console.log('🔧 [EDIT DEBUG] Looking for section:', edit?.section || edit?.sectionId);

    try {
      // Find the section to update - try both section and sectionId
      let sectionToFind = edit?.section || edit?.sectionId;
      console.log('🔧 [EDIT DEBUG] Section to find:', sectionToFind);
      
      if (!sectionToFind) {
        console.error('❌ [EDIT DEBUG] No section specified in edit:', edit);
        return;
      }
      
      // Handle common AI mistakes in section names
      const sectionNameMappings = {
        'skills-section': 'Skills',
        'experience-section': 'Experience', 
        'education-section': 'Education',
        'projects-section': 'Projects',
        'leadership-section': 'Leadership & Community',
        'awards-section': 'Awards & Honors',
        'certifications-section': 'Certifications',
        'personal-section': 'Personal Information'
      };
      
      if (sectionNameMappings[sectionToFind.toLowerCase()]) {
        sectionToFind = sectionNameMappings[sectionToFind.toLowerCase()];
        console.log('🔧 [EDIT DEBUG] Mapped section name to:', sectionToFind);
      }
      
      const sectionIndex = currentDocument.sections.findIndex(s => 
        s.title.toLowerCase() === sectionToFind.toLowerCase()
      );

      if (sectionIndex === -1) {
        console.error('❌ [EDIT DEBUG] Section not found:', edit.section);
        console.log('🔧 [EDIT DEBUG] Available sections:', currentDocument.sections.map(s => s.title));
        return;
      }

      console.log('✅ [EDIT DEBUG] Found section at index:', sectionIndex);
      console.log('🔧 [EDIT DEBUG] Full section object:', currentDocument.sections[sectionIndex]);
      console.log('🔧 [EDIT DEBUG] Section content object:', currentDocument.sections[sectionIndex].content);
      console.log('🔧 [EDIT DEBUG] Original content:', currentDocument.sections[sectionIndex].content?.text);
      console.log('🔧 [EDIT DEBUG] Content type:', typeof currentDocument.sections[sectionIndex].content?.text);
      console.log('🔧 [EDIT DEBUG] Content length:', currentDocument.sections[sectionIndex].content?.text?.length);
      console.log('🔧 [EDIT DEBUG] Edit action:', edit.action);
      console.log('🔧 [EDIT DEBUG] Edit find:', edit.find);
      console.log('🔧 [EDIT DEBUG] Edit replace:', edit.replace);

      // Get the current content
      const currentContent = currentDocument.sections[sectionIndex].content?.text || '';
      let newContent = currentContent;
      
      console.log('🔧 [EDIT DEBUG] Current content length:', currentContent.length);
      console.log('🔧 [EDIT DEBUG] Current content is empty:', currentContent.length === 0);

      // Apply the edit based on action type
      if (edit.action === 'replace' && edit.find && edit.replace) {
        console.log('🔧 [EDIT DEBUG] Performing replace operation');
        console.log('🔧 [EDIT DEBUG] Finding:', edit.find);
        console.log('🔧 [EDIT DEBUG] Replacing with:', edit.replace);
        
        // If content is empty, treat replace as add
        if (currentContent.length === 0) {
          console.log('🔧 [EDIT DEBUG] Content is empty, treating replace as add');
          newContent = edit.replace;
          console.log('🔧 [EDIT DEBUG] Set new content to:', newContent);
        } else if (currentContent.includes(edit.find)) {
          newContent = currentContent.replace(edit.find, edit.replace);
          console.log('🔧 [EDIT DEBUG] Replace successful');
        } else {
          console.error('❌ [EDIT DEBUG] Text to find not found in content:', edit.find);
          console.log('🔧 [EDIT DEBUG] Available content:', currentContent);
          return;
        }
      } else if (edit.action === 'add' && edit.addition) {
        console.log('🔧 [EDIT DEBUG] Performing add operation');
        newContent = currentContent + '\n' + edit.addition;
      } else if (edit.action === 'remove' && edit.find) {
        console.log('🔧 [EDIT DEBUG] Performing remove operation');
        newContent = currentContent.replace(edit.find, '');
      } else {
        console.error('❌ [EDIT DEBUG] Invalid edit action or missing properties:', edit);
        return;
      }

      // Update the section content
      const updatedSections = [...currentDocument.sections];
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        content: {
          ...updatedSections[sectionIndex].content,
          text: newContent
        }
      };

      console.log('🔧 [EDIT DEBUG] Updated content:', updatedSections[sectionIndex].content?.text);

      // Update the document
      setCurrentDocument({
        ...currentDocument,
        sections: updatedSections
      });

      console.log('✅ [EDIT DEBUG] Edit applied successfully');

      // After updating local state, add:
      const documentId = currentDocument._id || currentDocument.id;
      await axios.put(`${API_BASE_URL}/api/documents/${documentId}`, {
        ...currentDocument,
        sections: updatedSections
      });
    } catch (error) {
      console.error('❌ [EDIT DEBUG] Error applying edit:', error);
    }
  };

  // Utility functions - formatDate now imported from dateUtils

  const getAddButtonText = (title) => {
    const buttonTexts = {
      'Experience': 'Add Experience',
      'Education': 'Add Education',
      'Skills': 'Add Skill',
      'Projects': 'Add Project',
      'Certifications': 'Add Certification',
      'Languages': 'Add Language',
      'Volunteer': 'Add Volunteer Work',
      'Awards': 'Add Award',
      'Publications': 'Add Publication',
      'References': 'Add Reference'
    };
    return buttonTexts[title] || 'Add Entry';
  };

  return {
    // State
    documents,
    currentDocument,
    loading,
    saving,
    versions,
    newDocumentTitle,
    newDocumentLabel,
    showCreateForm,
    
    // Setters
    setCurrentDocument,
    setNewDocumentTitle,
    setNewDocumentLabel,
    setShowCreateForm,
    
    // Document operations
    fetchDocuments,
    createDocument,
    openDocument,
    saveDocument,
    deleteDocument,
    fetchVersions,
    restoreVersion,
    
    // Section operations
    updateSectionContent,
    moveSectionUp,
    moveSectionDown,
    addNewEntry,
    
    // Utility functions
    getResumeContext,
    applyEdit,
    formatDate,
    getAddButtonText
  };
};