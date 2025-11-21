import React, { useState, forwardRef } from "react";

// Component to format and display answer text with better readability
function FormattedAnswer({ text, isExpanded, onToggle }) {
  // Add safety check
  if (!text) {
    return <div className="text-gray-500 italic">No answer available</div>;
  }

  // Clean up markdown formatting and unwanted characters
  const cleanText = (text) => {
    try {
      return text
        .replace(/\*\*/g, "") // Remove markdown bold
        .replace(/\*/g, "") // Remove markdown italic
        .replace(/#{1,6}\s/g, "") // Remove markdown headers
        .replace(/\n{3,}/g, "\n\n") // Reduce excessive line breaks
        .trim();
    } catch (error) {
      console.error("Error cleaning text:", error);
      return text;
    }
  };

  const processedText = cleanText(text);
  const words = processedText.split(" ");
  const isLong = words.length > 30;

  const displayText =
    isLong && !isExpanded
      ? words.slice(0, 30).join(" ") + "..."
      : processedText;

  return (
    <div className="space-y-3">
      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
        {displayText}
      </div>
      {isLong && (
        <button
          onClick={onToggle}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
        >
          <span>{isExpanded ? "Show less" : "Show more"}</span>
          <span
            className={`transform transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            ↓
          </span>
        </button>
      )}
    </div>
  );
}

const History = forwardRef(({ items = [], language = "en" }, ref) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [showCopyToast, setShowCopyToast] = useState(false);

  const toggleExpanded = (index) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  const showToast = () => {
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2000);
  };

  // Add error boundary
  if (!items || !Array.isArray(items) || items.length === 0) {
    return (
      <div className="text-center py-12">
        {/* Stats header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2 text-gray-600 shadow-sm">
            <span className="text-sm">💬</span>
            <span className="text-sm font-medium">
              0 {language === "bn" ? "প্রশ্ন" : "questions"}
            </span>
          </div>
        </div>

        <div className="text-4xl mb-3 opacity-50">💬</div>
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

  return (
    <div ref={ref} className="space-y-4">
      {/* Stats header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-2 bg-gray-100 rounded-full px-4 py-2 text-gray-600 shadow-sm">
          <span className="text-sm">💬</span>
          <span className="text-sm font-medium">
            {items.length} {language === "bn" ? "প্রশ্ন" : "questions"}
          </span>
        </div>
      </div>

      {/* History items */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {items
          .slice()
          .reverse()
          .map((item, index) => {
            // Add safety checks
            if (!item) {
              console.error("Invalid item at index:", index);
              return null;
            }

            // Add special styling for the most recent question (index 0 after reverse)
            const isLatest = index === 0 && items.length > 1;

            return (
              <div
                key={index}
                className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 ${
                  isLatest
                    ? "border-blue-300 bg-blue-50 ring-2 ring-blue-200 ring-opacity-50"
                    : "border-gray-200"
                }`}
              >
                {/* Question */}
                <div className="mb-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-bold">Q</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm text-gray-500">
                          {language === "bn" ? "প্রশ্ন" : "Question"}
                        </div>
                        {isLatest && (
                          <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-medium">
                            {language === "bn" ? "সর্বশেষ" : "Latest"}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900 font-medium leading-relaxed">
                        {item.question || item.q || "No question"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Answer */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm font-bold">
                        A
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-gray-500">
                          {language === "bn" ? "উত্তর" : "Answer"}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              item.answer || item.a || "No answer"
                            );
                            showToast();
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                          title={
                            language === "bn" ? "উত্তর কপি করুন" : "Copy answer"
                          }
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      </div>
                      <FormattedAnswer
                        text={item.answer || item.a || "No answer"}
                        isExpanded={expandedItems.has(index)}
                        onToggle={() => toggleExpanded(index)}
                      />
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <div className="text-xs text-gray-400 text-right">
                    {new Date(item.timestamp || Date.now()).toLocaleString(
                      language === "bn" ? "bn-BD" : "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Footer */}
      <div className="text-center pt-4 border-t border-gray-100">
        <p className="text-gray-500 text-sm">
          {language === "bn"
            ? "সকল প্রশ্ন ও উত্তর এখানে সংরক্ষিত হবে"
            : "All questions and answers are saved here"}
        </p>
      </div>

      {/* Toast notification */}
      {showCopyToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white text-sm rounded-lg py-2 px-4 shadow-lg">
          {language === "bn" ? "কপি করা হয়েছে!" : "Copied!"}
        </div>
      )}
    </div>
  );
});

History.displayName = "History";

export default History;
