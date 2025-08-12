"""
LangChain-based AI Service for Resume Optimizer
Replaces all frontend AI functionality with reliable, structured responses
"""

import os
import json
from typing import List, Dict, Optional, Any
from datetime import datetime
from dotenv import load_dotenv

# LangChain imports
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from langchain.output_parsers import RetryOutputParser
from langchain_core.runnables import RunnableParallel, RunnableLambda
from pydantic import BaseModel, Field
from enum import Enum

load_dotenv()

class EditAction(str, Enum):
    """Valid edit actions"""
    REPLACE = "replace"
    ADD = "add"
    REMOVE = "remove" 

class ResumeEdit(BaseModel):
    """Structured format for resume edits - matches your current structure"""
    section: str = Field(description="Resume section name (e.g., 'Skills', 'Experience')")
    action: EditAction = Field(description="Type of edit to perform")
    find: str = Field(description="Text to find (for replace/remove actions)")
    replace: str = Field(description="Text to replace with (for replace action)")
    addition: str = Field(description="Text to add (for add action)")
    reason: str = Field(description="Brief explanation of the change (max 225 chars)")

class AIResponse(BaseModel):
    """Structured AI response format - matches your current structure"""
    message: str = Field(description="AI's advice and suggestions")
    edits: List[ResumeEdit] = Field(description="List of suggested edits", default_factory=list)

class JobDescription(BaseModel):
    """Parsed job description structure"""
    title: str = Field(description="Job title")
    company: str = Field(description="Company name")
    skills: List[str] = Field(description="Required skills")
    requirements: List[str] = Field(description="Job requirements")
    experience: str = Field(description="Experience level")
    location: str = Field(description="Job location")

