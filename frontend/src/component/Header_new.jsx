import React from "react";
import LanguageSelector from "./LanguageSelector";
import { getTranslation } from "../utils/translations";

export default function Header({ currentLanguage = "en", onLanguageChange }) {
  return (
    <header className="bg-green-700 shadow-lg rounded-b-sm py-4">
      <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold">
          {getTranslation(currentLanguage, "header.title")}
        </h1>
        {onLanguageChange && (
          <LanguageSelector
            currentLanguage={currentLanguage}
            onLanguageChange={onLanguageChange}
          />
        )}
      </div>
    </header>
  );
}
