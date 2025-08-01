import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

export const useLabels = () => {
  const [labels, setLabels] = useState([]);
  const [selectedLabel, setSelectedLabel] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  console.log('🏷️ [HOOK] useLabels hook initialized');

  // Create default "Master Resume" label if no labels exist
  const createDefaultLabel = async () => {
    console.log('🏷️ [DEFAULT] Checking if default label needs to be created...');
    
    if (labels.length === 0) {
      console.log('🏷️ [DEFAULT] No labels found, creating default "Master Resume" label');
      
      try {
        const defaultLabel = await createLabelInBackend('Master Resume', 'blue');
        console.log('✅ [DEFAULT] Default label created:', defaultLabel);
        setLabels([defaultLabel]);
        setSelectedLabel(defaultLabel.id);
        console.log('✅ [DEFAULT] Default label set as selected');
        return defaultLabel;
      } catch (error) {
        console.error('❌ [DEFAULT] Failed to create default label:', error);
        // Don't throw error here, just log it
      }
    } else {
      console.log('🏷️ [DEFAULT] Labels already exist, no default needed');
    }
  };


  // Fetch labels from backend
  const fetchLabels = async () => {
    console.log('🔄 [FETCH] fetchLabels called!');

    
    // If we already have labels, don't fetch again
    if (labels.length > 0) {
      console.log('🏷️ [FETCH] Labels already loaded, skipping fetch');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 [FETCH] Set loading to true');
      
      const token = localStorage.getItem('token');
      console.log(' [FETCH] Token from localStorage:', token ? 'Token exists' : 'No token');
      console.log('🔑 [FETCH] Token length:', token ? token.length : 0);
      
      if (!token) {
        console.log('⚠️ [FETCH] No token found, skipping label fetch');
        setLoading(false);
        return;
      }
      
      console.log(' [FETCH] Making GET request to fetch labels...');
      console.log(' [FETCH] URL:', `${API_BASE_URL}/api/labels`);
      console.log(' [FETCH] Headers:', { 'Authorization': `Bearer ${token}` });
      
      const response = await axios.get(`${API_BASE_URL}/api/labels`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ [FETCH] Labels fetched from backend successfully');
      console.log('✅ [FETCH] Response status:', response.status);
      console.log('✅ [FETCH] Response data:', response.data);
      console.log('✅ [FETCH] Response data type:', typeof response.data);
      console.log('✅ [FETCH] Response data length:', Array.isArray(response.data) ? response.data.length : 'Not an array');
      
      if (Array.isArray(response.data)) {
        console.log('✅ [FETCH] About to call setLabels with array:', response.data);
        setLabels(response.data);
        console.log('✅ [FETCH] setLabels called successfully');
        
        // If no labels exist, create the default "Master Resume" label
        if (response.data.length === 0) {
          console.log('🏷️ [FETCH] No labels found, creating default label');
          await createDefaultLabel();
        }
      } else {
        console.error('❌ [FETCH] Response data is not an array:', response.data);
        setError('Invalid response format from server');
      }
      
    } catch (error) {
      console.error('❌ [FETCH] Error fetching labels:', error);
      console.error('❌ [FETCH] Error name:', error.name);
      console.error('❌ [FETCH] Error message:', error.message);
      console.error('❌ [FETCH] Error response:', error.response);
      console.error('❌ [FETCH] Error response data:', error.response?.data);
      console.error('❌ [FETCH] Error response status:', error.response?.status);
      setError('Failed to fetch labels');
    } finally {
      setLoading(false);
      console.log('🔄 [FETCH] Set loading to false');
    }
  };

  // Create label in backend
  const createLabelInBackend = async (name, color) => {
    console.log('🚀 [CREATE] createLabelInBackend called with:', { name, color });
    
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 [CREATE] Token check:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        throw new Error('No authentication token');
      }
      
      console.log('📡 [CREATE] Making API call to:', `${API_BASE_URL}/api/labels`);
      console.log('📡 [CREATE] Request payload:', { name, color });
      
      const response = await axios.post(`${API_BASE_URL}/api/labels`, {
        name: name,
        color: color
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ [CREATE] API response received');
      console.log('✅ [CREATE] Response status:', response.status);
      console.log('✅ [CREATE] Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [CREATE] API Error:', error);
      console.error('❌ [CREATE] Error response:', error.response);
      console.error('❌ [CREATE] Error response data:', error.response?.data);
      throw error;
    }
  };

  // Create custom label
  const createCustomLabel = async (name, color) => {
    console.log('🔥 [CUSTOM] createCustomLabel function called with:', { name, color });
    
    if (!name.trim()) {
      console.log('⚠️ [CUSTOM] Label name is empty');
      throw new Error('Label name cannot be empty');
    }
    
    console.log('🚀 [CUSTOM] About to call backend...');
    
    try {
      setLoading(true);
      setError(null);
      console.log('🔥 [CUSTOM] Set loading to true');
      
      // Call the backend to create the label
      const createdLabel = await createLabelInBackend(name.trim(), color);
      console.log('✅ [CUSTOM] Label created in backend:', createdLabel);
      
      // Update local state with the backend response
      console.log('🔥 [CUSTOM] Current labels before update:', labels);
      console.log('🔥 [CUSTOM] About to add new label to state');
      setLabels([...labels, createdLabel]);
      console.log('✅ [CUSTOM] Label added to frontend state');
      console.log('🔥 [CUSTOM] New labels state should be:', [...labels, createdLabel]);
      
      return createdLabel;
    } catch (error) {
      console.error('❌ [CUSTOM] Failed to create label:', error);
      setError('Failed to create label');
      throw error;
    } finally {
      setLoading(false);
      console.log('🔥 [CUSTOM] Set loading to false');
    }
  };

  // Delete label
  const deleteLabel = async (labelId) => {
    console.log('🗑️ [DELETE] deleteLabel called with labelId:', labelId);
    console.log('🗑️ [DELETE] Current labels before delete:', labels);
    
    try {
      setLoading(true);
      setError(null);
      console.log('🗑️ [DELETE] Set loading to true');
      
      const token = localStorage.getItem('token');
      console.log('🔑 [DELETE] Token check:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('📡 [DELETE] Making DELETE request to:', `${API_BASE_URL}/api/labels/${labelId}`);
      
      const response = await axios.delete(`${API_BASE_URL}/api/labels/${labelId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ [DELETE] Delete request successful');
      console.log('✅ [DELETE] Response status:', response.status);
      console.log('✅ [DELETE] Response data:', response.data);

      // Remove label from local state
      console.log('️ [DELETE] Removing label from local state');
      console.log('🗑️ [DELETE] Labels before filter:', labels);
      const filteredLabels = labels.filter(label => label.id !== labelId);
      console.log('🗑️ [DELETE] Labels after filter:', filteredLabels);
      setLabels(filteredLabels);
      console.log('✅ [DELETE] Label removed from local state');
      
      // Reset selected label if it was the deleted one
      if (selectedLabel === labelId) {
        console.log('🗑️ [DELETE] Resetting selectedLabel from', selectedLabel, 'to "all"');
        setSelectedLabel('all');
      }
      
      console.log('✅ [DELETE] Label deleted successfully');
    } catch (error) {
      console.error('❌ [DELETE] Failed to delete label:', error);
      console.error('❌ [DELETE] Error response:', error.response);
      console.error('❌ [DELETE] Error response data:', error.response?.data);
      setError('Failed to delete label');
      throw error;
    } finally {
      setLoading(false);
      console.log('🗑️ [DELETE] Set loading to false');
    }
  };

  // Edit label
  const editLabel = async (labelId, name, color) => {
    console.log('✏️ [EDIT] editLabel called with:', { labelId, name, color });
    console.log('✏️ [EDIT] Current labels before edit:', labels);
    
    try {
      setLoading(true);
      setError(null);
      console.log('✏️ [EDIT] Set loading to true');
      
      const token = localStorage.getItem('token');
      console.log(' [EDIT] Token check:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('📡 [EDIT] Making PUT request to:', `${API_BASE_URL}/api/labels/${labelId}`);
      console.log('📡 [EDIT] Request payload:', { name, color });

      const response = await axios.put(`${API_BASE_URL}/api/labels/${labelId}`, {
        name: name,
        color: color
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ [EDIT] Label updated in backend');
      console.log('✅ [EDIT] Response status:', response.status);
      console.log('✅ [EDIT] Response data:', response.data);
      
      // Update the label in the frontend state
      console.log('✏️ [EDIT] Updating label in frontend state');
      const updatedLabels = labels.map(label => 
        label.id === labelId 
          ? { ...label, name: name, color: color }
          : label
      );
      console.log('✏️ [EDIT] Updated labels:', updatedLabels);
      setLabels(updatedLabels);
      console.log('✅ [EDIT] Label updated in frontend state');

      return response.data;
    } catch (error) {
      console.error('❌ [EDIT] Failed to update label:', error);
      console.error('❌ [EDIT] Error response:', error.response);
      console.error('❌ [EDIT] Error response data:', error.response?.data);
      setError('Failed to update label');
      throw error;
    } finally {
      setLoading(false);
      console.log('✏️ [EDIT] Set loading to false');
    }
  };

  // Get label color classes for styling
  const getLabelColor = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      red: 'bg-red-100 text-red-700 border-red-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      pink: 'bg-pink-100 text-pink-700 border-pink-200',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      teal: 'bg-teal-100 text-teal-700 border-teal-200',
      cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200'
    };
    return colors[color] || colors.blue;
  };

  // Get document count for a specific label
  const getDocumentCount = (labelId, documents = []) => {
    if (labelId === 'all') return documents.length;
    return documents.filter(doc => doc.label === labelId).length;
  };

  // Filter documents by selected label
  const getFilteredDocuments = (documents = []) => {
    // First filter out any undefined or null documents
    const validDocuments = documents.filter(doc => doc && doc.id);
    
    if (selectedLabel === 'all') {
      return validDocuments;
    }
    return validDocuments.filter(doc => doc.label === selectedLabel);
  };

  // Add label to document
  const addLabelToDocument = (documentId, labelId, setDocuments) => {
    console.log('📄 [DOC] addLabelToDocument called with:', { documentId, labelId });
    setDocuments(docs => 
      docs.map(doc => 
        doc.id === documentId 
          ? { ...doc, label: labelId }
          : doc
      )
    );
  };

  // Remove label from documents when label is deleted
  const removeLabelFromDocuments = (labelId, setDocuments) => {
    console.log('📄 [DOC] removeLabelFromDocuments called with labelId:', labelId);
    setDocuments(docs => 
      docs.map(doc => 
        doc.label === labelId ? { ...doc, label: '' } : doc
      )
    );
  };

  // Handler functions for UI interactions
  const handleDeleteLabel = async (labelId, setDocuments) => {
    console.log('🗑️ [HANDLER] handleDeleteLabel called with labelId:', labelId);
    try {
      await deleteLabel(labelId);
      // Remove label from documents that use it
      removeLabelFromDocuments(labelId, setDocuments);
      console.log('✅ [HANDLER] Label deleted and removed from documents');
    } catch (error) {
      console.error('❌ [HANDLER] Failed to delete label:', error);
      throw error;
    }
  };

  const handleCreateLabel = async (name, color) => {
    console.log('🔥 [HANDLER] handleCreateLabel called with:', { name, color });
    try {
      const result = await createCustomLabel(name, color);
      console.log('✅ [HANDLER] Label created successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ [HANDLER] Failed to create label:', error);
      throw error;
    }
  };

  const handleEditLabel = async (labelId, name, color) => {
    console.log('✏️ [HANDLER] handleEditLabel called with:', { labelId, name, color });
    try {
      const result = await editLabel(labelId, name, color);
      console.log('✅ [HANDLER] Label edited successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ [HANDLER] Failed to edit label:', error);
      throw error;
    }
  };

  const handleAddLabelToDocument = (documentId, labelId, setDocuments) => {
    console.log('📄 [HANDLER] handleAddLabelToDocument called with:', { documentId, labelId });
    addLabelToDocument(documentId, labelId, setDocuments);
    console.log('✅ [HANDLER] Label added to document');
  };

  const handleUpdateDocumentLabel = async (documentId, labelId, updateDocumentLabel) => {
    console.log('🎯 [HANDLER] handleUpdateDocumentLabel called');
    console.log('🎯 [HANDLER] Document ID:', documentId);
    console.log('🎯 [HANDLER] Label ID:', labelId);
    console.log('🎯 [HANDLER] Label ID is null:', labelId === null);
    console.log('🎯 [HANDLER] updateDocumentLabel function exists:', typeof updateDocumentLabel);
    
    try {
      console.log('🎯 [HANDLER] Calling updateDocumentLabel...');
      const updated = await updateDocumentLabel(documentId, labelId);
      console.log('✅ [HANDLER] updateDocumentLabel completed successfully');
      console.log('✅ [HANDLER] Updated document:', updated);

      return updated;
    } catch (error) {
      console.error("❌ [HANDLER] Failed to update document label:", error);
      console.error("❌ [HANDLER] Error details:", error.response?.data || error.message);
      throw error;
    }
  };

  // Log state changes
  useEffect(() => {
    console.log('🏷️ [STATE] Labels state changed:', labels);
  }, [labels]);

  useEffect(() => {
    console.log('🏷️ [STATE] SelectedLabel state changed:', selectedLabel);
  }, [selectedLabel]);

  useEffect(() => {
    console.log('🏷️ [STATE] Loading state changed:', loading);
  }, [loading]);

  useEffect(() => {
    console.log('🏷️ [STATE] Error state changed:', error);
  }, [error]);

  return {
    // State
    labels,
    selectedLabel,
    loading,
    error,
    
    // Actions
    fetchLabels,
    createCustomLabel,
    deleteLabel,
    editLabel,
    setSelectedLabel,
    createDefaultLabel,
    
    // Utilities
    getLabelColor,
    getDocumentCount,
    getFilteredDocuments,
    addLabelToDocument,
    removeLabelFromDocuments,
    
    // UI Handlers
    handleDeleteLabel,
    handleCreateLabel,
    handleEditLabel,
    handleAddLabelToDocument,
    handleUpdateDocumentLabel,
    
    // State setters (for external use)
    setLabels
  };
};
