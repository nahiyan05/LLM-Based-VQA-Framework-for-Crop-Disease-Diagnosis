"""
Configuration settings for the backend application
"""

import os
import torch
from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # OpenAI Configuration
    openai_api_key: str = ""
    
    # Model Paths
    swin_model_path: str = os.path.join(os.path.dirname(__file__), "..", "swinv2_tiny_crop_disease")
    
    # API Configuration
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_image_extensions: list = [".jpg", ".jpeg", ".png", ".bmp", ".tiff"]
    
    # Device Configuration  
    device: str = "cuda" if torch.cuda.is_available() else "cpu"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.openai_api_key:
            print("⚠️ WARNING: No OpenAI API key found. Q&A and translation features will use fallback responses.")
            print("📝 To enable full features, set OPENAI_API_KEY in your .env file")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra fields from .env

@lru_cache()
def get_settings():
    return Settings()
