# Crop Disease Detection Backend

A FastAPI-based backend for crop disease detection using SwinV2 transformer model with image captioning and GPT-powered Q&A.

## Features

- 🌱 **Crop Disease Classification**: Identifies crop types and diseases using trained SwinV2 model
- 📝 **Image Captioning**: Generates descriptive captions using BLIP and ViT-GPT2 models
- 💬 **AI-Powered Q&A**: Answer questions about detected diseases using OpenAI GPT
- 🚀 **FastAPI**: High-performance async API with automatic documentation
- 🔧 **Easy Setup**: Simple configuration and deployment

## Project Structure

```
backend/
├── main.py                     # FastAPI application entry point
├── requirements.txt            # Python dependencies
├── .env                       # Environment variables
├── .env.example              # Environment variables template
├── config/
│   ├── __init__.py
│   └── settings.py           # Application settings
├── models/
│   ├── __init__.py
│   └── model_loader.py       # ML model loading and inference
├── services/
│   ├── __init__.py
│   ├── prediction_service.py # Image analysis service
│   └── openai_service.py     # GPT integration service
└── swinv2_tiny_crop_disease/ # Your trained model files
    ├── config.json
    ├── model.safetensors
    └── preprocessor_config.json
```

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Copy the example environment file and add your OpenAI API key:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```
OPENAI_API_KEY=your_actual_openai_api_key_here
CUDA_AVAILABLE=true
```

### 3. Run the Server

```bash
python main.py
```

Or using uvicorn directly:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at:

- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Alternative docs**: http://localhost:8000/redoc

## API Endpoints

### POST /upload-image/

Upload an image for analysis.

**Request**: Multipart form data with image file
**Response**:

```json
{
  "caption": "A close-up image of tomato leaves showing brown spots",
  "crop": "Tomato",
  "disease": "Leaf Blight"
}
```

### POST /diagnose/

Same as upload-image (alternative endpoint for frontend compatibility).

### POST /ask/

Ask questions about the analyzed image.

**Request**: Form data with `question` and optional `context`
**Response**:

```json
{
  "answer": "Leaf blight in tomatoes can be treated with copper-based fungicides..."
}
```

### GET /

Health check and API information.

## Model Information

The backend uses three main models:

1. **SwinV2 Crop Disease Model**: Your custom-trained model for crop/disease classification
2. **BLIP**: Salesforce's image captioning model
3. **ViT-GPT2**: Vision Transformer + GPT2 for image captioning
4. **GPT-4o-mini**: OpenAI's model for answering questions

## Frontend Integration

This backend is designed to work with the React frontend. The API endpoints match the expected calls from the frontend:

- Frontend calls `/diagnose/` or `/upload-image/` for image analysis
- Frontend calls `/ask/` for questions about the results
- CORS is configured to allow frontend connections

## Development

### Adding New Features

1. **New Models**: Add model loading logic in `models/model_loader.py`
2. **New Services**: Create service classes in `services/`
3. **New Endpoints**: Add endpoints in `main.py`
4. **Configuration**: Update settings in `config/settings.py`

### Error Handling

The API includes comprehensive error handling:

- Invalid file types
- Model loading errors
- OpenAI API errors
- General server errors

### Logging

The application includes structured logging for debugging and monitoring.

## Deployment

For production deployment:

1. Set `reload=False` in `main.py`
2. Use a production ASGI server like Gunicorn
3. Set up proper environment variables
4. Configure reverse proxy (nginx)
5. Use Docker for containerization

## Dependencies

Key dependencies:

- **FastAPI**: Modern, fast web framework
- **PyTorch**: Deep learning framework
- **Transformers**: Hugging Face model library
- **OpenAI**: GPT API client
- **Pillow**: Image processing
- **Uvicorn**: ASGI server
