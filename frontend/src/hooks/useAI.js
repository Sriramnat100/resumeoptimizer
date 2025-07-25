import { useState } from 'react';
import { parseAiResponse, generateFallbackResponse } from '../utils/aiUtils';
import { getDefaultContent } from '../utils/resumeUtils';
import { useDocuments } from './useDocuments';

export const useAI = (currentDocument, onEditApply, onEditReject) => {
  
  // Don't get applyEdit from useDocuments, use onEditApply parameter instead

  // Create local getResumeContext that uses the currentDocument parameter
  const getResumeContext = () => {
    console.log('🤖 [AI CONTEXT] Getting context for currentDocument:', currentDocument);
    
    if (!currentDocument) {
      console.log('⚠️ [AI CONTEXT] No current document available');
      return "No resume is currently open.";
    }
    
    console.log('🤖 [AI CONTEXT] Document title:', currentDocument.title);
    console.log('🤖 [AI CONTEXT] Document sections:', currentDocument.sections?.length);
    
    let context = `RESUME: ${currentDocument.title}\n\n`;
    
    if (currentDocument.sections) {
      currentDocument.sections.forEach(section => {
        const content = section.content?.text || getDefaultContent(section.title);
        console.log(`🤖 [AI CONTEXT] Section ${section.title} content:`, content?.substring(0, 100));
        
        if (content && content.trim() && !content.includes('YOUR NAME') && !content.includes('Text (Lead with')) {
          context += `${section.title.toUpperCase()}:\n${content}\n\n`;
        }
      });
    }
    
    console.log('🤖 [AI CONTEXT] Final context length:', context.length);
    return context;
  };
  
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
      const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
      
      if (!apiKey) {
        // Use fallback response when no API key
        setTimeout(() => {
          const aiResponse = {
            id: Date.now() + 1,
            type: 'ai',
            content: generateFallbackResponse(message),
            timestamp: new Date(),
            edits: []
          };
          setMessages(prev => [...prev, aiResponse]);
          setLoading(false);
        }, 1000);
        return;
      }

      // Get current resume context
      const resumeContext = getResumeContext();
      console.log('🤖 [AI DEBUG] About to call getResumeContext');
      console.log('🤖 [AI DEBUG] getResumeContext result:', resumeContext);
      console.log('🤖 [AI DEBUG] resumeContext received:', resumeContext);
      console.log('🤖 [AI DEBUG] resumeContext length:', resumeContext.length);
      
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
      
      // Prepare request payload
      const requestPayload = {
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
- SECTION NAMES MUST BE EXACT: Use "Skills", "Experience", "Education", "Projects", "Leadership & Community", "Awards & Honors", "Certifications", "Personal Information"

EXACT JSON FORMAT:
{
  "edits": [
    {
      "section": "Skills",
      "action": "replace",
      "find": "exact text to find",
      "replace": "new text", 
      "reason": "explanation of the change"
    }
  ]
}`              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      };

      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      
      console.log('🌐 [AI DEBUG] Making API request to:', apiUrl);
      
      const startTime = Date.now();
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      const endTime = Date.now();
      console.log('⏱️ [AI DEBUG] Response received in:', endTime - startTime, 'ms');
      console.log('📡 [AI DEBUG] Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Gemini API error');
      }

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Unexpected response structure from Gemini API');
      }

      const aiText = data.candidates[0].content.parts[0].text;
      console.log('🤖 [AI DEBUG] Raw AI response:', aiText);
      const parsedResponse = parseAiResponse(aiText);
      console.log('🤖 [AI DEBUG] Parsed response:', parsedResponse);
      console.log('🤖 [AI DEBUG] Parsed edits:', parsedResponse.edits);

      // Simulate typing animation
      const words = parsedResponse.message.split(' ');
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
            ? { ...msg, isTyping: false, edits: parsedResponse.edits }
            : msg
        ));
      }, 500);

    } catch (error) {
      console.error('💥 [AI DEBUG] Error caught in sendMessage:', error);
      setError(error.message);
      
      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: generateFallbackResponse(message),
        timestamp: new Date(),
        edits: []
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

  return {
    messages,
    input,
    setInput,
    loading,
    error,
    sendMessage,
    handleEditAction,
    handleSuggestionClick,
    getResumeContext
  };
};

