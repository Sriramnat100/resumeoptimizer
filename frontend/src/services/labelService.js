/**
 * Label Service for Resume Optimizer
 * Centralized service for all label-related API calls and operations
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

class LabelService {
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
   * Fetch all labels for the current user
   * @returns {Promise<Array>} Array of labels
   */
  async fetchLabels() {
    try {
      console.log('🏷️ [LABEL SERVICE] Fetching labels...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ [LABEL SERVICE] No token found, skipping label fetch');
        return [];
      }
      
      const response = await axios.get(`${this.baseUrl}/api/labels`, {
        headers: this.getAuthHeaders()
      });
      
      console.log('✅ [LABEL SERVICE] Labels fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [LABEL SERVICE] Error fetching labels:', error);
      throw error;
    }
  }

  /**
   * Create a new label
   * @param {string} name - Label name
   * @param {string} color - Label color
   * @returns {Promise<Object>} Created label
   */
  async createLabel(name, color) {
    try {
      console.log('🏷️ [LABEL SERVICE] Creating label:', { name, color });
      
      const response = await axios.post(`${this.baseUrl}/api/labels`, {
        name: name,
        color: color
      }, {
        headers: this.getAuthHeaders()
      });

      console.log('✅ [LABEL SERVICE] Label created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [LABEL SERVICE] Error creating label:', error);
      throw error;
    }
  }

  /**
   * Update a label
   * @param {string} labelId - Label ID
   * @param {string} name - New label name
   * @param {string} color - New label color
   * @returns {Promise<Object>} Updated label
   */
  async updateLabel(labelId, name, color) {
    try {
      console.log('🏷️ [LABEL SERVICE] Updating label:', { labelId, name, color });
      
      const response = await axios.put(`${this.baseUrl}/api/labels/${labelId}`, {
        name: name,
        color: color
      }, {
        headers: this.getAuthHeaders()
      });

      console.log('✅ [LABEL SERVICE] Label updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [LABEL SERVICE] Error updating label:', error);
      throw error;
    }
  }

  /**
   * Delete a label
   * @param {string} labelId - Label ID
   * @returns {Promise<void>}
   */
  async deleteLabel(labelId) {
    try {
      console.log('🏷️ [LABEL SERVICE] Deleting label:', labelId);
      
      const response = await axios.delete(`${this.baseUrl}/api/labels/${labelId}`, {
        headers: this.getAuthHeaders()
      });

      console.log('✅ [LABEL SERVICE] Label deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ [LABEL SERVICE] Error deleting label:', error);
      throw error;
    }
  }

  /**
   * Get label color CSS class
   * @param {string} color - Color name
   * @returns {string} CSS class for the color
   */
  getLabelColor(color) {
    const colorMap = {
      'red': 'bg-red-100 text-red-800 border-red-200',
      'orange': 'bg-orange-100 text-orange-800 border-orange-200',
      'yellow': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'green': 'bg-green-100 text-green-800 border-green-200',
      'blue': 'bg-blue-100 text-blue-800 border-blue-200',
      'purple': 'bg-purple-100 text-purple-800 border-purple-200',
      'pink': 'bg-pink-100 text-pink-800 border-pink-200',
      'gray': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  /**
   * Get document count for a label
   * @param {string} labelId - Label ID
   * @param {Array} documents - Array of documents
   * @returns {number} Number of documents with this label
   */
  getDocumentCount(labelId, documents = []) {
    return documents.filter(doc => doc.label === labelId).length;
  }

  /**
   * Get filtered documents based on selected label
   * @param {Array} documents - Array of documents
   * @param {string} selectedLabel - Selected label ID or 'all'
   * @returns {Array} Filtered documents
   */
  getFilteredDocuments(documents = [], selectedLabel = 'all') {
    if (selectedLabel === 'all') {
      return documents;
    }
    return documents.filter(doc => doc.label === selectedLabel);
  }

  /**
   * Add label to document
   * @param {string} documentId - Document ID
   * @param {string} labelId - Label ID
   * @param {Function} setDocuments - Function to update documents state
   */
  addLabelToDocument(documentId, labelId, setDocuments) {
    setDocuments(prev => prev.map(doc => 
      doc.id === documentId ? { ...doc, label: labelId } : doc
    ));
  }

  /**
   * Remove label from all documents
   * @param {string} labelId - Label ID to remove
   * @param {Function} setDocuments - Function to update documents state
   */
  removeLabelFromDocuments(labelId, setDocuments) {
    setDocuments(prev => prev.map(doc => 
      doc.label === labelId ? { ...doc, label: null } : doc
    ));
  }
}

// Create singleton instance
const labelService = new LabelService();

export default labelService;
