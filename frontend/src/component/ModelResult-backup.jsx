import React, { useState } f      title: language === "bn" ? "ছবির বিবরণ" : "Image Caption",
      icon: "🔍",m "react";
import { getTranslation } from "../utils/translations";

export default function ModelResult({ result, language = "en" }) {
  const [hoveredCard, setHoveredCard] = useState(null);

  if (!result) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3 opacity-50">🔬</div>
        <p className="text-gray-600 mb-2">
          {language === "bn"
            ? "ছবি আপলোড করুন এবং বিশ্লেষণের জন্য অপেক্ষা করুন"
            : "Upload an image and wait for analysis"}
        </p>
        <p className="text-gray-500 text-sm">
          {language === "bn"
            ? "আমাদের AI আপনার ফসলের স্বাস্থ্য বিশ্লেষণ করবে"
            : "Our AI will analyze your crop's health"}
        </p>
      </div>
    );
  }

  const resultCards = [
    {
      id: "caption",
      data: result.caption,
      title: getTranslation(language, "analysis.imageCaption"),
      icon: "�",
      gradient: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-500",
    },
    {
      id: "crop",
      data: result.crop,
      title: getTranslation(language, "analysis.cropIdentified"),
      icon: "🌱",
      gradient: "from-green-500 to-emerald-600",
      bgColor: "bg-green-500",
    },
    {
      id: "disease",
      data: result.disease,
      title: getTranslation(language, "analysis.diseaseDetected"),
      icon: "🦠",
      gradient: "from-red-500 to-pink-600",
      bgColor: "bg-red-500",
    },
  ].filter((card) => card.data);

  if (resultCards.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Success notification */}
      <div className="text-center mb-6 fade-in-scale">
        <div className="inline-flex items-center space-x-2 bg-green-500 bg-opacity-20 backdrop-blur-sm rounded-full px-4 py-2 text-white border border-green-400 border-opacity-30">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
          <span className="text-sm font-medium">
            {language === "bn" ? "বিশ্লেষণ সম্পূর্ণ" : "Analysis Complete"}
          </span>
        </div>
      </div>

      {/* Result Cards */}
      <div className="space-y-3">
        {resultCards.map((card, index) => (
          <div
            key={card.id}
            className={`group bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 rounded-xl p-4 transition-all duration-300 cursor-pointer stagger-item ${
              hoveredCard === card.id
                ? "transform scale-[1.02] shadow-2xl bg-opacity-20"
                : "hover:bg-opacity-15"
            }`}
            onMouseEnter={() => setHoveredCard(card.id)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start space-x-4">
              <div
                className={`flex-shrink-0 w-12 h-12 bg-gradient-to-r ${card.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
              >
                <span className="text-2xl">{card.icon}</span>
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white mb-2 flex items-center">
                  {card.title}
                  {hoveredCard === card.id && (
                    <div className="ml-2 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </h4>
                <p className="text-white text-opacity-90 leading-relaxed">
                  {card.data}
                </p>
              </div>

              {/* Copy button */}
              <button
                onClick={() => navigator.clipboard.writeText(card.data)}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 text-white text-opacity-60 hover:text-opacity-100 hover:bg-white hover:bg-opacity-10 rounded-lg"
                title={language === "bn" ? "কপি করুন" : "Copy"}
              >
                📋
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Additional info */}
      <div className="text-center mt-6">
        <p className="text-white text-opacity-50 text-xs">
          {language === "bn"
            ? "আরো জানতে প্রশ্ন করুন"
            : "Ask questions to learn more"}
        </p>
      </div>
    </div>
  );
}
