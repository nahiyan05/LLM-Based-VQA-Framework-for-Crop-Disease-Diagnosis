"""
FastAPI Backend for ML Crop Disease Detection
Provides image analysis with caption, crop identification, and disease detection
"""

import os
import json
import tempfile
from typing import Optional
from pathlib import Path

import torch
from PIL import Image
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import model utilities
from models.model_loader import ModelLoader
from services.prediction_service import PredictionService
from services.openai_service import OpenAIService
from config.settings import get_settings

# Initialize FastAPI app
app = FastAPI(
    title="Crop Disease Detection API",
    description="ML-powered crop disease detection with image captioning and Q&A",
    version="1.0.0"
)

# Configure CORS - Production ready
allowed_origins = [
    "http://localhost:5173", 
    "http://localhost:3000",
    "http://localhost:5174",  # Added for current dev setup
    "http://localhost:5175",  # Added for current dev setup
]

# Add production origins from environment
if os.getenv("ALLOWED_ORIGINS"):
    production_origins = os.getenv("ALLOWED_ORIGINS").split(",")
    allowed_origins.extend([origin.strip() for origin in production_origins])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global services
model_loader = None
prediction_service = None
openai_service = None

# Response models
class AnalysisResponse(BaseModel):
    caption: str
    crop: str
    disease: str

class QuestionResponse(BaseModel):
    answer: str

class TranslationRequest(BaseModel):
    text: str
    target_language: str

@app.on_event("startup")
async def startup_event():
    """Initialize models and services on startup"""
    global model_loader, prediction_service, openai_service
    
    print("🚀 Starting up Crop Disease Detection API...")
    
    try:
        # Load settings
        settings = get_settings()
        
        # Initialize model loader
        model_loader = ModelLoader()
        await model_loader.load_models()
        
        # Initialize services
        prediction_service = PredictionService(model_loader)
        openai_service = OpenAIService(settings.openai_api_key)
        
        print("✅ All models and services loaded successfully!")
        
    except Exception as e:
        print(f"❌ Error during startup: {e}")
        raise e

# Health check endpoint for production monitoring
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    status = {
        "status": "healthy",
        "services": {
            "model_loader": model_loader is not None,
            "prediction_service": prediction_service is not None,
            "openai_service": openai_service is not None
        },
        "environment": os.getenv("ENVIRONMENT", "development")
    }
    return status

# Root endpoint with API information
@app.get("/")
async def root():
    """API information and available endpoints"""
    return {
        "message": "Crop Disease Detection API",
        "status": "running",
        "endpoints": {
            "upload": "/upload-image/",
            "diagnose": "/diagnose/", 
            "ask": "/ask/",
            "translate": "/translate/",
            "translate-result": "/translate-result/"
        },
        "supported_languages": ["en", "bn"]
    }

@app.post("/upload-image/", response_model=AnalysisResponse)
async def upload_image(
    file: UploadFile = File(...),
    language: str = Form("en")
):
    """
    Basic image analysis endpoint - returns caption, crop, and disease
    Supports language parameter: "en" for English, "bn" for Bengali
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        # Get predictions
        result = await prediction_service.analyze_image(tmp_file_path)
        
        # Translate if Bengali is requested
        if language == "bn":
            result = await openai_service.translate_analysis_result(result, "bn")
        
        # Clean up temp file
        os.unlink(tmp_file_path)
        
        return AnalysisResponse(**result)
        
    except Exception as e:
        # Clean up temp file if it exists
        if 'tmp_file_path' in locals():
            try:
                os.unlink(tmp_file_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

@app.post("/diagnose/", response_model=AnalysisResponse)
async def diagnose_image(
    file: UploadFile = File(...),
    language: str = Form("en")
):
    """
    Enhanced diagnosis endpoint - same as upload-image but can be extended
    Supports language parameter: "en" for English, "bn" for Bengali
    """
    return await upload_image(file, language)

@app.post("/ask/", response_model=QuestionResponse)
async def ask_question(
    question: str = Form(...),
    context: Optional[str] = Form(None),
    language: str = Form("en")
):
    """
    Ask questions about the analyzed image using GPT
    Supports both Bengali and English questions and responses
    """
    if not question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    try:
        answer = await openai_service.ask_question_with_consistency(question, context, language)
        return QuestionResponse(answer=answer)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get answer: {str(e)}")

@app.post("/translate/", response_model=dict)
async def translate_text(
    text: str = Form(...),
    target_language: str = Form(...)
):
    """
    Translate text to target language
    Supports "en" for English and "bn" for Bengali
    """
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    if target_language not in ["en", "bn"]:
        raise HTTPException(status_code=400, detail="Supported languages: en, bn")
    
    try:
        translated_text = await openai_service.translate_text(text, target_language)
        return {"translated_text": translated_text}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

@app.post("/translate-result/", response_model=AnalysisResponse)
async def translate_analysis_result(
    caption: str = Form(...),
    crop: str = Form(...),
    disease: str = Form(...),
    target_language: str = Form(...)
):
    """
    Translate existing analysis result to target language
    """
    if target_language not in ["en", "bn"]:
        raise HTTPException(status_code=400, detail="Supported languages: en, bn")
    
    try:
        result = {"caption": caption, "crop": crop, "disease": disease}
        translated_result = await openai_service.translate_analysis_result(result, target_language)
        return AnalysisResponse(**translated_result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
