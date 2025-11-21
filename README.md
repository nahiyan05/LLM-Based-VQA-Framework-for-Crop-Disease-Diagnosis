# 🌱 Crop Disease Detection Assistant - Version 1.0

A comprehensive AI-powered crop disease detection system using computer vision and natural language processing.

## ✨ Features

### 🔍 **Image Analysis**

- **Crop Disease Detection**: Uses trained SwinV2 model to identify 88+ crop diseases
- **Image Captioning**: AI-powered descriptions using BLIP and ViT-GPT2 models
- **Multi-crop Support**: Apple, Corn, Tomato, Potato, Rice, Wheat, and many more

### 💬 **Q&A System**

- **Expert Consultation**: Ask questions about detected diseases
- **Treatment Advice**: Get recommendations for crop management
- **Fallback Responses**: Intelligent responses even without internet

### 🌍 **Multi-language Support**

- **English & Bengali**: Full interface and responses
- **Smart Translation**: Context-aware agricultural translations

### 🎨 **Modern Interface**

- **Drag & Drop Upload**: Easy image uploading
- **Real-time Analysis**: Instant disease detection
- **Responsive Design**: Works on desktop and mobile

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 16+
- OpenAI API key (optional - app works with fallback responses)

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python main.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📁 Project Structure

```
crop-disease-assistant/
├── backend/                 # FastAPI backend
│   ├── config/             # Configuration settings
│   ├── models/             # ML model loader
│   ├── services/           # Business logic
│   ├── swinv2_tiny_crop_disease/  # Trained model files
│   ├── main.py             # API server
│   └── requirements.txt    # Dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── component/      # UI components
│   │   └── utils/          # Utilities
│   ├── package.json        # Dependencies
│   └── .env               # Environment config
└── README.md              # This file
```

## 🔧 Configuration

### Backend Environment (.env)

```bash
OPENAI_API_KEY=your_openai_api_key_here  # Optional
```

### Frontend Environment (.env)

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_ENVIRONMENT=development
```

## 🎯 Usage

1. **Upload Image**: Drag and drop or select a crop image
2. **Get Analysis**: View disease detection and image description
3. **Ask Questions**: Get expert advice about the detected issues
4. **Switch Languages**: Toggle between English and Bengali
5. **View History**: See previous Q&A interactions

## 🧠 Models & AI

- **Disease Detection**: Custom-trained SwinV2 on 88 crop disease classes
- **Image Captioning**: Salesforce BLIP + ViT-GPT2 models
- **Q&A System**: OpenAI GPT-4 with agricultural expertise
- **Fallback System**: Local responses when API unavailable

## 🛡️ Features

### Without OpenAI API Key

- ✅ Full disease detection
- ✅ Image captioning
- ✅ Basic Q&A with intelligent fallback responses
- ✅ Language switching (limited translation)

### With OpenAI API Key

- ✅ All above features
- ✅ Advanced GPT-powered Q&A
- ✅ Intelligent translations
- ✅ Context-aware responses

## 📈 Version History

### Version 1.0 (Current)

- Complete crop disease detection system
- Multi-language support
- Q&A functionality with fallback
- Clean, deployment-ready codebase
- No database dependencies (stateless)

## 🔮 Future Enhancements

- Database integration for user history
- Mobile app version
- More crop types and diseases
- Weather integration
- Treatment tracking
- Community features

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Version 1.0** - A stable, feature-complete crop disease detection system ready for development and enhancement.
