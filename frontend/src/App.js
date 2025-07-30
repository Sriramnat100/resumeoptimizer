import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { FileText, Plus, Save, History, Trash2, Edit3, Clock, ArrowLeft, ChevronUp, ChevronDown, LogOut, User, Linkedin, Globe, Sparkles, Zap, Award, Users, Bot, Send, Download, Tag, ChevronDown as ChevronDownIcon, Check } from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Register from './Register';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import AddEntryForm from './components/AddEntryForm';
import AIAssistant from './components/AIAssistant';
import EditableSection from './components/EditableSection';
import LabelManager from './components/LabelManager';
import { formatResumeContent, getDefaultContent } from './utils/resumeUtils';
import ResumeSection from './components/ResumeSection';
import { useDocuments } from './hooks/useDocuments';
import { useLabels } from './hooks/useLabels';
import { formatDate } from './utils/dateUtils';
import DocumentLabelSelector from './components/DocumentLabelSelector';

console.log("hello");
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function AppContent() {
  console.log('🏷️ [APP] AppContent component rendering');
  
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
    createDocumentFromTemplate,
    saveDocument,
    deleteDocument,
    setNewDocumentTitle,
    setNewDocumentLabel,
    setDocuments,
    fetchVersions,
    openDocument,
    restoreVersion,
    setCurrentDocument,
    getAddButtonText,
    moveSectionUp,
    moveSectionDown,
    updateSectionContent,
    addNewEntry,
    deleteSection,
    applyEdit,
    updateDocumentLabel
  } = useDocuments();

  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  
  console.log('🏷️ [APP] Authentication state:', { isAuthenticated, authLoading, user: user?.username });
  
  // Use the useLabels hook instead of inline label management
  const {
    labels,
    selectedLabel,
    loading: labelsLoading,
    error: labelsError,
    fetchLabels,
    createCustomLabel,
    deleteLabel,
    editLabel,
    setSelectedLabel,
    getLabelColor,
    getDocumentCount,
    getFilteredDocuments,
    addLabelToDocument,
    removeLabelFromDocuments
  } = useLabels();

  const [currentView, setCurrentView] = useState('home'); // 'home', 'editor', 'versions'
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [showAddForm, setShowAddForm] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [openDropdownDocId, setOpenDropdownDocId] = useState(null);

  // Fixed useEffect - removed circular dependencies
  useEffect(() => {
    console.log('👤 [APP] useEffect triggered:', { isAuthenticated, user, authLoading });
    
    // Only fetch data when user becomes authenticated AND we don't already have data
    if (isAuthenticated && user && !authLoading) {
      console.log('👤 [APP] User is authenticated, fetching data...');
      
      // Fetch documents and labels
      fetchDocuments();
      fetchLabels();
    } else {
      console.log('❌ [APP] User not authenticated or still loading');
    }
  }, [isAuthenticated, user, authLoading]); // Removed fetchDocuments and fetchLabels from dependencies

  // Add this useEffect to track currentView changes
  useEffect(() => {
  }, [currentView]);

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

  const downloadPDF = async () => {
    if (!currentDocument) return;
    
    try {
      // Create a temporary div to render the resume for PDF
      const resumeElement = document.querySelector('.resume-container');
      if (!resumeElement) {
        console.error('Resume container not found');
        return;
      }

      // Temporarily hide the AI Assistant to avoid capturing it
      const aiAssistant = document.querySelector('.w-96.border-l.border-gray-200');
      const originalDisplay = aiAssistant ? aiAssistant.style.display : '';
      if (aiAssistant) {
        aiAssistant.style.display = 'none';
      }

      // Use html2canvas to capture the resume with better settings
      const canvas = await html2canvas(resumeElement, {
        scale: 1.5, // Better quality than 1, but not as heavy as 2
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        removeContainer: true,
        width: resumeElement.offsetWidth,
        height: resumeElement.offsetHeight,
        // Better rendering options
        foreignObjectRendering: false,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          // Ensure proper styling in the cloned document
          const clonedResume = clonedDoc.querySelector('.resume-container');
          if (clonedResume) {
            clonedResume.style.width = '100%';
            clonedResume.style.maxWidth = '800px';
            clonedResume.style.margin = '0 auto';
            clonedResume.style.padding = '20px';
            clonedResume.style.backgroundColor = '#ffffff';
          }
        }
      });

      // Restore AI Assistant visibility
      if (aiAssistant) {
        aiAssistant.style.display = originalDisplay;
      }

      // Convert canvas to PDF with better quality
      const imgData = canvas.toDataURL('image/png'); // Use PNG for better text quality
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

  // Updated helper functions to use the hook
  const handleDeleteLabel = async (labelId) => {
    try {
      await deleteLabel(labelId);
      // Remove label from documents that use it
      removeLabelFromDocuments(labelId, setDocuments);
    } catch (error) {
      console.error('Failed to delete label:', error);
    }
  };

  const handleCreateLabel = async (name, color) => {
    try {
      return await createCustomLabel(name, color);
    } catch (error) {
      console.error('Failed to create label:', error);
      throw error;
    }
  };

  const handleEditLabel = async (labelId, name, color) => {
    try {
      return await editLabel(labelId, name, color);
    } catch (error) {
      console.error('Failed to edit label:', error);
      throw error;
    }
  };

  const handleAddLabelToDocument = (documentId, labelId) => {
    addLabelToDocument(documentId, labelId, setDocuments);
  };

  // Add this handler for updating document labels
  const handleUpdateDocumentLabel = async (documentId, labelId) => {
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

  // Handler for dropdown toggle to manage z-index
  const handleDropdownToggle = (documentId, isOpen) => {
    setOpenDropdownDocId(isOpen ? documentId : null);
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
                    onKeyPress={async (e) => {
                      if (e.key === 'Enter') {
                        if (newDocumentLabel) {
                          // If a label is selected, create from template
                          await createDocumentFromTemplate(newDocumentLabel);
                        } else {
                          // If no label, create regular document
                          await createDocument();
                        }
                        setCurrentView('editor');
                      }
                    }}
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
                      onClick={async () => {
                        if (newDocumentLabel) {
                          // If a label is selected, create from template
                          await createDocumentFromTemplate(newDocumentLabel);
                        } else {
                          // If no label, create regular document
                          await createDocument();
                        }
                        setCurrentView('editor');
                      }}
                      disabled={!newDocumentTitle.trim() || loading}
                      className="flex-1 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
                    >
                      {newDocumentLabel ? 'Create from Template' : 'Create'}
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
            onCreateLabel={handleCreateLabel}
            onDeleteLabel={handleDeleteLabel}
            onEditLabel={handleEditLabel}
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
                {getFilteredDocuments(documents).filter(doc => doc && doc.id).map((doc) => (
                  <div key={doc.id} className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-gray-200/50 group relative ${openDropdownDocId === doc.id ? 'z-50' : ''}`}>
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-lg">
                          <FileText className="text-white" size={24} />
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={async () => {
                              const view = await fetchVersions(doc.id);
                              if (view) setCurrentView(view);  // Actually switches the view
                            }}
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
                      
                      {/* Replace the old label display with the new selector */}
                      <div className="mb-3">
                        <DocumentLabelSelector
                          document={doc}
                          labels={labels}
                          onLabelChange={handleUpdateDocumentLabel}
                          getLabelColor={getLabelColor}
                          onDropdownToggle={handleDropdownToggle}
                        />
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        Last modified: {doc.updated_at ? formatDate(doc.updated_at) : 'Unknown'}
                      </p>
                      
                      <button
                        onClick={async () => {
                          await openDocument(doc.id);
                          setCurrentView('editor');
                        }}
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
              {versions.filter(version => version && version.id).map((version) => (
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
                      onClick={async () => {
                        console.log('🔍 [RESTORE DEBUG] Restore button clicked');
                        console.log('🔍 [RESTORE DEBUG] Version number:', version.version_number);
                        console.log('🔍 [RESTORE DEBUG] Current view before:', currentView);
                        
                        try {
                          const view = await restoreVersion(version.version_number);
                          console.log('🔍 [RESTORE DEBUG] restoreVersion returned:', view);
                          
                          if (view) {
                            setCurrentView(view);
                          } else {
                            console.log('�� [RESTORE DEBUG] No view returned from restoreVersion');
                          }
                        } catch (error) {
                          console.error('🔍 [RESTORE DEBUG] Error in restore button click:', error);
                        }
                      }}
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
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <button
                  onClick={() => setCurrentView('home')}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 flex-shrink-0"
                >
                  <ArrowLeft size={20} />
                  Back
                </button>
                
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Edit3 className="text-blue-600 flex-shrink-0" size={24} />
                  <input
                    type="text"
                    value={currentDocument.title}
                    onChange={(e) => setCurrentDocument({...currentDocument, title: e.target.value})}
                    className="text-xl font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 flex-1 min-w-0 w-full"
                    placeholder="Enter document title..."
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    console.log('🔍 [VERSIONS DEBUG] Versions button clicked in editor view');
                    
                    try {
                      const view = await fetchVersions(currentDocument.id);
                      
                      if (view) {
                        console.log('🔍 [VERSIONS DEBUG] Setting currentView to:', view);
                        setCurrentView(view);
                      } else {
                        console.log('🔍 [VERSIONS DEBUG] No view returned from fetchVersions');
                      }
                    } catch (error) {
                      console.error('🔍 [VERSIONS DEBUG] Error in versions button click:', error);
                    }
                  }}
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
                
                {currentDocument.sections && currentDocument.sections.filter(section => section && section.id).map((section) => (
                  // Skip Personal Information section as it doesn't need an add form
                  section.title !== 'Personal Information' && (
                    <button
                      key={section.id}
                      onClick={() => {
                        console.log('🔍 [ADD BUTTON DEBUG] Add button clicked for section:', section.title);
                        console.log('🔍 [ADD BUTTON DEBUG] Section ID:', section.id);
                        console.log('🔍 [ADD BUTTON DEBUG] Current showAddForm:', showAddForm);
                        setShowAddForm(section.id);
                        console.log('🔍 [ADD BUTTON DEBUG] Set showAddForm to:', section.id);
                      }}
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
                  {currentDocument.sections && currentDocument.sections.filter(section => section && section.id).map((section, index) => (
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
                            disabled={index === (currentDocument.sections?.length || 0) - 1}
                            className="p-1 text-gray-500 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed rounded"
                            title="Move down"
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete the "${section.title}" section?`)) {
                                deleteSection(section.id);
                              }
                            }}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title={`Delete ${section.title} section`}
                          >
                            <Trash2 size={14} />
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
                {currentDocument.sections && currentDocument.sections.filter(section => section && section.id).map((section, index) => (
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
                        onAddEntry={addNewEntry}
                      />
                    )}
                    
                    {/* Add Entry Form - Show when showAddForm matches this section */}
                    {showAddForm === section.id && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <AddEntryForm
                          section={section}
                          onAdd={(newEntry) => {
                            console.log('🔍 [ADD ENTRY DEBUG] Adding new entry to section:', section.title);
                            console.log('🔍 [ADD ENTRY DEBUG] New entry:', newEntry);
                            console.log('🔍 [ADD ENTRY DEBUG] Section ID:', section.id);
                            
                            if (newEntry && newEntry.trim()) {
                              addNewEntry(section.id, newEntry);
                              setShowAddForm(null);
                              console.log('🔍 [ADD ENTRY DEBUG] Entry added and form closed');
                            } else {
                              console.log('🔍 [ADD ENTRY DEBUG] No valid entry to add');
                            }
                          }}
                          onCancel={() => {
                            console.log('🔍 [ADD ENTRY DEBUG] Cancelled adding entry to section:', section.title);
                            setShowAddForm(null);
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Assistant Component */}
          <div className="w-96 border-l border-gray-200 h-screen flex flex-col">
            <AIAssistant
              currentDocument={currentDocument}
              onEditApply={applyEdit}
              onEditReject={(edit) => {
                // Just remove the edit from the UI
                console.log('Edit rejected:', edit);
              }}
              className="flex-1"
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