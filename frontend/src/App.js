import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './App.css';
import { FileText, Plus, Save, History, Download, Trash2, Edit3, Clock, ArrowLeft } from 'lucide-react';

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

  // Rich text editor modules
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'align', 'link'
  ];

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

  const updateSection = async (sectionId, content) => {
    if (!currentDocument) return;
    
    try {
      // Update local state immediately for responsiveness
      const updatedSections = currentDocument.sections.map(section =>
        section.id === sectionId ? { ...section, content } : section
      );
      
      setCurrentDocument({
        ...currentDocument,
        sections: updatedSections
      });

      // Save to backend
      await axios.put(`${API_BASE_URL}/api/documents/${currentDocument.id}/sections/${sectionId}`, {
        content
      });
    } catch (error) {
      console.error('Error updating section:', error);
    }
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

  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Google Docs 2.0</h1>
            <p className="text-gray-600">Create and edit your resume with powerful rich text editing</p>
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
          <div className="max-w-4xl mx-auto px-6 py-4">
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

        <div className="max-w-4xl mx-auto p-6">
          <div className="space-y-8">
            {currentDocument.sections.map((section) => (
              <div key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200 px-6 py-4">
                  <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                </div>
                
                <div className="p-6">
                  <ReactQuill
                    value={section.content}
                    onChange={(content) => updateSection(section.id, { ops: content })}
                    modules={modules}
                    formats={formats}
                    className="min-h-32"
                    placeholder={`Enter your ${section.title.toLowerCase()}...`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;