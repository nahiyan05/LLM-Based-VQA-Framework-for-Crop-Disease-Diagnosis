"""
OpenAI service for handling GPT questions and translation
"""

import asyncio
from typing import Optional, Dict, Any
from openai import OpenAI

class OpenAIService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = None
        
        if api_key and api_key.strip():
            try:
                self.client = OpenAI(api_key=api_key)
                # Test the API key with a simple request
                self._test_api_key()
            except Exception as e:
                print(f"⚠️ OpenAI API key validation failed: {e}")
                print("🔄 Running in fallback mode without OpenAI features")
                self.client = None
        else:
            print("⚠️ No OpenAI API key provided. Running in fallback mode.")
    
    def _test_api_key(self):
        """Test if the API key is valid"""
        try:
            # Make a minimal test request
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": "test"}],
                max_tokens=1
            )
            print("✅ OpenAI API key validated successfully")
        except Exception as e:
            print(f"❌ OpenAI API key test failed: {e}")
            raise e
    
    async def ask_question(self, question: str, context: Optional[str] = None, language: str = "en") -> str:
        """
        Ask a question using GPT with optional context and language preference
        """
        if not self.client:
            # Fallback response when OpenAI is not available
            return self._get_fallback_response(question, context, language)
        
        try:
            # Build the prompt
            if context:
                full_prompt = f"Context: {context}\n\nQuestion: {question}"
            else:
                full_prompt = question
            
            # Determine system message based on language
            if language == "bn":
                system_content = (
                    "You are an agricultural assistant that helps farmers with crop disease questions. "
                    "ALWAYS respond in Bengali (বাংলা). If the question is in English, understand it but respond in Bengali. "
                    "Keep answers CONCISE and TO THE POINT: "
                    "- Maximum 2-3 short sentences "
                    "- Start with direct answer "
                    "- Include only essential treatment/prevention steps "
                    "- Avoid lengthy explanations "
                    "- Use simple, clear language "
                    "IMPORTANT: Do NOT use any markdown formatting like **bold** or *italic*. Use plain text only."
                )
            else:
                system_content = (
                    "You are an agricultural assistant that helps farmers with crop disease questions. "
                    "Keep answers CONCISE and TO THE POINT: "
                    "- Maximum 2-3 short sentences "
                    "- Start with direct answer "
                    "- Include only essential treatment/prevention steps "
                    "- Avoid lengthy explanations "
                    "- Use simple, clear language "
                    "IMPORTANT: Do NOT use any markdown formatting like **bold** or *italic*. Use plain text only."
                )
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system", 
                        "content": system_content
                    },
                    {
                        "role": "user", 
                        "content": full_prompt
                    }
                ],
                max_tokens=150,  # Reduced for more concise responses
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            raise Exception(f"Failed to get GPT response: {str(e)}")

    async def translate_text(self, text: str, target_language: str) -> str:
        """
        Translate text to target language
        """
        if not self.client:
            # Simple fallback - return original text
            return text
        
        try:
            if target_language == "bn":
                system_content = (
                    "You are a professional translator. Translate the given text to Bengali (বাংলা). "
                    "Maintain the original meaning and context. If it's about agriculture, use appropriate Bengali agricultural terms."
                )
            else:
                system_content = (
                    "You are a professional translator. Translate the given text to English. "
                    "Maintain the original meaning and context. If it's about agriculture, use appropriate English agricultural terms."
                )
            
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": system_content
                    },
                    {
                        "role": "user",
                        "content": f"Translate this text: {text}"
                    }
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            raise Exception(f"Failed to translate text: {str(e)}")

    async def format_analysis_response(self, analysis_result: Dict[str, Any], language: str = "en") -> Dict[str, Any]:
        """
        Format analysis response to be more readable and structured
        """
        if not self.client:
            # Return original result when OpenAI is not available
            return analysis_result
        
        try:
            formatted_result = {}
            
            for key, value in analysis_result.items():
                if value and isinstance(value, str):
                    if key == "caption":
                        # Enhance caption with better structure
                        prompt = f"Rewrite this image caption to be more descriptive and farmer-friendly: '{value}'"
                        if language == "bn":
                            prompt += " Respond in Bengali (বাংলা)."
                        
                        formatted_result[key] = await self._get_formatted_response(prompt, language)
                    else:
                        formatted_result[key] = value
                else:
                    formatted_result[key] = value
            
            return formatted_result
            
        except Exception as e:
            # Return original result if formatting fails
            return analysis_result

    async def _get_formatted_response(self, prompt: str, language: str = "en") -> str:
        """
        Helper method to get formatted response from GPT
        """
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that improves text clarity and readability for farmers."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=150,
                temperature=0.5
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception:
            # Return original prompt if formatting fails
            return prompt.split("'")[1] if "'" in prompt else prompt

    async def translate_analysis_result(self, result: Dict[str, Any], target_language: str) -> Dict[str, Any]:
        """
        Translate analysis result (caption, crop, disease) to target language
        """
        try:
            translated_result = {}
            
            for key, value in result.items():
                if value and isinstance(value, str):
                    translated_result[key] = await self.translate_text(value, target_language)
                else:
                    translated_result[key] = value
            
            return translated_result
            
        except Exception as e:
            raise Exception(f"Failed to translate analysis result: {str(e)}")

    async def ask_question_with_consistency(self, question: str, context: Optional[str] = None, language: str = "en") -> str:
        """
        Ask a question ensuring consistent responses across languages by generating in English first, then translating
        """
        try:
            # Always generate the response in English first for consistency
            english_answer = await self.ask_question(question, context, "en")
            
            # If Bengali is requested, translate the English answer
            if language == "bn":
                return await self.translate_text(english_answer, "bn")
            else:
                return english_answer
                
        except Exception as e:
            # Fallback to original method
            return await self.ask_question(question, context, language)

    def _get_fallback_response(self, question: str, context: Optional[str] = None, language: str = "en") -> str:
        """
        Provide fallback responses when OpenAI is not available
        """
        # Common agricultural responses based on question patterns
        question_lower = question.lower()
        
        fallback_responses = {
            "en": {
                "treatment": "For treatment, consult with a local agricultural expert or extension officer. Consider using approved fungicides or pesticides as recommended for your specific crop and disease.",
                "prevention": "Prevention methods include proper crop rotation, adequate spacing between plants, avoiding overhead watering, and maintaining good field hygiene.",
                "fertilizer": "Use balanced NPK fertilizers according to soil test recommendations. Organic compost can also improve soil health and plant resistance.",
                "watering": "Water early morning or late evening. Avoid wetting the leaves to prevent fungal diseases. Ensure good drainage to prevent waterlogging.",
                "harvest": "Harvest when the crop reaches maturity. Check for proper color, firmness, and size indicators specific to your crop variety.",
                "default": "I recommend consulting with a local agricultural extension officer or plant pathologist for specific guidance on your crop issue. They can provide tailored advice based on your local conditions."
            },
            "bn": {
                "treatment": "চিকিৎসার জন্য স্থানীয় কৃষি বিশেষজ্ঞ বা সম্প্রসারণ কর্মকর্তার সাথে পরামর্শ করুন। আপনার নির্দিষ্ট ফসল ও রোগের জন্য অনুমোদিত ছত্রাকনাশক বা কীটনাশক ব্যবহার করুন।",
                "prevention": "প্রতিরোধের উপায়গুলির মধ্যে রয়েছে সঠিক ফসল আবর্তন, গাছের মধ্যে পর্যাপ্ত দূরত্ব, মাথার উপর পানি দেওয়া এড়ানো এবং ক্ষেতের ভাল পরিচ্ছন্নতা বজায় রাখা।",
                "fertilizer": "মাটি পরীক্ষার সুপারিশ অনুযায়ী সুষম NPK সার ব্যবহার করুন। জৈব কম্পোস্ট মাটির স্বাস্থ্য ও গাছের প্রতিরোধ ক্ষমতা বৃদ্ধি করতে পারে।",
                "watering": "ভোর বেলা বা সন্ধ্যার পর পানি দিন। ছত্রাক রোগ প্রতিরোধের জন্য পাতা ভেজানো এড়িয়ে চলুন। জল জমা রোধের জন্য ভাল নিষ্কাশনের ব্যবস্থা নিশ্চিত করুন।",
                "harvest": "ফসল পরিপক্ক হলে সংগ্রহ করুন। আপনার ফসলের জাতের জন্য নির্দিষ্ট রঙ, দৃঢ়তা এবং আকারের সূচকগুলি পরীক্ষা করুন।",
                "default": "আপনার ফসলের সমস্যার জন্য নির্দিষ্ট নির্দেশনার জন্য একজন স্থানীয় কৃষি সম্প্রসারণ কর্মকর্তা বা উদ্ভিদ রোগবিদের সাথে পরামর্শ করার পরামর্শ দিচ্ছি। তারা আপনার স্থানীয় পরিস্থিতির উপর ভিত্তি করে উপযুক্ত পরামর্শ প্রদান করতে পারেন।"
            }
        }
        
        responses = fallback_responses.get(language, fallback_responses["en"])
        
        # Try to match question patterns
        for keyword in ["treat", "cure", "medicine", "spray", "fungicide"]:
            if keyword in question_lower:
                return responses["treatment"]
        
        for keyword in ["prevent", "avoid", "stop", "control"]:
            if keyword in question_lower:
                return responses["prevention"]
        
        for keyword in ["fertilizer", "nutrition", "nutrient", "feed"]:
            if keyword in question_lower:
                return responses["fertilizer"]
        
        for keyword in ["water", "irrigat", "wet"]:
            if keyword in question_lower:
                return responses["watering"]
        
        for keyword in ["harvest", "pick", "collect", "when"]:
            if keyword in question_lower:
                return responses["harvest"]
        
        return responses["default"]
