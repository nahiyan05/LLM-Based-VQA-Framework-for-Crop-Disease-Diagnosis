"""
Model loader for all ML models used in the application
"""

import os
import torch
from PIL import Image
from transformers import (
    AutoImageProcessor, 
    AutoModelForImageClassification,
    BlipProcessor, 
    BlipForConditionalGeneration,
    VisionEncoderDecoderModel, 
    ViTImageProcessor, 
    AutoTokenizer
)
from torchvision import transforms
import asyncio

class ModelLoader:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🔧 Using device: {self.device}")
        
        # Model components
        self.crop_model = None
        self.crop_processor = None
        self.blip_model = None
        self.blip_processor = None
        self.vit_model = None
        self.vit_processor = None
        self.vit_tokenizer = None
        
        # Image transform
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
    
    async def load_models(self):
        """Load all required models"""
        print("📦 Loading models...")
        
        # Load crop disease classification model
        await self._load_crop_model()
        
        # Load captioning models
        await self._load_captioning_models()
        
        print("✅ All models loaded successfully!")
    
    async def _load_crop_model(self):
        """Load the trained SwinV2 crop disease model"""
        print("🌱 Loading crop disease classification model...")
        
        # Get model path from settings or use relative path
        try:
            from config.settings import get_settings
            settings = get_settings()
            model_path = settings.swin_model_path
        except:
            # Fallback to multiple possible paths
            possible_paths = [
                "./swinv2_tiny_crop_disease",
                "./backend/swinv2_tiny_crop_disease", 
                os.path.join(os.path.dirname(__file__), "..", "swinv2_tiny_crop_disease"),
                "/var/task/backend/swinv2_tiny_crop_disease"  # Vercel serverless path
            ]
            
            model_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    model_path = path
                    print(f"✅ Found model at: {model_path}")
                    break
            
            if not model_path:
                print(f"❌ Model not found in any of these paths: {possible_paths}")
                print(f"📁 Current working directory: {os.getcwd()}")
                print(f"📁 Available files: {os.listdir('.')}")
                raise FileNotFoundError("Trained model directory not found")
        
        if not os.path.exists(model_path):
            print(f"❌ Model path does not exist: {model_path}")
            print(f"📁 Current directory: {os.getcwd()}")
            raise FileNotFoundError(f"Model directory not found at {model_path}")
        
        # Check for required model files
        required_files = ["config.json", "model.safetensors"]
        missing_files = []
        
        for file in required_files:
            file_path = os.path.join(model_path, file)
            if not os.path.exists(file_path):
                missing_files.append(file)
        
        if missing_files:
            print(f"❌ CRITICAL: Missing trained model files: {missing_files}")
            print(f"📁 Current files in {model_path}: {os.listdir(model_path)}")
            print("🚨 The system will fall back to base model, which will give INCORRECT predictions!")
            print("� Solution: Please provide the trained model weights (model.safetensors)")
            
            # Fallback with clear warning
            await self._load_fallback_model(model_path)
            return
        
        try:
            # Load model and processor with your trained weights
            print("📦 Loading trained model weights...")
            
            self.crop_processor = AutoImageProcessor.from_pretrained(model_path)
            self.crop_model = AutoModelForImageClassification.from_pretrained(
                model_path,
                local_files_only=True,
                trust_remote_code=True
            )
            
            self.crop_model.to(self.device)
            self.crop_model.eval()
            
            print(f"✅ TRAINED crop model loaded successfully with {len(self.crop_model.config.id2label)} classes")
            print(f"📝 Sample classes: {list(self.crop_model.config.id2label.values())[:5]}")
            
        except Exception as e:
            print(f"❌ Error loading trained model: {e}")
            print("🔄 Falling back to base model...")
            await self._load_fallback_model(model_path)
    
    async def _load_fallback_model(self, model_path):
        """Load fallback model when trained weights are missing"""
        print("⚠️ WARNING: Using untrained base model - predictions will be INCORRECT!")
        
        try:
            # Load the custom config first
            import json
            config_path = os.path.join(model_path, "config.json")
            with open(config_path, "r") as f:
                config_data = json.load(f)
            
            # Use the base microsoft model but configure for crop classes
            from transformers import SwinConfig
            
            custom_config = SwinConfig.from_pretrained("microsoft/swin-tiny-patch4-window7-224")
            custom_config.num_labels = len(config_data["id2label"])
            custom_config.id2label = config_data["id2label"]
            custom_config.label2id = {v: k for k, v in config_data["id2label"].items()}
            
            self.crop_processor = AutoImageProcessor.from_pretrained("microsoft/swin-tiny-patch4-window7-224")
            self.crop_model = AutoModelForImageClassification.from_pretrained(
                "microsoft/swin-tiny-patch4-window7-224",
                config=custom_config,
                ignore_mismatched_sizes=True
            )
            
            self.crop_model.to(self.device)
            self.crop_model.eval()
            
            print("❌ FALLBACK model loaded - PREDICTIONS WILL BE RANDOM/INCORRECT!")
            print("📝 Configured classes:", list(self.crop_model.config.id2label.values())[:5])
            
        except Exception as e:
            print(f"❌ Even fallback model failed: {e}")
            raise e
    
    async def _load_captioning_models(self):
        """Load image captioning models with better progress tracking"""
        print("🖼️ Loading image captioning models...")
        
        try:
            # Load BLIP model with progress
            print("  - Loading BLIP model...")
            self.blip_processor = BlipProcessor.from_pretrained(
                "Salesforce/blip-image-captioning-large",
                resume_download=True,
                force_download=False
            )
            self.blip_model = BlipForConditionalGeneration.from_pretrained(
                "Salesforce/blip-image-captioning-large",
                resume_download=True,
                force_download=False
            ).to(self.device)
            print("    ✅ BLIP model loaded successfully!")
            
            # Load ViT-GPT2 model with progress
            print("  - Loading ViT-GPT2 model...")
            self.vit_model = VisionEncoderDecoderModel.from_pretrained(
                "nlpconnect/vit-gpt2-image-captioning",
                resume_download=True,
                force_download=False
            ).to(self.device)
            self.vit_processor = ViTImageProcessor.from_pretrained(
                "nlpconnect/vit-gpt2-image-captioning",
                resume_download=True,
                force_download=False
            )
            self.vit_tokenizer = AutoTokenizer.from_pretrained(
                "nlpconnect/vit-gpt2-image-captioning",
                resume_download=True,
                force_download=False
            )
            print("    ✅ ViT-GPT2 model loaded successfully!")
            
            print("✅ All captioning models loaded successfully!")
            
        except Exception as e:
            print(f"❌ Error loading captioning models: {e}")
            print("🔄 Trying alternative approach...")
            
            # Fallback to lighter models or skip captioning
            try:
                print("  - Loading lightweight alternatives...")
                # Use a smaller caption model as fallback
                self.blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
                self.blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base").to(self.device)
                
                # Skip ViT model for now
                self.vit_model = None
                self.vit_processor = None
                self.vit_tokenizer = None
                
                print("✅ Lightweight captioning model loaded!")
                
            except Exception as e2:
                print(f"❌ Fallback also failed: {e2}")
                print("⚠️ Running without captioning models (will use mock captions)")
                
                # Set all to None - we'll handle this in the caption generation
                self.blip_model = None
                self.blip_processor = None
                self.vit_model = None
                self.vit_processor = None
                self.vit_tokenizer = None
    
    def generate_blip_caption(self, image: Image.Image) -> str:
        """Generate caption using BLIP model"""
        if self.blip_model is None or self.blip_processor is None:
            return "Image shows agricultural crop for disease analysis"
        
        try:
            inputs = self.blip_processor(image, return_tensors="pt").to(self.device)
            with torch.no_grad():
                out = self.blip_model.generate(**inputs, max_length=50)
            return self.blip_processor.decode(out[0], skip_special_tokens=True)
        except Exception as e:
            print(f"Error in BLIP caption generation: {e}")
            return "Agricultural crop image for disease detection"
    
    def generate_vit_caption(self, image: Image.Image) -> str:
        """Generate caption using ViT-GPT2 model"""
        if self.vit_model is None or self.vit_processor is None or self.vit_tokenizer is None:
            return "Crop plant with potential disease symptoms visible"
        
        try:
            pixel_values = self.vit_processor(images=image, return_tensors="pt").pixel_values.to(self.device)
            with torch.no_grad():
                out = self.vit_model.generate(pixel_values, max_length=50)
            return self.vit_tokenizer.decode(out[0], skip_special_tokens=True)
        except Exception as e:
            print(f"Error in ViT caption generation: {e}")
            return "Plant leaf showing characteristics for agricultural analysis"
    
    def predict_crop_and_disease(self, image: Image.Image) -> tuple:
        """Predict crop type and disease from image"""
        
        if self.crop_model is None:
            raise Exception("Model not loaded properly")
        
        # Check if we're using the fallback model
        is_trained_model = hasattr(self.crop_model, '_is_trained_model')
        if not is_trained_model:
            # Check if this is likely a fallback by examining the model's base config
            model_name = getattr(self.crop_model.config, '_name_or_path', '')
            if 'microsoft/swin-tiny-patch4-window7-224' in model_name:
                print("⚠️ WARNING: Using untrained base model - prediction will be unreliable!")
        
        try:
            # Preprocess image
            img_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Get prediction
            with torch.no_grad():
                outputs = self.crop_model(img_tensor)
                predicted_idx = torch.argmax(outputs.logits, dim=1).item()
                confidence = torch.softmax(outputs.logits, dim=1).max().item()
                
                # Debug: Print the predicted index and available labels
                print(f"🔍 Predicted index: {predicted_idx}")
                print(f"🔍 Confidence: {confidence:.3f}")
                print(f"🔍 Available labels count: {len(self.crop_model.config.id2label)}")
                
                # Check if using untrained model
                if 'microsoft/swin-tiny-patch4-window7-224' in model_name:
                    print("❌ CRITICAL: Prediction made with UNTRAINED model - result is meaningless!")
                    print("🔧 SOLUTION: Please provide trained model weights (model.safetensors)")
                
                # Safely get the class name
                if predicted_idx in self.crop_model.config.id2label:
                    class_name = self.crop_model.config.id2label[predicted_idx]
                    print(f"🔍 Predicted class: {class_name}")
                else:
                    print(f"❌ Index {predicted_idx} not found in labels")
                    # Use a default classification
                    class_name = "Unknown/Disease"
            
            # Split crop/disease
            if "/" in class_name:
                crop_name, disease_name = class_name.split("/", 1)
            else:
                crop_name, disease_name = class_name, "Healthy"
            
            # Clean up any problematic class names
            if ".ipynb_checkpoints" in disease_name:
                disease_name = "Healthy"
            
            print(f"✅ Final result: {crop_name.strip()} / {disease_name.strip()}")
            
            # Add warning for untrained model results
            if 'microsoft/swin-tiny-patch4-window7-224' in model_name:
                crop_name = f"[UNTRAINED] {crop_name.strip()}"
                disease_name = f"[UNTRAINED] {disease_name.strip()}"
            
            return crop_name.strip(), disease_name.strip()
            
        except Exception as e:
            print(f"❌ Error in prediction: {str(e)}")
            print(f"❌ Error type: {type(e).__name__}")
            import traceback
            print(f"❌ Full traceback: {traceback.format_exc()}")
            raise e
