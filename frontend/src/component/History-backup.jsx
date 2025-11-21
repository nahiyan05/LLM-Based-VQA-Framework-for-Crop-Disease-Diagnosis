import React, { useState, forwardRef } from "react";
import { getTranslation } from "../utils/translations";

// Compon    return (
      <div className="text-center      {/* Stats header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2 text-gray-600 shadow-sm">
          <span className="text-sm">💬</span>
          <span className="text-sm font-medium">
            {items.length} {language === "bn" ? "প্রশ্ন" : "questions"}
          </span>
        </div>
      </div>        <div className="text-4xl mb-3 opacity-50">💬</div>
        <p className="text-gray-600">
          {language === "bn" 
            ? "এখনো কোনো প্রশ্ন করা হয়নি" 
            : "No questions asked yet"}
        </p>
        <p className="text-gray-500 text-sm mt-1">
          {language === "bn" 
            ? "আপনার প্রথম প্রশ্ন করুন" 
            : "Ask your first question"}
        </p>
      </div>
    );
  }

// Component to format and display answer text with better readability
function FormattedAnswer({ text, isExpanded, onToggle }) {
  // Clean up markdown formatting and unwanted characters
  const cleanText = (text) => {
    if (!text) return "";

    return (
      text
        // Remove markdown bold formatting
        .replace(/\*\*(.*?)\*\*/g, "$1")
        // Remove markdown italic formatting
        .replace(/\*(.*?)\*/g, "$1")
        // Remove other markdown symbols
        .replace(/#{1,6}\s+/g, "")
        // Clean up extra spaces
        .replace(/\s+/g, " ")
        .trim()
    );
  };

  // Split text into sentences and paragraphs for better formatting
  const formatText = (text) => {
    if (!text) return [];

    const cleanedText = cleanText(text);

    // Split by periods, exclamation marks, or question marks followed by space
    let sentences = cleanedText.split(/(?<=[.!?])\s+/);

    // Group sentences into logical paragraphs (every 2-3 sentences)
    const paragraphs = [];
    let currentParagraph = [];

    sentences.forEach((sentence, index) => {
      currentParagraph.push(sentence.trim());

      // Create new paragraph every 2-3 sentences or if sentence mentions specific actions/steps
      if (
        currentParagraph.length >= 3 ||
        sentence.includes("1.") ||
        sentence.includes("2.") ||
        sentence.includes("3.") ||
        sentence.includes("First") ||
        sentence.includes("Second") ||
        sentence.includes("প্রথম") ||
        sentence.includes("দ্বিতীয়") ||
        index === sentences.length - 1
      ) {
        paragraphs.push(currentParagraph.join(" "));
        currentParagraph = [];
      }
    });

    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph.join(" "));
    }

    return paragraphs;
  };

  // Extract numbered lists or bullet points
  const extractListItems = (text) => {
    const cleanedText = cleanText(text);
    const listPattern = /(\d+\.\s+[^.]*\.)|([•-]\s+[^.]*\.)/g;
    const matches = cleanedText.match(listPattern);

    if (matches && matches.length > 1) {
      return {
        hasLists: true,
        items: matches.map((item) => cleanText(item.trim())),
        remainingText: cleanText(cleanedText.replace(listPattern, "").trim()),
      };
    }

    return { hasLists: false, items: [], remainingText: cleanedText };
  };

  const paragraphs = formatText(text);
  const listInfo = extractListItems(text);

  return (
    <div className="space-y-3">
      {listInfo.hasLists ? (
        <div>
          {listInfo.remainingText && (
            <p className="text-white text-opacity-90 leading-relaxed mb-3">
              {listInfo.remainingText}
            </p>
          )}
          <ul className="space-y-2 ml-4">
            {listInfo.items.map((item, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-green-300 mr-2 mt-1">•</span>
                <span className="text-white text-opacity-90 leading-relaxed">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        paragraphs.map((paragraph, idx) => (
          <p key={idx} className="text-white text-opacity-90 leading-relaxed">
            {paragraph}
          </p>
        ))
      )}
    </div>
  );
}

const History = forwardRef(({ items, language = "en" }, ref) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [hoveredItem, setHoveredItem] = useState(null);

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3 opacity-50">💬</div>
        <p className="text-white text-opacity-60">
          {language === "bn"
            ? "এখনো কোনো প্রশ্ন করা হয়নি"
            : "No questions asked yet"}
        </p>
        <p className="text-white text-opacity-40 text-sm mt-1">
          {language === "bn"
            ? "আপনার প্রথম প্রশ্ন করুন"
            : "Ask your first question"}
        </p>
      </div>
    );
  }

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="space-y-4" ref={ref}>
      {/* Stats header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-2 bg-white bg-opacity-10 backdrop-blur-sm rounded-full px-4 py-2 text-white text-opacity-80">
          <span className="text-sm">�</span>
          <span className="text-sm font-medium">
            {items.length} {language === "bn" ? "প্রশ্ন" : "questions"}
          </span>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {/* Reverse the order so latest items appear first */}
        {[...items].reverse().map((item, idx) => {
          // Use original index for expansion state (before reversal)
          const originalIndex = items.length - 1 - idx;
          const isExpanded = expandedItems.has(originalIndex);
          const isHovered = hoveredItem === originalIndex;

          // Increase threshold and also check for multiple sentences/paragraphs
          const wordCount = item.a.split(" ").length;
          const sentenceCount = item.a
            .split(/[.!?]+/)
            .filter((s) => s.trim().length > 0).length;
          const isLongAnswer = wordCount > 50 || sentenceCount > 4;

          return (
            <div
              key={originalIndex}
              className={`group bg-white bg-opacity-10 backdrop-blur-sm border border-white border-opacity-20 rounded-xl overflow-hidden transition-all duration-300 ${
                isHovered
                  ? "transform scale-[1.02] shadow-2xl bg-opacity-20"
                  : "hover:bg-opacity-15"
              } stagger-item fade-in-scale`}
              onMouseEnter={() => setHoveredItem(originalIndex)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              {/* Question Section */}
              <div className="p-4 border-b border-white border-opacity-10">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm font-bold">Q</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium leading-relaxed">
                      {item.q}
                    </p>
                    {/* Show "Latest" badge for the most recent question */}
                    {idx === 0 && (
                      <div className="inline-flex items-center mt-2 px-2 py-1 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs rounded-full animate-pulse">
                        <span className="w-2 h-2 bg-white rounded-full mr-1 animate-ping"></span>
                        {language === "bn" ? "সর্বশেষ" : "Latest"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Answer Section */}
              <div className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white text-sm font-bold">A</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={isLongAnswer && !isExpanded ? "relative" : ""}
                    >
                      <div
                        className={`text-white text-opacity-90 leading-relaxed ${
                          isLongAnswer && !isExpanded ? "line-clamp-3" : ""
                        }`}
                      >
                        <FormattedAnswer
                          text={item.a}
                          isExpanded={isExpanded}
                          onToggle={() => toggleExpanded(originalIndex)}
                        />
                      </div>

                      {/* Fade effect for collapsed long answers */}
                      {isLongAnswer && !isExpanded && (
                        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-transparent to-transparent pointer-events-none"></div>
                      )}
                    </div>

                    {/* Expand/Collapse button for long answers */}
                    {isLongAnswer && (
                      <button
                        onClick={() => toggleExpanded(originalIndex)}
                        className="mt-3 inline-flex items-center space-x-1 text-blue-300 hover:text-blue-100 font-medium text-sm transition-all duration-200 hover:scale-105"
                      >
                        <span
                          className={`transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        >
                          ▼
                        </span>
                        <span>
                          {isExpanded
                            ? language === "bn"
                              ? "কম দেখান"
                              : "Show Less"
                            : language === "bn"
                            ? "আরো দেখান"
                            : "Show More"}
                        </span>
                      </button>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-end mt-3 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(item.a);
                          // You could add a toast notification here
                        }}
                        className="inline-flex items-center space-x-1 text-white text-opacity-60 hover:text-opacity-100 text-sm px-3 py-1 rounded-md hover:bg-white hover:bg-opacity-10 transition-all duration-200"
                        title={
                          language === "bn" ? "উত্তর কপি করুন" : "Copy Answer"
                        }
                      >
                        <span>📋</span>
                        <span>{language === "bn" ? "কপি" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

History.displayName = "History";

export default History;