class ResumeAIService:
    """
    LangChain-based AI service for resume optimization
    Replaces all frontend AI functionality with reliable, structured responses
    """
    
    def __init__(self):
        """Initialize LangChain models and parsers"""
        self.setup_models()
        self.setup_parsers()
        self.setup_prompts()
        # Per-user ephemeral memory: { user_id: { "job_description": dict|None, "history": [(role, content), ...] } }
        self.user_contexts: Dict[str, Dict[str, Any]] = {}
        
    def setup_models(self):
        """Initialize AI models with fallback support"""
        # Prefer standard env names, fall back to legacy if present
        openai_api_key = os.getenv("OPENAI_API_KEY") or os.getenv("OPEN_AI_KEY")
        gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("REACT_APP_GEMINI_API_KEY")

        def supports_openai_json_mode(model_name: str) -> bool:
            """Heuristic: JSON mode is supported by 4o/4o-mini/o3/o4 families.
            This avoids 400 'response_format not supported' errors."""
            if not model_name:
                return False
            name = model_name.lower()
            return (
                "gpt-4o" in name
                or name.startswith("o3")
                or name.startswith("o4")
            )

        try:
            if openai_api_key:
                # Use env override or default to a broadly available model
                openai_model_name = os.getenv("OPENAI_MODEL", "gpt-4")

                if supports_openai_json_mode(openai_model_name) or os.getenv("OPENAI_JSON_MODE", "false").lower() == "true":
                    self.openai_model = ChatOpenAI(
                        model=openai_model_name,
                        temperature=0.7,
                        max_tokens=3000,
                        api_key=openai_api_key,
                        model_kwargs={
                            "response_format": {"type": "json_object"}
                        },
                    )
                    print(f"✅ OpenAI model initialized (JSON mode): {openai_model_name}")
                else:
                    # Initialize without JSON mode to avoid 400s
                    self.openai_model = ChatOpenAI(
                        model=openai_model_name,
                        temperature=0.7,
                        max_tokens=3000,
                        api_key=openai_api_key,
                    )
                    print(f"✅ OpenAI model initialized (no JSON mode): {openai_model_name}")
            else:
                self.openai_model = None
                print("ℹ️ OpenAI API key not provided; skipping OpenAI model initialization")
        except Exception as e:
            print(f"❌ OpenAI model failed: {e}")
            self.openai_model = None

        try:
            if gemini_api_key:
                # Fallback/primary model: Gemini with JSON mime type
                self.gemini_model = ChatGoogleGenerativeAI(
                    model="gemini-1.5-flash",
                    temperature=0.7,
                    max_output_tokens=3000,
                    google_api_key=gemini_api_key,
                    response_mime_type="application/json",
                )
                print("✅ Gemini model initialized")
            else:
                self.gemini_model = None
                print("ℹ️ GEMINI_API_KEY not provided; skipping Gemini model initialization")
        except Exception as e:
            print(f"❌ Gemini model failed: {e}")
            self.gemini_model = None

        # Select primary model
        self.primary_model = self.openai_model or self.gemini_model
        if not self.primary_model:
            raise Exception("No AI models available")
            
    def setup_parsers(self):
        """Setup output parsers for structured responses"""
        # Main response parser
        self.response_parser = PydanticOutputParser(pydantic_object=AIResponse)
        
        # Job description parser
        self.job_parser = PydanticOutputParser(pydantic_object=JobDescription)
        
        # Retry parser for malformed responses
        self.retry_parser = RetryOutputParser.from_llm(
            parser=self.response_parser,
            llm=self.primary_model
        )
        self.job_retry_parser = RetryOutputParser.from_llm(
            parser=self.job_parser,
            llm=self.primary_model
        )
        
    def setup_prompts(self):
        """Setup prompt templates for different use cases with strict structured output"""
        # The parser will provide explicit JSON schema instructions
        # We'll inject them as {format_instructions} when invoking the chain

        # Main chat prompt
        self.chat_prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                """You are an expert resume writing assistant with deep knowledge of ATS optimization and professional resume standards.

CRITICAL RULES:
- Keep responses concise, direct, and actionable
- Each recommendation under 225 characters
- If user asks about a specific section, ONLY address that section
- Skills section must use the category: comma-separated format (no bullets)

CONTEXT:
- Prior conversation (most recent first):
{chat_history}
- Job description context (if present):
{job_description_context}

OUTPUT FORMAT (MANDATORY):
- You MUST output ONLY structured JSON that follows these instructions:
{format_instructions}

Context to use in your reasoning:
{resume_context}
""",
            ),
            ("user", "{user_message}")
        ])

        # Section analysis prompt
        self.section_prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                """You are a resume expert analyzing a specific section.

FOCUS:
- Only analyze and improve the provided section content
- Provide concise, actionable guidance; each recommendation under 225 chars

CONTEXT:
- Prior conversation (most recent first):
{chat_history}
- Job description context (if present):
{job_description_context}

OUTPUT FORMAT (MANDATORY):
- Output ONLY JSON per these instructions:
{format_instructions}

Resume context you may use:
{resume_context}
""",
            ),
            ("user", "Analyze this section: {section_content}\n\nUser question: {user_question}")
        ])

        # Job description analysis prompt
        self.job_prompt = ChatPromptTemplate.from_messages([
            ("system", "Extract key information from this job description:"),
            ("user", "{job_description}")
        ])

        # ATS optimization prompt
        self.ats_prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                """You are an ATS optimization expert.

Analyze the resume against the job description and suggest concise improvements.

OUTPUT FORMAT (MANDATORY):
- Output ONLY JSON per these instructions:
{format_instructions}

Job description:
{job_description}

Resume content:
{resume_content}
""",
            ),
            ("user", "Provide ATS-focused improvements only.")
        ])
        
    def get_resume_context(self, resume_data: Dict) -> str:
        """Build resume context for AI analysis - matches your current logic"""
        if not resume_data:
            return "No resume is currently open."
            
        context = f"RESUME: {resume_data.get('title', 'Untitled')}\n\n"
        
        if 'sections' in resume_data:
            for section in resume_data['sections']:
                content = section.get('content', {}).get('text', '')
                # Match your current logic - filter out default content
                if (content and content.strip() and 
                    'YOUR NAME' not in content and 
                    'Text (Lead with' not in content):
                    context += f"{section['title'].upper()}:\n{content}\n\n"
                    
        return context
        
    def detect_job_description(self, text: str) -> Dict:
        """Detect if text is a job description and parse it - matches your current logic"""
        if not text or len(text) < 50:
            return {"is_job_description": False, "parsed": None, "advice": None}
            
        job_keywords = [
            'job description', 'position', 'role', 'responsibilities', 'requirements',
            'qualifications', 'experience', 'skills', 'duties', 'minimum', 'preferred',
            'bachelor', 'degree', 'years of experience', 'salary', 'benefits'
        ]
        
        lower_text = text.lower()
        keyword_matches = sum(1 for keyword in job_keywords if keyword in lower_text)
        
        if keyword_matches >= 3:
            # Parse job description
            try:
                chain = self.job_prompt | self.primary_model | self.job_parser
                result = chain.invoke({"job_description": text})
                
                # Generate advice - matches your current logic
                advice_parts = []
                if result.skills:
                    advice_parts.append(f"Include these skills: {', '.join(result.skills[:5])}")
                if result.title:
                    advice_parts.append(f"Tailor experience for: {result.title}")
                if result.requirements:
                    advice_parts.append(f"Address requirements: {'; '.join(result.requirements[:3])}")
                    
                return {
                    "is_job_description": True,
                    "parsed": result.dict(),
                    "advice": ". ".join(advice_parts)
                }
            except Exception as e:
                print(f"Error parsing job description: {e}")
                return {"is_job_description": True, "parsed": None, "advice": "Job description detected but parsing failed."}
                
        return {"is_job_description": False, "parsed": None, "advice": None}
        
    def _get_user_ctx(self, user_id: Optional[str]) -> Dict[str, Any]:
        if not user_id:
            # Use a shared context for anonymous calls
            user_id = "__anon__"
        if user_id not in self.user_contexts:
            self.user_contexts[user_id] = {"job_description": None, "history": []}
        return self.user_contexts[user_id]

    def _format_job_description(self, jd: Optional[Dict[str, Any]]) -> str:
        if not jd:
            return ""
        try:
            title = jd.get("title") or ""
            company = jd.get("company") or ""
            skills = ", ".join(jd.get("skills", [])[:10])
            requirements = "; ".join(jd.get("requirements", [])[:5])
            location = jd.get("location") or ""
            parts = []
            if title:
                parts.append(f"Title: {title}")
            if company:
                parts.append(f"Company: {company}")
            if location:
                parts.append(f"Location: {location}")
            if skills:
                parts.append(f"Key Skills: {skills}")
            if requirements:
                parts.append(f"Requirements: {requirements}")
            return " | ".join(parts)
        except Exception:
            return ""

    def _build_history_text(self, history: List[Any], max_messages: int = 6) -> str:
        if not history:
            return ""
        recent = history[-max_messages:]
        lines = []
        for role, content in recent:
            lines.append(f"{role.title()}: {content}")
        return "\n".join(lines)

    def chat_with_ai(self, message: str, resume_data: Dict = None, user_id: Optional[str] = None) -> Dict:
        """Main chat function with per-user memory and JD context"""
        try:
            user_ctx = self._get_user_ctx(user_id)

            # Detect and store job description context, but do not early-return
            job_analysis = self.detect_job_description(message)
            if job_analysis["is_job_description"]:
                user_ctx["job_description"] = job_analysis["parsed"]
                # Also drop a system note into history for transparency
                user_ctx["history"].append(("system", f"Job description updated. Key points: {job_analysis['advice']}"))

            resume_context = self.get_resume_context(resume_data)
            # Maintain history
            user_ctx["history"].append(("user", message))
            chat_history_text = self._build_history_text(user_ctx["history"])            
            jd_context_text = self._format_job_description(user_ctx.get("job_description"))
            inputs = {
                "user_message": message,
                "resume_context": resume_context,
                "format_instructions": self.response_parser.get_format_instructions(),
                "chat_history": chat_history_text,
                "job_description_context": jd_context_text,
            }

            # Prefer OpenAI, then Gemini: manual invoke and parse
            prompt_value = self.chat_prompt.format_prompt(**inputs)
            for llm in [self.openai_model, self.gemini_model]:
                if not llm:
                    continue
                try:
                    response = llm.invoke(prompt_value.to_messages())
                    ai_text = response.content if hasattr(response, 'content') else str(response)
                    try:
                        parsed = self.response_parser.parse(ai_text)
                    except Exception:
                        parsed = self.retry_parser.parse_with_prompt(ai_text, prompt_value)
                    result = {
                        "message": parsed.message,
                        "edits": [e.dict() for e in parsed.edits]
                    }
                    # Append assistant response to history
                    user_ctx["history"].append(("assistant", result["message"]))
                    return result
                except Exception as e:
                    print(f"LLM failed, trying next: {e}")

            # If all models failed, return a safe fallback
            return self.generate_fallback_response(message)
        except Exception as e:
            print(f"Error in chat_with_ai: {e}")
            # Final safety fallback
            return self.generate_fallback_response(message)
    
    def parse_ai_response(self, ai_text: str) -> Dict:
        """Parse AI response manually - similar to your current aiUtils.js"""
        try:
            # Check if response seems truncated
            seems_truncated = (ai_text.endswith('{') or ai_text.endswith(',') or ai_text.endswith('[') or 
                              not ai_text.strip().endswith('}') or 
                              'incomplete' in ai_text.lower() or
                              'truncated' in ai_text.lower())
            
            if seems_truncated:
                return { 
                    "message": ai_text + "\n\n⚠️ Response was incomplete. Please try asking again for complete suggestions.", 
                    "edits": [] 
                }
            
            # Check for overly verbose responses
            import re
            message_without_json = re.sub(r"\{[\s\S]*\}", '', ai_text).strip()
            if len(message_without_json) > 1000:
                return {
                    "message": "Response was too verbose. Please provide more concise feedback.",
                    "edits": []
                }

            # Look for JSON pattern
            import re
            json_match = re.search(r'\{[^{}]*"edits"[^{}]*\}', ai_text)
            
            if json_match:
                json_string = json_match.group(0)
                
                # Validate JSON completeness
                open_braces = json_string.count('{')
                close_braces = json_string.count('}')
                open_brackets = json_string.count('[')
                close_brackets = json_string.count(']')
                
                if open_braces == close_braces and open_brackets == close_brackets:
                    try:
                        parsed = json.loads(json_string)
                        clean_message = ai_text.replace(json_string, '').strip()
                        return {
                            "message": clean_message,
                            "edits": parsed.get("edits", [])
                        }
                    except json.JSONDecodeError:
                        pass
            
            # If no structured edits found, return the message as-is
            return {
                "message": ai_text,
                "edits": []
            }
            
        except Exception as e:
            print(f"Error parsing AI response: {e}")
            return {
                "message": ai_text,
                "edits": []
            }
            
    def analyze_resume_section(self, section_content: str, user_question: str, resume_data: Dict = None, user_id: Optional[str] = None) -> Dict:
        """Analyze a specific resume section with strict structured output"""
        try:
            user_ctx = self._get_user_ctx(user_id)
            resume_context = self.get_resume_context(resume_data)
            chat_history_text = self._build_history_text(user_ctx["history"])            
            jd_context_text = self._format_job_description(user_ctx.get("job_description"))
            inputs = {
                "section_content": section_content,
                "user_question": user_question,
                "resume_context": resume_context,
                "format_instructions": self.response_parser.get_format_instructions(),
                "chat_history": chat_history_text,
                "job_description_context": jd_context_text,
            }

            prompt_value = self.section_prompt.format_prompt(**inputs)
            for llm in [self.openai_model, self.gemini_model]:
                if not llm:
                    continue
                try:
                    response = llm.invoke(prompt_value.to_messages())
                    ai_text = response.content if hasattr(response, 'content') else str(response)
                    try:
                        parsed = self.response_parser.parse(ai_text)
                    except Exception:
                        parsed = self.retry_parser.parse_with_prompt(ai_text, prompt_value)
                    result = {
                        "message": parsed.message,
                        "edits": [e.dict() for e in parsed.edits]
                    }
                    user_ctx["history"].append(("assistant", result["message"]))
                    return result
                except Exception as e:
                    print(f"Section analysis LLM failed, trying next: {e}")

            return self.generate_fallback_response(user_question)
        except Exception as e:
            print(f"Error in analyze_resume_section: {e}")
            return self.generate_fallback_response(user_question)
            
    def generate_ats_advice(self, resume_data: Dict, job_description: str = None, user_id: Optional[str] = None) -> Dict:
        """Generate ATS optimization advice (structured)"""
        try:
            user_ctx = self._get_user_ctx(user_id)
            resume_content = self.get_resume_context(resume_data)
            job_desc = job_description or "No specific job description provided"
            chat_history_text = self._build_history_text(user_ctx["history"])            
            jd_context_text = self._format_job_description(user_ctx.get("job_description"))

            inputs = {
                "resume_content": resume_content,
                "job_description": job_desc,
                "format_instructions": self.response_parser.get_format_instructions(),
                "chat_history": chat_history_text,
                "job_description_context": jd_context_text,
            }

            prompt_value = self.ats_prompt.format_prompt(**inputs)
            for llm in [self.openai_model, self.gemini_model]:
                if not llm:
                    continue
                try:
                    response = llm.invoke(prompt_value.to_messages())
                    ai_text = response.content if hasattr(response, 'content') else str(response)
                    try:
                        parsed = self.response_parser.parse(ai_text)
                    except Exception:
                        parsed = self.retry_parser.parse_with_prompt(ai_text, prompt_value)
                    result = {
                        "message": parsed.message,
                        "edits": [e.dict() for e in parsed.edits]
                    }
                    user_ctx["history"].append(("assistant", result["message"]))
                    return result
                except Exception as e:
                    print(f"ATS LLM failed, trying next: {e}")

            return self.generate_fallback_response("ATS optimization")
        except Exception as e:
            print(f"Error in generate_ats_advice: {e}")
            return self.generate_fallback_response("ATS optimization")
            
    def generate_fallback_response(self, message: str) -> Dict:
        """Generate fallback response when AI fails - matches your current logic"""
        responses = {
            'help': "I'd be happy to help you improve your resume! Here are some areas I can assist with:\n\n• Skills Section: Make your skills more specific and relevant\n• Experience Descriptions: Use strong action verbs and quantify achievements\n• ATS Optimization: Ensure your resume passes through Applicant Tracking Systems\n• Content Review: Check for clarity, conciseness, and impact\n\nWhat specific area would you like to focus on?",
            'skills': "For your skills section, consider:\n\n• Use Categories: Group skills by type (Languages, Skills, Tools, Frameworks)\n• Comma-Separated: List skills within each category with commas\n• Be Specific: Instead of 'Python', try 'Python, Django, Flask'\n• Match Job Requirements: Align skills with the job description\n• Format: Use 'Category: skill1, skill2, skill3' format",
            'experience': "To improve your experience descriptions:\n\n• Use Action Verbs: Start with strong verbs like 'Developed', 'Implemented', 'Led'\n• Quantify Achievements: Include numbers, percentages, and metrics\n• Focus on Results: Emphasize outcomes and impact\n• Use PAR Format: Problem, Action, Result",
            'ats': "For ATS optimization:\n\n• Use Standard Section Headers: 'Experience', 'Education', 'Skills'\n• Include Keywords: Match job description keywords\n• Simple Formatting: Avoid tables, graphics, or complex layouts\n• Clear Contact Info: Make sure it's easily readable\n• Consistent Formatting: Use standard fonts and bullet points",
            'default': "I'm here to help you create a professional resume! I can assist with:\n\n• Improving your skills section\n• Enhancing experience descriptions\n• Optimizing for ATS systems\n• Suggesting better action verbs\n• Reviewing overall content and structure\n\nWhat would you like to work on?"
        }
        
        lower_message = message.lower()
        if 'skill' in lower_message:
            response = responses['skills']
        elif 'experience' in lower_message or 'work' in lower_message:
            response = responses['experience']
        elif 'ats' in lower_message or 'tracking' in lower_message:
            response = responses['ats']
        elif 'help' in lower_message:
            response = responses['help']
        else:
            response = responses['default']
            
        return {
            "message": response,
            "edits": []
        }
        
    def get_service_status(self) -> Dict:
        """Get AI service status - matches your current format"""
        return {
            "available": self.primary_model is not None,
            "has_api_key": bool(
                os.getenv("OPENAI_API_KEY") or os.getenv("OPEN_AI_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("REACT_APP_GEMINI_API_KEY")
            ),
            "model": "OpenAI GPT-4" if self.openai_model else "Gemini" if self.gemini_model else "None",
            # Ephemeral memory status (aggregate, not per-user)
            "current_job_description": any(
                ctx.get("job_description") for ctx in self.user_contexts.values()
            ) if hasattr(self, "user_contexts") else False
        }

# Example usage functions for terminal testing
def test_basic_chat():
    """Test basic chat functionality"""
    ai_service = ResumeAIService()
    
    # Sample resume data
    resume_data = {
        "title": "Software Engineer Resume",
        "sections": [
            {
                "title": "Skills",
                "content": {"text": "Python, JavaScript, React"}
            },
            {
                "title": "Experience", 
                "content": {"text": "Software Engineer at Tech Corp (2020-2023)\n- Developed web applications\n- Led team of 3 developers"}
            }
        ]
    }
    
    result = ai_service.chat_with_ai("Help me improve my skills section", resume_data)
    print("=== Basic Chat Test ===")
    print(f"Message: {result['message']}")
    print(f"Edits: {json.dumps(result['edits'], indent=2)}")
    
def test_job_description():
    """Test job description detection"""
    ai_service = ResumeAIService()
    
    job_desc = """
    Senior Software Engineer
    Tech Company Inc.
    
    Requirements:
    - 5+ years experience in Python and JavaScript
    - Experience with React and Node.js
    - Bachelor's degree in Computer Science
    - Experience with AWS and cloud technologies
    
    Responsibilities:
    - Develop and maintain web applications
    - Lead technical projects
    - Mentor junior developers
    """
    
    result = ai_service.detect_job_description(job_desc)
    print("=== Job Description Test ===")
    print(f"Is job description: {result['is_job_description']}")
    print(f"Parsed: {json.dumps(result['parsed'], indent=2)}")
    print(f"Advice: {result['advice']}")
    
def test_section_analysis():
    """Test section analysis"""
    ai_service = ResumeAIService()
    
    section_content = "Python, JavaScript, React, Node.js"
    result = ai_service.analyze_resume_section(section_content, "How can I improve this skills section?")
    
    print("=== Section Analysis Test ===")
    print(f"Message: {result['message']}")
    print(f"Edits: {json.dumps(result['edits'], indent=2)}")
    
def test_ats_optimization():
    """Test ATS optimization"""
    ai_service = ResumeAIService()
    
    resume_data = {
        "title": "Software Engineer Resume",
        "sections": [
            {
                "title": "Skills",
                "content": {"text": "Python, JavaScript, React"}
            }
        ]
    }
    
    job_desc = "Looking for Python developer with React experience"
    result = ai_service.generate_ats_advice(resume_data, job_desc)
    
    print("=== ATS Optimization Test ===")
    print(f"Message: {result['message']}")
    print(f"Edits: {json.dumps(result['edits'], indent=2)}")

if __name__ == "__main__":
    print("🤖 Resume AI Service - LangChain Implementation")
    print("=" * 50)
    
    # Run all tests
    test_basic_chat()
    print("\n" + "=" * 50)
    
    test_job_description()
    print("\n" + "=" * 50)
    
    test_section_analysis()
    print("\n" + "=" * 50)
    
    test_ats_optimization()
    print("\n" + "=" * 50)
    
    # Show service status
    ai_service = ResumeAIService()
    status = ai_service.get_service_status()
    print("=== Service Status ===")
    print(json.dumps(status, indent=2))
