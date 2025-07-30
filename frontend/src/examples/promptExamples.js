/**
 * Examples of how to use the Prompt Service
 * This demonstrates industry best practices for chatbot instruction management
 */

import promptService from '../services/promptService';

// Example 1: Using a specific template
export const useTemplateExample = () => {
  const userMessage = "My experience says 'worked on project'";
  const templateKey = 'review_experience';
  
  // This will use the review_experience template
  const prompt = promptService.buildPrompt(userMessage, currentDocument, templateKey);
  return prompt;
};

// Example 2: Adding a new template dynamically
export const addNewTemplate = () => {
  const newTemplate = `Analyze this content for technical depth:

{content}

Focus on:
- Technical complexity
- Specific technologies used
- Quantifiable impact
- Industry relevance`;

  promptService.addTemplate('technical_analysis', newTemplate);
};

// Example 3: Updating the system prompt
export const updateSystemPrompt = () => {
  const newSystemPrompt = `You are an expert resume writing assistant specializing in tech roles.

YOUR EXPERTISE:
- Software engineering resumes
- Data science positions
- Product management roles
- Technical leadership positions

YOUR APPROACH:
1. ANALYZE: Review content for technical depth
2. IDENTIFY: Find areas needing technical specificity
3. SUGGEST: Provide concrete technical improvements
4. EXPLAIN: Help users understand technical impact

Remember: Focus on technical achievements and quantifiable results.`;

  promptService.updateSystemPrompt(newSystemPrompt);
};

// Example 4: Using few-shot examples
export const useFewShotExamples = () => {
  // The prompt service automatically includes few-shot examples
  // But you can also access them directly
  const examples = promptService.getFewShotExamples();
  console.log('Available examples:', examples);
};

// Example 5: Chain-of-thought prompting
export const chainOfThoughtExample = () => {
  const chainPrompt = `Think step by step about this resume content:

1. What is the current level of detail?
2. What specific improvements would make it stronger?
3. How can we quantify the achievements?
4. What action verbs would be more impactful?

Then provide your recommendations.`;

  // You could add this as a new template
  promptService.addTemplate('chain_of_thought', chainPrompt);
};

// Example 6: Function calling approach (advanced)
export const functionCallingExample = () => {
  // This would be used with APIs that support function calling
  const functions = [
    {
      name: "suggest_action_verb",
      description: "Suggest a stronger action verb for a bullet point",
      parameters: {
        type: "object",
        properties: {
          current_verb: {
            type: "string",
            description: "The current action verb"
          },
          context: {
            type: "string", 
            description: "The context of the bullet point"
          }
        },
        required: ["current_verb", "context"]
      }
    }
  ];
  
  return functions;
};

// Example 7: RAG (Retrieval-Augmented Generation) approach
export const ragExample = () => {
  // This would involve storing prompts in a vector database
  // and retrieving relevant ones based on user query
  const promptDatabase = [
    {
      id: "experience_review",
      content: "Review experience section for improvements",
      embedding: [0.1, 0.2, 0.3], // Vector embedding
      tags: ["experience", "review", "improvement"]
    },
    {
      id: "ats_optimization", 
      content: "Optimize content for ATS systems",
      embedding: [0.4, 0.5, 0.6],
      tags: ["ats", "optimization", "keywords"]
    }
  ];
  
  // In practice, you'd use a vector similarity search
  // to find the most relevant prompts for the user's query
  return promptDatabase;
};

// Example 8: Context-aware prompting
export const contextAwareExample = () => {
  const getContextAwarePrompt = (userQuery, document, userLevel) => {
    let basePrompt = promptService.buildPrompt(userQuery, document);
    
    // Add context based on user level
    if (userLevel === 'beginner') {
      basePrompt += '\n\nNote: This user is new to resume writing. Provide detailed explanations.';
    } else if (userLevel === 'expert') {
      basePrompt += '\n\nNote: This user is experienced. Focus on advanced optimization techniques.';
    }
    
    return basePrompt;
  };
  
  return getContextAwarePrompt;
};

// Example 9: A/B testing different prompts
export const abTestingExample = () => {
  const promptVariants = {
    variantA: {
      systemPrompt: "You are a helpful resume assistant...",
      temperature: 0.7
    },
    variantB: {
      systemPrompt: "You are an expert resume consultant...", 
      temperature: 0.5
    }
  };
  
  // Track which variant performs better
  const trackPerformance = (variant, userSatisfaction) => {
    console.log(`Variant ${variant} scored: ${userSatisfaction}`);
  };
  
  return { promptVariants, trackPerformance };
};

// Example 10: Prompt versioning
export const promptVersioningExample = () => {
  const promptVersions = {
    v1: {
      systemPrompt: "You are a resume assistant...",
      templates: { /* v1 templates */ },
      examples: { /* v1 examples */ }
    },
    v2: {
      systemPrompt: "You are an expert resume consultant...",
      templates: { /* v2 templates */ },
      examples: { /* v2 examples */ }
    }
  };
  
  const switchVersion = (version) => {
    const config = promptVersions[version];
    promptService.updateSystemPrompt(config.systemPrompt);
    // Update templates and examples as needed
  };
  
  return { promptVersions, switchVersion };
}; 