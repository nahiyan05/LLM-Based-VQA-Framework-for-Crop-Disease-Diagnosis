"""
Prediction service for handling image analysis
"""

import asyncio
from PIL import Image
from typing import Dict, Any
from models.model_loader import ModelLoader

class PredictionService:
    def __init__(self, model_loader: ModelLoader):
        self.model_loader = model_loader
    
    async def analyze_image(self, image_path: str) -> Dict[str, Any]:
        """
        Analyze image and return caption, crop, and disease
        """
        try:
            # Load and process image
            image = Image.open(image_path).convert("RGB")
            
            # Get crop and disease prediction
            crop_name, disease_name = self.model_loader.predict_crop_and_disease(image)
            
            # Generate captions
            blip_caption = self.model_loader.generate_blip_caption(image)
            # vit_caption = self.model_loader.generate_vit_caption(image)
            
            # Merge captions intelligently
            merged_caption = self._merge_captions(blip_caption, "")
            
            return {
                "caption": merged_caption,
                "crop": crop_name,
                "disease": disease_name
            }
            
        except Exception as e:
            raise Exception(f"Image analysis failed: {str(e)}")
    
    def _merge_captions(self, blip_caption: str, vit_caption: str) -> str:
        """
        Intelligently merge two captions
        """
        # Clean up the captions
        blip_clean = blip_caption.strip()
        vit_clean = vit_caption.strip()
        
        # If one is significantly longer, prefer it
        if len(blip_clean) > len(vit_clean) * 1.5:
            return blip_clean
        elif len(vit_clean) > len(blip_clean) * 1.5:
            return vit_clean
        
        # If similar length, combine them intelligently
        if blip_clean.lower() == vit_clean.lower():
            return blip_clean
        
        # Combine with more context
        return f"{blip_clean}. {vit_clean}"
