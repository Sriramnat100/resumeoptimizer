/**
 * Document Service for Resume Optimizer
 * Centralized service for all document-related API calls and operations
 */

import axios from 'axios';
import { getDefaultContent } from '../utils/resumeUtils';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

class DocumentService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Get authentication headers
   * @returns {Object} Headers with authorization token
   */
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Fetch all documents for the current user
   * @returns {Promise<Array>} Array of documents
   */
  async fetchDocuments() {
    try {
      console.log('📄 [DOC SERVICE] Fetching documents...');
      const response = await axios.get(`${this.baseUrl}/api/documents`, {
        headers: this.getAuthHeaders()
      });
      
      console.log('✅ [DOC SERVICE] Documents fetched successfully:', response.data.length);
      return response.data;
    } catch (error) {
      console.error('❌ [DOC SERVICE] Error fetching documents:', error);
      console.error('❌ [DOC SERVICE] Error details:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a new document
   * @param {string} title - Document title
   * @param {string} label - Optional label ID
   * @returns {Promise<Object>} Created document
   */
  async createDocument(title, label = null) {
    if (!title.trim()) {
      throw new Error('Document title cannot be empty');
    }

    try {
      console.log('📄 [DOC SERVICE] Creating document:', { title, label });
      
      const payload = { title };
      if (label) {
        payload.label = label;
      }

      const response = await axios.post(`${this.baseUrl}/api/documents`, payload, {
        headers: this.getAuthHeaders()
      });

      console.log('✅ [DOC SERVICE] Document created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [DOC SERVICE] Error creating document:', error);
      throw error;
    }
  }

  /**
   * Get a specific document by ID
   * @param {string} documentId - Document ID
   * @returns {Promise<Object>} Document data
   */
  async getDocument(documentId) {
    try {
      console.log('📄 [DOC SERVICE] Fetching document:', documentId);
      
      const response = await axios.get(`${this.baseUrl}/api/documents/${documentId}`, {
        headers: this.getAuthHeaders()
      });

      console.log('✅ [DOC SERVICE] Document fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [DOC SERVICE] Error fetching document:', error);
      throw error;
    }
  }

  /**
   * Update a document
   * @param {string} documentId - Document ID
   * @param {Object} updates - Document updates
   * @returns {Promise<Object>} Updated document
   */
  async updateDocument(documentId, updates) {
    try {
      console.log('📄 [DOC SERVICE] Updating document:', documentId, updates);
      
      const response = await axios.put(`${this.baseUrl}/api/documents/${documentId}`, updates, {
        headers: this.getAuthHeaders()
      });

      console.log('✅ [DOC SERVICE] Document updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [DOC SERVICE] Error updating document:', error);
      throw error;
    }
  }

  /**
   * Delete a document
   * @param {string} documentId - Document ID
   * @returns {Promise<void>}
   */
  async deleteDocument(documentId) {
    try {
      console.log('�� [DOC SERVICE] Deleting document:', documentId);
      
      await axios.delete(`${this.baseUrl}/api/documents/${documentId}`, {
        headers: this.getAuthHeaders()
      });

      console.log('✅ [DOC SERVICE] Document deleted successfully');
    } catch (error) {
      console.error('❌ [DOC SERVICE] Error deleting document:', error);
      throw error;
    }
  }

  /**
   * Fetch document versions
   * @param {string} documentId - Document ID
   * @returns {Promise<Array>} Array of versions
   */
  async fetchVersions(documentId) {
    try {
      console.log('📄 [DOC SERVICE] Fetching versions for document:', documentId);
      
      const response = await axios.get(`${this.baseUrl}/api/documents/${documentId}/versions`, {
        headers: this.getAuthHeaders()
      });

      console.log('✅ [DOC SERVICE] Versions fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [DOC SERVICE] Error fetching versions:', error);
      throw error;
    }
  }

  /**
   * Restore a specific version
   * @param {string} documentId - Document ID
   * @param {number} versionNumber - Version number to restore
   * @returns {Promise<Object>} Restored document
   */
  async restoreVersion(documentId, versionNumber) {
    try {
      console.log('�� [DOC SERVICE] Restoring version:', { documentId, versionNumber });
      
      const response = await axios.post(
        `${this.baseUrl}/api/documents/${documentId}/versions/${versionNumber}/restore`,
        {},
        { headers: this.getAuthHeaders() }
      );

      console.log('✅ [DOC SERVICE] Version restored successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [DOC SERVICE] Error restoring version:', error);
      throw error;
    }
  }

  /**
   * Update document label
   * @param {string} documentId - Document ID
   * @param {string|null} labelId - Label ID or null to remove label
   * @returns {Promise<Object>} Updated document
   */
  async updateDocumentLabel(documentId, labelId) {
    try {
      console.log('📄 [DOC SERVICE] Updating document label:', { documentId, labelId });
      
      // First get the current document to preserve other fields
      const currentDoc = await this.getDocument(documentId);
      
      const updates = {
        title: currentDoc.title,
        sections: currentDoc.sections,
        label: labelId
      };

      const updatedDocument = await this.updateDocument(documentId, updates);
      console.log('✅ [DOC SERVICE] Document label updated successfully:', updatedDocument);
      return updatedDocument;
    } catch (error) {
      console.error('❌ [DOC SERVICE] Error updating document label:', error);
      throw error;
    }
  }

  /**
   * Get most recent document with a specific label
   * @param {Array} documents - Array of documents
   * @param {string} labelId - Label ID to search for
   * @returns {Object|null} Most recent document with label or null
   */
  getMostRecentDocumentWithLabel(documents, labelId) {
    const documentsWithLabel = documents.filter(doc => doc.label === labelId);
    if (documentsWithLabel.length === 0) return null;
    
    // Sort by updated_at and return the most recent
    return documentsWithLabel.sort((a, b) => 
      new Date(b.updated_at) - new Date(a.updated_at)
    )[0];
  }

  /**
   * Get resume context for AI analysis
   * @param {Object} currentDocument - Current resume document
   * @returns {string} Formatted resume context
   */
  getResumeContext(currentDocument) {
    console.log('📄 [DOC SERVICE] Getting resume context for document:', currentDocument?.title);
    
    if (!currentDocument) {
      console.log('⚠️ [DOC SERVICE] No current document available');
      return "No resume is currently open.";
    }
    
    let context = `RESUME: ${currentDocument.title}\n\n`;
    
    if (currentDocument.sections) {
      currentDocument.sections.forEach(section => {
        const content = section.content?.text || getDefaultContent(section.title);
        
        if (content && content.trim() && !content.includes('YOUR NAME') && !content.includes('Text (Lead with')) {
          context += `${section.title.toUpperCase()}:\n${content}\n\n`;
        }
      });
    }
    
    console.log('📄 [DOC SERVICE] Context length:', context.length);
    return context;
  }

  /**
   * Apply AI edit to document
   * @param {Object} edit - Edit object from AI
   * @param {Object} currentDocument - Current document
   * @returns {Promise<Object>} Updated document
   */
  async applyEdit(edit, currentDocument) {
    console.log('🔧 [DOC SERVICE] Applying edit:', edit);
    
    if (!currentDocument) {
      throw new Error('No document loaded');
    }

    if (!currentDocument._id && !currentDocument.id) {
      throw new Error('Document has no ID');
    }

    // Find the section to update
    let sectionToFind = edit?.section || edit?.sectionId;
    
    if (!sectionToFind) {
      throw new Error('No section specified in edit');
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
    }
    
    const sectionIndex = currentDocument.sections.findIndex(s => 
      s.title.toLowerCase() === sectionToFind.toLowerCase()
    );

    if (sectionIndex === -1) {
      throw new Error(`Section "${edit.section}" not found`);
    }

    // Get the current content
    const currentContent = currentDocument.sections[sectionIndex].content?.text || '';
    let newContent = currentContent;

    // Apply the edit based on action type
    if (edit.action === 'replace' && edit.find && edit.replace) {
      if (currentContent.length === 0) {
        newContent = edit.replace;
      } else if (currentContent.includes(edit.find)) {
        newContent = currentContent.replace(edit.find, edit.replace);
      } else {
        throw new Error(`Text "${edit.find}" not found in section "${edit.section}"`);
      }
    } else if (edit.action === 'add' && edit.addition) {
      newContent = currentContent + '\n' + edit.addition;
    } else if (edit.action === 'remove' && edit.find) {
      newContent = currentContent.replace(edit.find, '');
    } else {
      throw new Error('Invalid edit action or missing properties');
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

    // Update the document
    const updatedDocument = {
      ...currentDocument,
      sections: updatedSections
    };

    // Save to backend
    const documentId = currentDocument._id || currentDocument.id;
    const savedDocument = await this.updateDocument(documentId, updatedDocument);

    console.log('✅ [DOC SERVICE] Edit applied successfully');
    return savedDocument;
  }

  /**
   * Get add button text for a section
   * @param {string} title - Section title
   * @returns {string} Button text
   */
  getAddButtonText(title) {
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
  }
}

// Create singleton instance
const documentService = new DocumentService();

export default documentService;
