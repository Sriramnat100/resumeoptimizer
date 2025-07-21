import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { FileText, Plus, Save, History, Trash2, Edit3, Clock, ArrowLeft, ChevronUp, ChevronDown, LogOut, User, Linkedin, Globe, Sparkles, Zap, Award, Users, Bot, Send, Download } from 'lucide-react';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Register from './Register';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  
  // AI Assistant State
  const [aiMessages, setAiMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hi! I'm your AI resume assistant. I can help you create professional resumes, suggest improvements, and optimize your content for ATS systems. What would you like to work on today?",
      timestamp: new Date()
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions] = useState([
    "Help me write a compelling summary",
    "Suggest improvements for my experience section",
    "Optimize my resume for ATS",
    "Help me quantify my achievements",
    "Review my resume for grammar and style"
  ]);

  // Label System State
  const [labels, setLabels] = useState([]); // Start with empty labels
  const [selectedLabel, setSelectedLabel] = useState('all');
  const [newDocumentLabel, setNewDocumentLabel] = useState('');
  const [showCreateLabelForm, setShowCreateLabelForm] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('blue');

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
    if (!currentDocument) return "No resume is currently open.";
    
    let context = `RESUME: ${currentDocument.title}\n\n`;
    
    currentDocument.sections.forEach(section => {
      const content = section.content?.text || getDefaultContent(section.title);
      if (content && content.trim() && !content.includes('YOUR NAME') && !content.includes('Text (Lead with')) {
        context += `${section.title.toUpperCase()}:\n${content}\n\n`;
      }
    });
    
    return context;
  };

  const parseAiResponse = (aiText) => {
    try {
      // Check if response seems truncated
      const seemsTruncated = aiText.endsWith('{') || aiText.endsWith(',') || aiText.endsWith('[') || !aiText.trim().endsWith('}');
      
      if (seemsTruncated) {
        console.log('⚠️ AI response appears truncated:', aiText.slice(-50));
        return { 
          message: aiText + "\n\n⚠️ Response was truncated. Please try asking again for complete suggestions.", 
          edits: [] 
        };
      }

      // Look for the JSON pattern that starts with { and contains "edits"
      const jsonMatch = aiText.match(/\{\s*"edits"\s*:\s*\[[\s\S]*?\]\s*\}/);
      
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        
        // Validate JSON completeness - check for balanced brackets
        const openBraces = (jsonString.match(/\{/g) || []).length;
        const closeBraces = (jsonString.match(/\}/g) || []).length;
        const openBrackets = (jsonString.match(/\[/g) || []).length;
        const closeBrackets = (jsonString.match(/\]/g) || []).length;
        
        if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
          console.log('⚠️ JSON appears incomplete - unmatched brackets');
          return { 
            message: aiText + "\n\n⚠️ Suggestions were incomplete. Please try again.", 
            edits: [] 
          };
        }
        
        // Log what we're trying to parse for debugging
        console.log('Attempting to parse JSON:', jsonString);
        
        const parsed = JSON.parse(jsonString);
        
        // Remove the JSON from the message text
        const cleanMessage = aiText.replace(jsonMatch[0], '').trim();
        
        return {
          message: cleanMessage,
          edits: parsed.edits || []
        };
      }
    } catch (e) {
      console.log('Failed to parse AI JSON response:', e);
      console.log('Raw AI text:', aiText);
      
      // Try alternative parsing - look for just the edits array
      try {
        const editsMatch = aiText.match(/"edits"\s*:\s*\[[^\]]*\]/);
        if (editsMatch) {
          const editsJson = `{${editsMatch[0]}}`;
          console.log('Trying to parse edits only:', editsJson);
          const parsed = JSON.parse(editsJson);
          return {
            message: aiText.replace(editsMatch[0], '').trim(),
            edits: parsed.edits || []
          };
        }
      } catch (e2) {
        console.log('Alternative parsing also failed:', e2);
      }
    }
    
    // Fallback if no JSON found or parsing failed
    return { message: aiText, edits: [] };
  };

  const sendAiMessage = async (message) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setAiMessages(prev => [...prev, userMessage]);
    setAiInput('');
    setAiLoading(true);

    try {
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      
      if (!apiKey) {
        setTimeout(() => {
          const aiResponse = {
            id: Date.now() + 1,
            type: 'ai',
            content: generateContextualMockResponse(message),
            timestamp: new Date()
          };
          setAiMessages(prev => [...prev, aiResponse]);
          setAiLoading(false);
        }, 1000);
        return;
      }

      // Get current resume context
      const resumeContext = getResumeContext();
      
      // Create initial AI message with typing animation
      const aiMessageId = Date.now() + 1;
      const initialAiResponse = {
        id: aiMessageId,
        type: 'ai',
        content: '',
        timestamp: new Date(),
        isTyping: true,
        edits: []
      };
      
      setAiMessages(prev => [...prev, initialAiResponse]);
      
      // Single API call with our improved prompt
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a professional resume writing assistant. You have access to the user's current resume content below.

CURRENT RESUME CONTENT:
${resumeContext}

USER QUESTION: ${message}

CRITICAL INSTRUCTIONS - FOLLOW EXACTLY:
1. Provide helpful advice in your response
2. If you can suggest specific improvements, you MUST include them in this EXACT JSON format at the very end of your response

FORMAT REQUIREMENTS - EXTREMELY IMPORTANT:
- Put the JSON on a NEW LINE after your advice
- The JSON must be at the very end of your response
- NO text after the closing brace }
- NO text on the same line as the JSON
- The JSON must be valid and parseable
- Use "replace" for changing existing text
- Use "add" for adding new text (use "addition" field instead of "replace") 
- Use "remove" for deleting text
- The "find" text must match EXACTLY what's in the resume
- Only include edits if you can make specific, actionable improvements
- If no edits are needed, return empty "edits" array: {"edits": []}

