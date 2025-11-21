import React, { useState } from "react";
import { getTranslation } from "../utils/translations";

export default function LanguageSelector({
  currentLanguage,
  onLanguageChange,
}) {
  const [isHovered, setIsHovered] = useState(null);

  const languages = [
    {
      code: "en",
      name: "English",
      flag: "🇺🇸",
      color: "from-blue-500 to-blue-600",
      hoverColor: "from-blue-600 to-blue-700",
    },
    {
      code: "bn",
      name: "বাংলা",
      flag: "🇧🇩",
      color: "from-green-500 to-green-600",
      hoverColor: "from-green-600 to-green-700",
    },
  ];

  return (
    <div className="flex items-center space-x-3">
      <span className="text-white text-sm font-medium flex items-center">
        <span className="mr-1">🌐</span>
        {getTranslation(currentLanguage, "language")}:
      </span>
      <div className="flex bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-1 shadow-lg border border-white border-opacity-20">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            onMouseEnter={() => setIsHovered(lang.code)}
            onMouseLeave={() => setIsHovered(null)}
            className={`
              relative px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 transform
              ${
                currentLanguage === lang.code
                  ? `bg-gradient-to-r ${lang.color} text-white shadow-lg scale-105 ring-2 ring-white ring-opacity-50`
                  : "text-white hover:bg-white hover:bg-opacity-20 hover:scale-102"
              }
            `}
          >
            {/* Active language glow effect */}
            {currentLanguage === lang.code && (
              <div
                className={`absolute inset-0 bg-gradient-to-r ${lang.color} rounded-lg blur-sm opacity-30 -z-10`}
              ></div>
            )}

            {/* Hover effect */}
            {isHovered === lang.code && currentLanguage !== lang.code && (
              <div className="absolute inset-0 bg-white bg-opacity-10 rounded-lg"></div>
            )}

            <div className="relative flex items-center space-x-2">
              <span
                className={`text-lg transition-transform duration-200 ${
                  currentLanguage === lang.code ? "animate-pulse" : ""
                }`}
              >
                {lang.flag}
              </span>
              <span className="font-medium">{lang.name}</span>

              {/* Active indicator */}
              {currentLanguage === lang.code && (
                <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Language status indicator */}
      <div className="flex items-center space-x-1 text-xs text-white opacity-80">
        <div
          className={`w-2 h-2 rounded-full ${
            currentLanguage === "bn" ? "bg-green-400" : "bg-blue-400"
          } animate-pulse`}
        ></div>
        <span>{currentLanguage === "bn" ? "BN" : "EN"}</span>
      </div>
    </div>
  );
}
