import { useState } from 'react';
import aiService from '../services/aiService';

export const useAI = (currentDocument, onEditApply, onEditReject) => {
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hi! I'm your AI resume assistant. I can help you create professional resumes, suggest improvements, and optimize your content for ATS systems. What would you like to work on today?",
      timestamp: new Date(),
      suggestions: [
        "Help me improve my skills section",
        "Review my experience descriptions",
        "Optimize for ATS systems",
        "Suggest better action verbs"
      ]
    }
  ]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Send message to AI
  const sendMessage = async (message) => {
    console.log('🤖 [AI DEBUG] sendMessage called with:', message);
    console.log('🤖 [AI DEBUG] currentDocument from parameter:', currentDocument);
    
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
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
      
      setMessages(prev => [...prev, initialAiResponse]);
      
      // Use AI service to get response
      const response = await aiService.sendMessage(message, currentDocument);
      
      // Simulate typing animation
      const words = response.message.split(' ');
      let currentText = '';
      
      for (let i = 0; i < words.length; i++) {
        currentText += (i > 0 ? ' ' : '') + words[i];
        
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: currentText, isTyping: true }
            : msg
        ));
        
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Show edits after typing
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, isTyping: false, edits: response.edits }
            : msg
        ));
      }, 500);

    } catch (error) {
      console.error('💥 [AI DEBUG] Error caught in sendMessage:', error);
      setError(error.message);
      
      // Use fallback response from service
      const fallbackResponse = aiService.generateFallbackResponse(message);
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: fallbackResponse.message,
        timestamp: new Date(),
        edits: fallbackResponse.edits
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit actions
  const handleEditAction = (edit, action) => {
    console.log('🔧 [EDIT DEBUG] handleEditAction called with:', { edit, action });
    console.log('🔧 [EDIT DEBUG] edit object structure:', edit);
    console.log('🔧 [EDIT DEBUG] edit.section:', edit?.section);
    console.log('🔧 [EDIT DEBUG] edit.sectionId:', edit?.sectionId);
    console.log('🔧 [EDIT DEBUG] edit.action:', edit?.action);
    console.log('🔧 [EDIT DEBUG] edit.find:', edit?.find);
    console.log('🔧 [EDIT DEBUG] edit.replace:', edit?.replace);
    console.log('🔧 [EDIT DEBUG] onEditApply available:', typeof onEditApply, onEditApply);
    
    if (action === 'accept' && onEditApply) {
      console.log('🔧 [EDIT DEBUG] Calling onEditApply with edit:', edit);
      onEditApply(edit);
    } else if (action === 'reject') {
      console.log('Edit rejected:', edit);
    }
    
    // Remove the edit from the message
    setMessages(prev => prev.map(msg => {
      if (msg.edits && msg.edits.length > 0) {
        return {
          ...msg,
          edits: msg.edits.filter(e => e !== edit)
        };
      }
      return msg;
    }));
  };

  // Handle suggestion clicks
  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  // Expose helpers that now proxy to backend if needed
  const analyzeSection = async (sectionContent, userQuestion) => {
    return aiService.analyzeSection(sectionContent, userQuestion, currentDocument);
  };

  return {
    messages,
    input,
    setInput,
    loading,
    error,
    sendMessage,
    handleEditAction,
    handleSuggestionClick,
    getResumeContext: () => aiService.getResumeContext(currentDocument),
    analyzeSection,
  };
};

