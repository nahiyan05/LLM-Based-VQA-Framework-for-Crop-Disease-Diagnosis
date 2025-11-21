// Multilingual text constants
export const translations = {
  en: {
    header: {
      title: "🌱 Crop Disease Assistant",
    },
    upload: {
      title: "📤 Upload Crop Image",
      dragAndDrop: "Drag and drop an image here, or click to select",
      selectImage: "Select Image",
      uploading: "Uploading...",
      supportedFormats: "Supported formats: JPG, PNG, GIF",
    },
    analysis: {
      processing: "Processing your image...",
      analyzing: "Analyzing crop condition and identifying potential diseases",
      complete: "✅ Analysis Complete! Results are ready.",
      imageCaption: "📝 Image Caption",
      cropIdentified: "🌱 Crop Identified",
      diseaseDetected: "🦠 Disease Detected",
    },
    questions: {
      title: "Ask Questions",
      placeholder: "Ask about this crop, disease, treatment, etc...",
      askButton: "Ask",
      gettingAnswer: "Getting answer...",
    },
    history: {
      title: "📚 Question & Answer History",
    },
    translation: {
      translating: "Translating content...",
    },
    language: "Language",
    imageAnalysis: "Image Analysis",
    askQuestion: "Ask Question",
    analysisResults: "Analysis Results",
    qaHistory: "Q&A History",
  },
  bn: {
    header: {
      title: "🌱 ফসলের রোগ সহায়ক",
    },
    upload: {
      title: "📤 ফসলের ছবি আপলোড করুন",
      dragAndDrop:
        "এখানে একটি ছবি টেনে এনে ছাড়ুন, অথবা নির্বাচন করতে ক্লিক করুন",
      selectImage: "ছবি নির্বাচন করুন",
      uploading: "আপলোড হচ্ছে...",
      supportedFormats: "সমর্থিত ফরম্যাট: JPG, PNG, GIF",
    },
    analysis: {
      processing: "আপনার ছবি প্রক্রিয়াকরণ করা হচ্ছে...",
      analyzing: "ফসলের অবস্থা বিশ্লেষণ এবং সম্ভাব্য রোগ সনাক্তকরণ",
      complete: "✅ বিশ্লেষণ সম্পূর্ণ! ফলাফল প্রস্তুত।",
      imageCaption: "📝 ছবির বিবরণ",
      cropIdentified: "🌱 সনাক্তকৃত ফসল",
      diseaseDetected: "🦠 শনাক্তকৃত রোগ",
    },
    questions: {
      title: "প্রশ্ন করুন",
      placeholder: "এই ফসল, রোগ, চিকিৎসা ইত্যাদি সম্পর্কে জিজ্ঞাসা করুন...",
      askButton: "জিজ্ঞাসা করুন",
      gettingAnswer: "উত্তর পাওয়া হচ্ছে...",
    },
    history: {
      title: "📚 প্রশ্ন ও উত্তরের ইতিহাস",
    },
    translation: {
      translating: "কন্টেন্ট অনুবাদ করা হচ্ছে...",
    },
    language: "ভাষা",
    imageAnalysis: "ছবি বিশ্লেষণ",
    askQuestion: "প্রশ্ন করুন",
    analysisResults: "বিশ্লেষণের ফলাফল",
    qaHistory: "প্রশ্ন ও উত্তরের ইতিহাস",
  },
};

export const getTranslation = (language, key) => {
  const keys = key.split(".");
  let value = translations[language] || translations.en;

  for (const k of keys) {
    value = value[k];
    if (!value) break;
  }

  return value || key;
};
