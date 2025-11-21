import React, { useState } from "react";
import { getTranslation } from "../utils/translations";

export default function QuestionForm({ onAsk, disabled, language = "en" }) {
  const [question, setQuestion] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const submit = () => {
    if (!question.trim()) return;
    onAsk?.(question);
    setQuestion("");
  };

  const isValidQuestion = question.trim().length > 0;

  return (
    <div className="space-y-4">
      <div
        className={`relative transition-all duration-300 ${
          isFocused ? "scale-[1.02]" : ""
        }`}
      >
        {" "}
        <textarea
          placeholder={getTranslation(language, "questions.placeholder")}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyPress={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey &&
              !disabled &&
              isValidQuestion
            ) {
              e.preventDefault();
              submit();
            }
          }}
          disabled={disabled}
          rows="4"
          className={`w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-500 focus:outline-none transition-all duration-300 resize-none ${
            disabled
              ? "cursor-not-allowed opacity-50 bg-gray-100"
              : "hover:bg-gray-100 focus:bg-white focus:border-purple-400 focus:shadow-lg focus:ring-2 focus:ring-purple-200"
          } ${isFocused ? "shadow-xl" : ""}`}
        />
        {/* Character count and hint */}
        <div className="absolute bottom-2 right-2 flex items-center space-x-2">
          <span className="text-xs text-gray-400">{question.length}/500</span>
          {isFocused && (
            <span className="text-xs text-purple-500 animate-pulse">
              {language === "bn" ? "Enter চাপুন" : "Press Enter"}
            </span>
          )}
        </div>
      </div>

      {/* Submit button */}
      <div className="flex space-x-3">
        <button
          onClick={submit}
          disabled={disabled || !isValidQuestion}
          className={`flex-1 btn-interactive px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
            disabled || !isValidQuestion
              ? "bg-gray-500 cursor-not-allowed opacity-50"
              : "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-lg hover:shadow-xl"
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <span>💬</span>
            <span>
              {disabled
                ? language === "bn"
                  ? "অপেক্ষা করুন..."
                  : "Please wait..."
                : language === "bn"
                ? "প্রশ্ন করুন"
                : "Ask Question"}
            </span>
          </div>
        </button>

        {question.trim() && (
          <button
            onClick={() => setQuestion("")}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all duration-300 border border-gray-300"
          >
            <span>🗑️</span>
          </button>
        )}
      </div>

      {/* Help text */}
      <div className="text-center">
        <p className="text-gray-600 text-sm">
          {language === "bn"
            ? "বাংলা ও ইংরেজি উভয় ভাষায় প্রশ্ন করতে পারেন"
            : "You can ask questions in both Bengali and English"}
        </p>
        {disabled && (
          <p className="text-gray-500 text-xs mt-1">
            {language === "bn"
              ? "প্রথমে একটি ছবি আপলোড করুন"
              : "Please upload an image first"}
          </p>
        )}
      </div>
    </div>
  );
}
