import { useState, useEffect } from 'react';
import documentService from '../services/documentService';
import { formatDate } from '../utils/dateUtils';
import { getDefaultContent } from '../utils/resumeUtils';

export const useDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [versions, setVersions] = useState([]);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newDocumentLabel, setNewDocumentLabel] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch all documents
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const documents = await documentService.fetchDocuments();
      setDocuments(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new document
  // Create new document from template
  const createDocumentFromTemplate = async (labelId) => {
    if (!newDocumentTitle.trim()) return;
    
    console.log("requesting to create document from template", { labelId });
    
    try {
      setLoading(true);
      
      // Find the most recent document with this label
      const templateDocument = documentService.getMostRecentDocumentWithLabel(documents, labelId);
      
      if (templateDocument) {
        console.log("Found template document:", templateDocument.title);
        
        const newDocument = await documentService.createDocument(newDocumentTitle, labelId, templateDocument);
        
        // Add the new document to the list
        const documentWithLabel = { ...newDocument, label: labelId };
        setDocuments([documentWithLabel, ...documents]);
        setNewDocumentTitle('');
        setNewDocumentLabel('');
        setShowCreateForm(false);
        setCurrentDocument(documentWithLabel);
        return 'editor';
      } else {
        console.log("No template found for label:", labelId);
        // Create a regular document if no template exists
        return await createDocument();
      }
    } catch (error) {
      console.error('Error creating document from template:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new document
  const createDocument = async (templateDocument = null) => {
    if (!newDocumentTitle.trim()) return;
    
    console.log("requesting to create document", { hasTemplate: !!templateDocument });
    
    try {
      setLoading(true);
      console.log("requesting to create document");
      
      // Use the newDocumentLabel if provided, otherwise it will be handled by the backend
      const labelToUse = newDocumentLabel || null; // Let backend handle default
      
      const newDocument = await documentService.createDocument(newDocumentTitle, labelToUse, templateDocument);
      
      // Add label to the document locally
      const documentWithLabel = { ...newDocument, label: labelToUse };
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
      const document = await documentService.getDocument(documentId);
      console.log('🔍 [OPEN DEBUG] API response:', document);
      setCurrentDocument(document);
      console.log('🔍 [OPEN DEBUG] currentDocument set to:', document);
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
      const updatedDocument = await documentService.updateDocument(currentDocument.id, {
        title: currentDocument.title,
        sections: currentDocument.sections
      });
      
      // Update the document in the list
      setDocuments(documents.map(doc => 
        doc.id === currentDocument.id ? updatedDocument : doc
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
      await documentService.deleteDocument(documentId);
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
      console.log('🔍 [FETCH VERSIONS DEBUG] Making API call to fetch versions');
      
      const versions = await documentService.fetchVersions(documentId);
      console.log('🔍 [FETCH VERSIONS DEBUG] Versions fetched:', versions);
      
      setVersions(versions);
      return 'versions'; // Return view to switch to
    } catch (error) {
      console.error('🔍 [FETCH VERSIONS DEBUG] Error fetching versions:', error);
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
      console.log('🔍 [RESTORE VERSION DEBUG] Making API call to restore version');
      
      const restoredDocument = await documentService.restoreVersion(currentDocument.id, versionNumber);
      console.log('🔍 [RESTORE VERSION DEBUG] Version restored:', restoredDocument);
      
      setCurrentDocument(restoredDocument);
      console.log('🔍 [RESTORE VERSION DEBUG] Current document updated, returning "editor"');
      return 'editor'; // Return view to switch to
    } catch (error) {
      console.error('🔍 [RESTORE VERSION DEBUG] Error restoring version:', error);
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

  // Helper function to check if content is just placeholder text
  const isPlaceholderContent = (content, sectionTitle) => {
    if (!content || content.trim() === '') return true;
    
    // Get the exact default content for this section
    const defaultContent = getDefaultContent(sectionTitle);
    
    // Check if the content matches the default content exactly (allowing for minor whitespace differences)
    const normalizedContent = content.trim().replace(/\s+/g, ' ');
    const normalizedDefault = defaultContent.trim().replace(/\s+/g, ' ');
    
    console.log('🔍 [PLACEHOLDER DEBUG] Section:', sectionTitle);
    console.log('🔍 [PLACEHOLDER DEBUG] Current content:', normalizedContent);
    console.log('🔍 [PLACEHOLDER DEBUG] Default content:', normalizedDefault);
    console.log('🔍 [PLACEHOLDER DEBUG] Content matches default:', normalizedContent === normalizedDefault);
    
    return normalizedContent === normalizedDefault;
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
        
        // Check if current content is just placeholder text
        const isPlaceholder = isPlaceholderContent(currentContent, section.title);
        console.log('🔍 [ADD NEW ENTRY DEBUG] Is placeholder content:', isPlaceholder);
        
        // If it's placeholder content, replace it entirely; otherwise append
        const newContent = isPlaceholder ? newEntry : currentContent + '\n\n' + newEntry;
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
    return documentService.getResumeContext(currentDocument);
  };

  // Apply AI edit to document
  const applyEdit = async (edit) => {
    console.log('🔧 [EDIT DEBUG] applyEdit function called with edit:', edit);
    
    if (!currentDocument) {
      console.error('❌ [EDIT DEBUG] No document loaded');
      return;
    }

    try {
      const updatedDocument = await documentService.applyEdit(edit, currentDocument);
      setCurrentDocument(updatedDocument);
      console.log('✅ [EDIT DEBUG] Edit applied successfully');
    } catch (error) {
      console.error('❌ [EDIT DEBUG] Error applying edit:', error);
    }
  };

  // Update document label
  const updateDocumentLabel = async (documentId, labelId) => {
    console.log('🔄 [LABEL UPDATE] updateDocumentLabel called');
    console.log('🔄 [LABEL UPDATE] Document ID:', documentId);
    console.log('🔄 [LABEL UPDATE] Label ID:', labelId);
    
    try {
      setLoading(true);
      console.log('🔄 [LABEL UPDATE] Set loading to true');
      
      const updatedDocument = await documentService.updateDocumentLabel(documentId, labelId);
      
      // Update the document in the list
      console.log('🔄 [LABEL UPDATE] Updating documents list...');
      const updatedDocuments = documents.map(doc => 
        doc.id === documentId ? updatedDocument : doc
      );
      setDocuments(updatedDocuments);
      console.log('✅ [LABEL UPDATE] Documents list updated');
      
      // Update current document if it's the one being edited
      if (currentDocument && currentDocument.id === documentId) {
        console.log('🔄 [LABEL UPDATE] Updating current document...');
        setCurrentDocument(updatedDocument);
        console.log('✅ [LABEL UPDATE] Current document updated');
      }
      
      console.log('🎉 [LABEL UPDATE] Label update completed successfully');
      return updatedDocument;
    } catch (error) {
      console.error('❌ [LABEL UPDATE] Error updating document label:', error);
      throw error;
    } finally {
      setLoading(false);
      console.log('🔄 [LABEL UPDATE] Set loading to false');
    }
  };

  // Delete a section from the current document
  const deleteSection = (sectionId) => {
    console.log('🗑️ [DELETE SECTION DEBUG] deleteSection called with sectionId:', sectionId);
    
    if (!currentDocument) {
      console.log('🗑️ [DELETE SECTION DEBUG] No currentDocument, returning early');
      return;
    }
    
    // Don't allow deleting Personal Information section
    const sectionToDelete = currentDocument.sections.find(s => s.id === sectionId);
    if (sectionToDelete && sectionToDelete.title === 'Personal Information') {
      console.log('🗑️ [DELETE SECTION DEBUG] Cannot delete Personal Information section');
      alert('Cannot delete Personal Information section');
      return;
    }
    
    console.log('🗑️ [DELETE SECTION DEBUG] Current sections:', currentDocument.sections.map(s => ({ id: s.id, title: s.title })));
    
    const updatedSections = currentDocument.sections.filter(section => section.id !== sectionId);
    console.log('🗑️ [DELETE SECTION DEBUG] Updated sections:', updatedSections.map(s => ({ id: s.id, title: s.title })));
    
    setCurrentDocument({
      ...currentDocument,
      sections: updatedSections
    });
    console.log('🗑️ [DELETE SECTION DEBUG] CurrentDocument updated');
  };

  // Utility functions
  const getAddButtonText = (title) => {
    return documentService.getAddButtonText(title);
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
    setDocuments,
    
    // Document operations
    fetchDocuments,
    createDocument,
    createDocumentFromTemplate,
    openDocument,
    saveDocument,
    deleteDocument,
    fetchVersions,
    restoreVersion,
    updateDocumentLabel,
    
    // Section operations
    updateSectionContent,
    moveSectionUp,
    moveSectionDown,
    addNewEntry,
    deleteSection,
    
    // Utility functions
    getResumeContext,
    applyEdit,
    formatDate,
    getAddButtonText
  };
};