EXACT JSON FORMAT:
{
  "edits": [
    {
      "sectionId": "section-uuid-here",
      "action": "replace",
      "find": "exact text to find",
      "replace": "new text", 
      "reason": "explanation of the change"
    }
  ]
}

EXAMPLE RESPONSE:
Here is my advice for improving your skills section. You should focus on specific technologies rather than skill levels.

{
  "edits": [
    {
      "sectionId": "skills-section",
      "action": "replace",
      "find": "• Python (Intermediate)",
      "replace": "• Python (Pandas, NumPy, Django)",
      "reason": "Replaces vague skill level with specific technologies"
    }
  ]
}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Gemini API error');
      }

      const aiText = data.candidates[0].content.parts[0].text;
      const parsedResponse = parseAiResponse(aiText);

      // Simulate typing animation for the advice text
      const words = parsedResponse.message.split(' ');
      let currentText = '';
      
      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? ' ' : '') + words[i];
        
        setAiMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: currentText, isTyping: true }
            : msg
        ));
        
        // Small delay between words for typing effect
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // After typing is complete, show the edits with a slight delay
      setTimeout(() => {
        setAiMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, isTyping: false, edits: parsedResponse.edits }
            : msg
        ));
      }, 500);

    } catch (error) {
      console.error('Gemini API Error:', error);
      
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: generateContextualMockResponse(message),
        timestamp: new Date(),
        edits: []
      };
      
      setAiMessages(prev => [...prev, aiResponse]);
    } finally {
      setAiLoading(false);
    }
  };

  // Add the missing handleEditAction function
  const handleEditAction = async (edit, action) => {
    if (action === 'accept') {
      // Apply the edit
      await applyEdit(edit);
    }
    
    // Remove the edit from the message
    setAiMessages(prev => prev.map(msg => {
      if (msg.edits && msg.edits.length > 0) {
        return {
          ...msg,
          edits: msg.edits.filter(e => e !== edit)
        };
      }
      return msg;
    }));
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

  const generateContextualMockResponse = (message) => {
    const resumeContext = getResumeContext();
    const hasContent = resumeContext.includes('YOUR NAME') === false && 
                      resumeContext.length > 50;
    
    if (!hasContent) {
      return "I'd love to help you with your resume! First, let's add some content to your resume sections so I can provide personalized advice. Try adding your experience, education, or skills first.";
    }

    const responses = {
      'summary': `Looking at your resume, I can help you write a compelling summary! I see you have ${currentDocument?.sections?.length || 0} sections. A strong summary should highlight your key achievements and career goals. Based on your content, I'd suggest focusing on your most impressive accomplishments.`,
      'experience': `I can see your experience section. Let me help you make it more impactful! Focus on quantifiable achievements using action verbs. For example, instead of 'Responsible for sales', try 'Increased sales by 25% through strategic client relationships'. I can help you identify specific improvements.`,
      'ats': `Great question about ATS optimization! Looking at your resume structure, I can help you optimize it. Make sure to use standard section headings and include relevant keywords. I can analyze your current content for ATS-friendly improvements.`,
      'quantify': `Quantifying achievements makes your resume stand out! I can help you identify opportunities in your current content to add specific numbers, percentages, and metrics. Let me review what you have and suggest improvements.`,
      'grammar': `I'll review your resume for grammar, style, and clarity. I can check for consistent formatting, proper verb tenses, and professional language throughout your content.`
    };

    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('summary')) return responses.summary;
    if (lowerMessage.includes('experience')) return responses.experience;
    if (lowerMessage.includes('ats')) return responses.ats;
    if (lowerMessage.includes('quantify')) return responses.quantify;
    if (lowerMessage.includes('grammar')) return responses.grammar;
    
    return `I can see your resume content and I'm here to help you improve it! I can assist with writing compelling content, optimizing for ATS systems, suggesting improvements, and reviewing your work. What specific aspect would you like to focus on?`;
  };

  const handleSuggestionClick = (suggestion) => {
    sendAiMessage(suggestion);
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

  const getDefaultContent = (title) => {
    const defaults = {
      'Personal Information': 'YOUR NAME\nYour Number | youremail@address.com | Location | Your Website',
      'Skills': '**Programming Languages:**\n* Python\n* JavaScript\n\n**Frameworks & Libraries:**\n* React (including React Router, Redux, etc. - *List specific libraries and functionalities here*) \n* Node.js\n\n**Databases:**\n* MongoDB',
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

  const formatFormDataToText = (sectionTitle, formData) => {
    switch (sectionTitle) {
      case 'Education':
        const educationLines = [];
        if (formData.school) educationLines.push(formData.school);
        if (formData.degree) educationLines.push(formData.degree);
        if (formData.graduationDate) educationLines.push(formData.graduationDate);
        if (formData.major) educationLines.push(`Major: ${formData.major}`);
        if (formData.gpa) educationLines.push(`GPA: ${formData.gpa}`);
        if (formData.coursework) educationLines.push(`\nRelevant Coursework: ${formData.coursework}`);
        return educationLines.join('\n');
      
      case 'Experience':
        const experienceLines = [];
        const companyLine = [];
        if (formData.company && formData.location) {
          companyLine.push(`${formData.company}, ${formData.location}`);
        } else if (formData.company) {
          companyLine.push(formData.company);
        }
        if (formData.startDate && formData.endDate) {
          companyLine.push(`${formData.startDate} - ${formData.endDate}`);
        } else if (formData.startDate) {
          companyLine.push(formData.startDate);
        }
        if (companyLine.length > 0) {
          experienceLines.push(companyLine.join('                    '));
        }
        if (formData.title) experienceLines.push(formData.title);
        if (formData.achievements) experienceLines.push(formData.achievements);
        return experienceLines.join('\n');
      
      case 'Skills':
        if (formData.category && formData.skills) {
          return `${formData.category}:\n${formData.skills}`;
        } else if (formData.skills) {
          return formData.skills;
        }
        return '';
      
      case 'Projects':
        const projectLines = [];
        if (formData.projectName) projectLines.push(formData.projectName);
        if (formData.technologies) projectLines.push(`Technologies: ${formData.technologies}`);
        if (formData.description) projectLines.push(formData.description);
        if (formData.features) projectLines.push(formData.features);
        return projectLines.join('\n');
      
      case 'Leadership & Community':
        const leadershipLines = [];
        const orgLine = [];
        if (formData.organization) orgLine.push(formData.organization);
        if (formData.startDate && formData.endDate) {
          orgLine.push(`${formData.startDate} - ${formData.endDate}`);
        } else if (formData.startDate) {
          orgLine.push(formData.startDate);
        }
        if (orgLine.length > 0) {
          leadershipLines.push(orgLine.join('                    '));
        }
        if (formData.position) leadershipLines.push(formData.position);
        if (formData.responsibilities) leadershipLines.push(formData.responsibilities);
        return leadershipLines.join('\n');
      
      case 'Awards & Honors':
        const awardLines = [];
        const awardLine = [];
        if (formData.awardName) awardLine.push(formData.awardName);
        if (formData.issuingOrg) awardLine.push(formData.issuingOrg);
        if (formData.dateReceived) awardLine.push(formData.dateReceived);
        if (awardLine.length > 0) {
          awardLines.push(awardLine.join(' | '));
        }
        if (formData.description) awardLines.push(formData.description);
        return awardLines.join('\n');
      
      case 'Certifications':
        const certLines = [];
        const certLine = [];
        if (formData.certName) certLine.push(formData.certName);
        if (formData.issuingOrg) certLine.push(formData.issuingOrg);
        if (formData.dateEarned) certLine.push(formData.dateEarned);
        if (certLine.length > 0) {
          certLines.push(certLine.join(' | '));
        }
        if (formData.credentialId) certLines.push(formData.credentialId);
        return certLines.join('\n');
      
      case 'Personal Information':
        const personalLines = [];
        if (formData.fullName) personalLines.push(formData.fullName);
        const contactInfo = [];
        if (formData.phone) contactInfo.push(formData.phone);
        if (formData.email) contactInfo.push(formData.email);
        if (formData.location) contactInfo.push(formData.location);
        if (formData.website) contactInfo.push(formData.website);
        if (contactInfo.length > 0) {
          personalLines.push(contactInfo.join(' | '));
        }
        return personalLines.join('\n');
      
      default:
        return formData.content || '';
    }
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
    const [formData, setFormData] = useState({});
    
    const handleAdd = () => {
      // Convert form data to formatted text based on section type
      const formattedContent = formatFormDataToText(section.title, formData);
      onAdd(section.id, formattedContent);
      onCancel();
    };

    const handleInputChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const renderEducationForm = () => (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
          <input
            type="text"
            value={formData.school || ''}
            onChange={(e) => handleInputChange('school', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., University of California, Berkeley"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
          <input
            type="text"
            value={formData.degree || ''}
            onChange={(e) => handleInputChange('degree', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Bachelor of Science in Computer Science"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Date</label>
            <input
              type="text"
              value={formData.graduationDate || ''}
              onChange={(e) => handleInputChange('graduationDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., May 2024"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GPA (Optional)</label>
            <input
              type="text"
              value={formData.gpa || ''}
              onChange={(e) => handleInputChange('gpa', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 3.8"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Major/Minor</label>
          <input
            type="text"
            value={formData.major || ''}
            onChange={(e) => handleInputChange('major', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Computer Science, Minor in Mathematics"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Relevant Coursework (Optional)</label>
          <textarea
            value={formData.coursework || ''}
            onChange={(e) => handleInputChange('coursework', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="2"
            placeholder="e.g., Data Structures, Algorithms, Database Systems"
          />
        </div>
      </div>
    );

    const renderExperienceForm = () => (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input
            type="text"
            value={formData.company || ''}
            onChange={(e) => handleInputChange('company', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Google Inc."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Senior Software Engineer"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="text"
              value={formData.startDate || ''}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., June 2022"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="text"
              value={formData.endDate || ''}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Present"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={formData.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., San Francisco, CA"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Key Achievements</label>
          <textarea
            value={formData.achievements || ''}
            onChange={(e) => handleInputChange('achievements', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            placeholder="• Led development of new feature that increased user engagement by 25%&#10;• Mentored 3 junior developers and improved team productivity&#10;• Optimized database queries reducing load times by 40%"
          />
        </div>
      </div>
    );

    const renderSkillsForm = () => (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Skill Category</label>
          <input
            type="text"
            value={formData.category || ''}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Programming Languages, Frameworks, Tools"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
          <textarea
            value={formData.skills || ''}
            onChange={(e) => handleInputChange('skills', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="e.g., Python, JavaScript, React, Node.js, MongoDB, AWS"
          />
        </div>
      </div>
    );

    const renderProjectForm = () => (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
          <input
            type="text"
            value={formData.projectName || ''}
            onChange={(e) => handleInputChange('projectName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., E-commerce Platform"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Technologies Used</label>
          <input
            type="text"
            value={formData.technologies || ''}
            onChange={(e) => handleInputChange('technologies', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., React, Node.js, MongoDB, AWS"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Description</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Brief description of the project and your role"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Key Features/Achievements</label>
          <textarea
            value={formData.features || ''}
            onChange={(e) => handleInputChange('features', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="• Implemented user authentication and authorization&#10;• Built responsive UI with React and Tailwind CSS&#10;• Deployed to AWS with CI/CD pipeline"
          />
        </div>
      </div>
    );

    const renderLeadershipForm = () => (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
          <input
            type="text"
            value={formData.organization || ''}
            onChange={(e) => handleInputChange('organization', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Computer Science Club"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
          <input
            type="text"
            value={formData.position || ''}
            onChange={(e) => handleInputChange('position', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., President"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="text"
              value={formData.startDate || ''}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., September 2023"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="text"
              value={formData.endDate || ''}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Present"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities & Achievements</label>
          <textarea
            value={formData.responsibilities || ''}
            onChange={(e) => handleInputChange('responsibilities', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="• Led team of 15 members in organizing tech events&#10;• Increased membership by 40% through outreach programs&#10;• Coordinated with faculty for curriculum improvements"
          />
        </div>
      </div>
    );

    const renderAwardsForm = () => (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Award/Honor Name</label>
          <input
            type="text"
            value={formData.awardName || ''}
            onChange={(e) => handleInputChange('awardName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Dean's List"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Organization</label>
          <input
            type="text"
            value={formData.issuingOrg || ''}
            onChange={(e) => handleInputChange('issuingOrg', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., University of California"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Received</label>
          <input
            type="text"
            value={formData.dateReceived || ''}
            onChange={(e) => handleInputChange('dateReceived', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., May 2024"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="2"
            placeholder="Brief description of the award criteria or significance"
          />
        </div>
      </div>
    );

    const renderCertificationsForm = () => (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Certification Name</label>
          <input
            type="text"
            value={formData.certName || ''}
            onChange={(e) => handleInputChange('certName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., AWS Certified Solutions Architect"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Organization</label>
          <input
            type="text"
            value={formData.issuingOrg || ''}
            onChange={(e) => handleInputChange('issuingOrg', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Amazon Web Services"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Earned</label>
          <input
            type="text"
            value={formData.dateEarned || ''}
            onChange={(e) => handleInputChange('dateEarned', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., March 2024"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Credential ID (Optional)</label>
          <input
            type="text"
            value={formData.credentialId || ''}
            onChange={(e) => handleInputChange('credentialId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., AWS-123456789"
          />
        </div>
      </div>
    );

    const renderPersonalInfoForm = () => (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            value={formData.fullName || ''}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="text"
            value={formData.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., (555) 123-4567"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., john.doe@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={formData.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., San Francisco, CA"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website/LinkedIn (Optional)</label>
          <input
            type="text"
            value={formData.website || ''}
            onChange={(e) => handleInputChange('website', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., linkedin.com/in/johndoe"
          />
        </div>
      </div>
    );

    const renderFormBySection = () => {
      switch (section.title) {
        case 'Education':
          return renderEducationForm();
        case 'Experience':
          return renderExperienceForm();
        case 'Skills':
          return renderSkillsForm();
        case 'Projects':
          return renderProjectForm();
        case 'Leadership & Community':
          return renderLeadershipForm();
        case 'Awards & Honors':
          return renderAwardsForm();
        case 'Certifications':
          return renderCertificationsForm();
        case 'Personal Information':
          return renderPersonalInfoForm();
        default:
          return (
            <textarea
              value={formData.content || ''}
              onChange={(e) => handleInputChange('content', e.target.value)}
              className="w-full h-24 p-3 border border-blue-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder={`Enter new ${section.title.toLowerCase()}...`}
            />
          );
      }
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
        {renderFormBySection()}
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
  const createCustomLabel = async () => {
    // Add these debug lines at the very beginning
    console.log('🔥 createCustomLabel function called!');
    
    console.log('🏷️ Creating custom label:', { newLabelName, newLabelColor });
    
    if (!newLabelName.trim()) {
      console.log('⚠️ Label name is empty');
      return;
    }
    
    console.log('🚀 About to call backend...');
    
    try {
      // Call the backend to create the label
      const createdLabel = await createLabelInBackend(newLabelName.trim(), newLabelColor);
      console.log('✅ Label created in backend:', createdLabel);
      
      // Update local state with the backend response
      setLabels([...labels, createdLabel]);
      setNewLabelName('');
      setNewLabelColor('blue');
      setShowCreateLabelForm(false);
      
      console.log('✅ Label added to frontend state');
    } catch (error) {
      console.error('❌ Failed to create label:', error);
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
                    
                    <button
                      onClick={() => setShowCreateLabelForm(true)}
                      className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium py-2"
                    >
                      + Create new label
                    </button>
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

          {/* Label Filter */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Filter by:</span>
              <button
                onClick={() => setSelectedLabel('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedLabel === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({documents.length})
              </button>
              {labels.map(label => {
                const count = documents.filter(doc => doc.label === label.id).length;
                return (
                  <button
                    key={label.id}
                    onClick={() => setSelectedLabel(label.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedLabel === label.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {label.name} ({count})
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setShowCreateLabelForm(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              New Label
            </button>
          </div>

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

        {/* Custom Label Creation Modal */}
        {showCreateLabelForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Label</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Label Name</label>
                  <input
                    type="text"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="e.g., Frontend, Backend, Data Science..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && createCustomLabel()}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['blue', 'green', 'purple', 'red', 'orange', 'yellow', 'pink', 'indigo'].map(color => (
                      <button
                        key={color}
                        onClick={() => setNewLabelColor(color)}
                        className={`w-12 h-12 rounded-lg border-2 transition-all ${
                          newLabelColor === color 
                            ? 'border-gray-800 scale-110' 
                            : 'border-gray-300 hover:border-gray-400'
                        } ${getLabelColor(color).split(' ')[0]}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={createCustomLabel}
                  disabled={!newLabelName.trim()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  Create Label
                </button>
                <button
                  onClick={() => {
                    setShowCreateLabelForm(false);
                    setNewLabelName('');
                    setNewLabelColor('blue');
                  }}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
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

          {/* Cursor-Style AI Assistant - Right Side */}
          <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
            {/* AI Assistant Header */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-lg">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                  <p className="text-sm text-gray-500">Building your resume</p>
                </div>
              </div>
            </div>

            {/* AI Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {aiMessages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md ${message.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-lg p-3`}>
                    <div className="flex items-start gap-2">
                      {message.type === 'ai' && (
                        <Bot className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm">
                          {message.content}
                          {message.isTyping && (
                            <span className="inline-block w-2 h-4 bg-blue-600 ml-1 animate-pulse"></span>
                          )}
                        </p>
                        
                        {/* AI Edits with Accept/Reject buttons */}
                        {message.edits && message.edits.length > 0 && !message.isTyping && (
                          <div className="mt-3 space-y-3">
                            {message.edits.map((edit, index) => (
                              <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-xs text-blue-700 mb-2 font-medium">{edit.reason}</p>
                                
                                {/* Before/After comparison */}
                                <div className="mb-3 space-y-2">
                                  {edit.action === 'replace' && (
                                    <>
                                      <div>
                                        <div className="text-xs text-gray-600 mb-1">Current:</div>
                                        <div className="text-xs bg-red-50 p-2 rounded border-l-2 border-red-300 font-mono">
                                          {edit.find}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-xs text-gray-600 mb-1">Improved:</div>
                                        <div className="text-xs bg-green-50 p-2 rounded border-l-2 border-green-300 font-mono">
                                          {edit.replace}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                  
                                  {edit.action === 'add' && (
                                    <div>
                                      <div className="text-xs text-gray-600 mb-1">Add:</div>
                                      <div className="text-xs bg-green-50 p-2 rounded border-l-2 border-green-300 font-mono">
                                        {edit.addition}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {edit.action === 'remove' && (
                                    <div>
                                      <div className="text-xs text-gray-600 mb-1">Remove:</div>
                                      <div className="text-xs bg-red-50 p-2 rounded border-l-2 border-red-300 font-mono">
                                        {edit.find}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Accept/Reject buttons */}
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditAction(edit, 'accept')}
                                    className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors font-medium"
                                  >
                                    ✓ Accept
                                  </button>
                                  <button
                                    onClick={() => handleEditAction(edit, 'reject')}
                                    className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors font-medium"
                                  >
                                    ✗ Reject
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {aiLoading && !aiMessages.some(msg => msg.isTyping) && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

           
            {/* AI Input */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendAiMessage(aiInput)}
                  placeholder="Ask me anything about your resume..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={() => sendAiMessage(aiInput)}
                  disabled={!aiInput.trim() || aiLoading}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
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

export default App;