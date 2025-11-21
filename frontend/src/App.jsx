import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Header from "./component/Header.jsx";
import ImageUpload from "./component/ImageUpload.jsx";
import QuestionForm from "./component/QuestionForm.jsx";
import ModelResult from "./component/ModelResult.jsx";
import History from "./component/History.jsx";
import ErrorBoundary from "./component/ErrorBoundary.jsx";
import { getTranslation } from "./utils/translations.js";

// API base (allow override by environment variable VITE_API_BASE_URL)
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function App() {
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("en");
  const [translating, setTranslating] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success"); // "success" or "error"
  const [showToast, setShowToast] = useState(false);
  const historyRef = useRef(null);
  const endOfMessagesRef = useRef(null);

  // Toast notification function
  const showToastNotification = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const uploadImage = async (imageFile) => {
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("language", currentLanguage);
    setLoading(true);
    setResult(null); // Clear previous results
    setHistory([]); // Clear previous Q&A when new image is uploaded

    try {
      // Try richer diagnose endpoint first
      let res;
      try {
        res = await axios.post(`${API_BASE}/diagnose/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } catch {
        // Fallback if diagnose not available or missing OPENAI key
        res = await axios.post(`${API_BASE}/upload-image/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Image processing failed. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  const askQuestion = async (question) => {
    console.log("Asking question:", question);
    if (!question || !result) return;

    const formData = new FormData();
    formData.append("question", question);
    formData.append("language", currentLanguage);
    const context = [
      result?.caption && `Caption: ${result.caption}`,
      result?.crop && `Crop: ${result.crop}`,
      result?.disease && `Disease: ${result.disease}`,
    ]
      .filter(Boolean)
      .join("\n");
    if (context) formData.append("context", context);

    setAsking(true);
    try {
      console.log("Sending request to backend...");
      const res = await axios.post(`${API_BASE}/ask/`, formData);
      console.log("Received response:", res.data);

      const newEntry = {
        question: question,
        answer: res.data.answer,
        timestamp: Date.now(),
      };
      console.log("Adding to history:", newEntry);
      setHistory((prev) => {
        const updated = [...prev, newEntry];
        console.log("Updated history:", updated);
        return updated;
      });

      // Since latest questions now appear at the top, we can scroll to the history section
      // to show the newly added question and answer
      setTimeout(() => {
        if (historyRef.current) {
          historyRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    } catch (err) {
      console.error("Error asking question:", err);
      alert("Asking GPT failed. Check backend and OPENAI_API_KEY.");
    } finally {
      console.log("Setting asking to false");
      setAsking(false);
    }
  };

  const handleLanguageChange = async (newLanguage) => {
    if (newLanguage === currentLanguage) return;

    // Store original state for rollback
    const originalResult = result;
    const originalHistory = [...history];
    const originalLanguage = currentLanguage;

    setTranslating(true);
    console.log("Starting translation to:", newLanguage);
    console.log("Original result:", originalResult);
    console.log("Original history length:", originalHistory.length);

    try {
      // Step 1: Prepare all translation requests
      const translationTasks = [];

      // Add result translation if exists
      if (result) {
        const formData = new FormData();
        formData.append("caption", result.caption);
        formData.append("crop", result.crop);
        formData.append("disease", result.disease);
        formData.append("target_language", newLanguage);

        translationTasks.push({
          type: "result",
          promise: axios.post(`${API_BASE}/translate-result/`, formData),
        });
        console.log("Added result translation task");
      }

      // Add history translations if exists
      if (history.length > 0) {
        console.log(
          "Processing history items for translation:",
          history.length
        );
        history.forEach((item, index) => {
          const questionText = item.question || item.q || "";
          const answerText = item.answer || item.a || "";

          // Only translate non-empty text
          if (questionText.trim()) {
            const questionFormData = new FormData();
            questionFormData.append("text", questionText);
            questionFormData.append("target_language", newLanguage);

            translationTasks.push({
              type: "question",
              index,
              promise: axios.post(`${API_BASE}/translate/`, questionFormData),
            });
            console.log(`Added question translation task for item ${index}`);
          }

          if (answerText.trim()) {
            const answerFormData = new FormData();
            answerFormData.append("text", answerText);
            answerFormData.append("target_language", newLanguage);

            translationTasks.push({
              type: "answer",
              index,
              promise: axios.post(`${API_BASE}/translate/`, answerFormData),
            });
            console.log(`Added answer translation task for item ${index}`);
          }
        });
      }

      console.log("Total translation tasks:", translationTasks.length);

      // Step 2: Execute ALL translations and wait for completion
      // If any fail, this will throw and trigger rollback
      console.log("Executing translations...");
      const results = await Promise.allSettled(
        translationTasks.map((task) => task.promise)
      );

      // Step 3: Check if ALL translations succeeded
      const failedTranslations = results.filter(
        (result) => result.status === "rejected"
      );

      if (failedTranslations.length > 0) {
        console.error("Some translations failed:", failedTranslations);
        failedTranslations.forEach((failed, i) => {
          console.error(`Failed translation ${i}:`, failed.reason);
        });
        throw new Error(
          `${failedTranslations.length} out of ${translationTasks.length} translations failed. Translation aborted.`
        );
      }

      console.log("All translations successful!");

      // Step 4: All translations succeeded - apply them atomically
      let newResult = originalResult;
      let newHistory = [...originalHistory];

      console.log("Applying translations...");
      translationTasks.forEach((task, i) => {
        const translationResult = results[i].value.data;

        if (task.type === "result") {
          newResult = translationResult;
          console.log("Applied result translation");
        } else if (task.type === "question") {
          if (!newHistory[task.index])
            newHistory[task.index] = { ...originalHistory[task.index] };
          newHistory[task.index].question = translationResult.translated_text;
          console.log(`Applied question translation for item ${task.index}`);
        } else if (task.type === "answer") {
          if (!newHistory[task.index])
            newHistory[task.index] = { ...originalHistory[task.index] };
          newHistory[task.index].answer = translationResult.translated_text;
          console.log(`Applied answer translation for item ${task.index}`);
        }
      });

      // Step 5: Apply all changes atomically
      setCurrentLanguage(newLanguage);
      if (result) setResult(newResult);
      if (history.length > 0) setHistory(newHistory);

      console.log("Translation completed successfully");
      // Show success toast
      showToastNotification("Translation completed successfully!", "success");
    } catch (err) {
      console.error("Translation failed:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });

      // Rollback: Restore original state
      console.log("Rolling back to original state...");
      setCurrentLanguage(originalLanguage);
      setResult(originalResult);
      setHistory(originalHistory);

      // Show error toast
      showToastNotification(
        "Translation failed. Content restored to original language.",
        "error"
      );
    } finally {
      setTranslating(false);
    }
  };

  const resetForNewImage = () => {
    setResult(null);
    setHistory([]);
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, result]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      <Header
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
      />

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="w-full max-w-7xl mx-auto">
          {/* Translation Status Overlay */}
          {translating && (
            <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center animate-fadeIn">
              {/* Toast-style notification */}
              <div className="bg-white rounded-xl p-6 shadow-2xl max-w-sm mx-4 transform transition-all duration-300 scale-100 animate-slideInUp">
                <div className="flex items-center space-x-4">
                  {/* Animated spinner */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>

                  {/* Text content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {currentLanguage === "bn"
                        ? "ভাষা পরিবর্তন"
                        : "Translating"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {currentLanguage === "bn"
                        ? "অনুগ্রহ করে অপেক্ষা করুন..."
                        : "Please wait..."}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-1.5 rounded-full animate-progressMove"
                    style={{ width: "75%" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">
              🌱{" "}
              {currentLanguage === "bn"
                ? "ফসলের রোগ নির্ণয় সহায়ক"
                : "Crop Disease Diagnostic Assistant"}
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {currentLanguage === "bn"
                ? "আপনার ফসলের ছবি আপলোড করুন, রোগ নির্ণয় করুন এবং কৃষি বিশেষজ্ঞের পরামর্শ নিন। সহজ ৩ ধাপে আপনার ফসলের স্বাস্থ্য সম্পর্কে জানুন।"
                : "Upload your crop images, get disease diagnosis, and receive expert agricultural advice. Learn about your crop's health in 3 simple steps."}
            </p>
          </div>

          {/* Top Section - Upload & Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Image Upload Card */}
            <div className="group transform transition-all duration-300 hover:translate-y-[-2px]">
              <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-xl border border-blue-200 p-6 h-full hover:shadow-2xl hover:bg-opacity-90 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                    <span className="text-2xl">📸</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {currentLanguage === "bn"
                        ? "১. ছবি আপলোড করুন"
                        : "1. Upload Image"}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      {currentLanguage === "bn"
                        ? "রোগাক্রান্ত পাতা বা ফসলের ছবি তুলুন"
                        : "Take photo of diseased leaf or crop"}
                    </p>
                  </div>
                </div>

                <ImageUpload
                  onUpload={uploadImage}
                  loading={loading}
                  hasResult={!!result}
                  language={currentLanguage}
                  onReset={resetForNewImage}
                />
              </div>
            </div>

            {/* Analysis Results Card */}
            <div className="group transform transition-all duration-300 hover:translate-y-[-2px]">
              <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-xl border border-green-200 p-6 h-full hover:shadow-2xl hover:bg-opacity-90 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                    <span className="text-2xl">🔬</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {currentLanguage === "bn"
                        ? "২. রোগ নির্ণয়"
                        : "2. Disease Diagnosis"}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      {currentLanguage === "bn"
                        ? "AI দ্বারা স্বয়ংক্রিয় রোগ সনাক্তকরণ"
                        : "Automatic disease detection by AI"}
                    </p>
                  </div>
                </div>

                <ModelResult result={result} language={currentLanguage} />
              </div>
            </div>
          </div>

          {/* Bottom Section - Questions & History Combined */}
          <div className="max-w-4xl mx-auto">
            {/* Question Form Section */}
            <div className="group transform transition-all duration-300 hover:translate-y-[-1px] mb-6">
              <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-xl border border-purple-200 p-6 hover:shadow-2xl hover:bg-opacity-90 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                    <span className="text-2xl">💬</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {currentLanguage === "bn"
                        ? "৩. প্রশ্ন করুন"
                        : "3. Ask Questions"}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      {currentLanguage === "bn"
                        ? "কৃষি বিশেষজ্ঞের পরামর্শ নিন"
                        : "Get expert agricultural advice"}
                    </p>
                  </div>
                </div>

                <QuestionForm
                  onAsk={askQuestion}
                  disabled={!result || asking}
                  language={currentLanguage}
                />

                {asking && (
                  <div className="mt-4 flex items-center space-x-2 text-gray-600">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">
                      {currentLanguage === "bn"
                        ? "উত্তর পাওয়া হচ্ছে..."
                        : "Getting answer..."}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Q&A History Section */}
            <div className="group transform transition-all duration-300 hover:translate-y-[-1px]">
              <div className="bg-white bg-opacity-80 backdrop-blur-lg rounded-2xl shadow-xl border border-indigo-200 p-6 hover:shadow-2xl hover:bg-opacity-90 transition-all duration-300">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
                    <span className="text-2xl">📚</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {currentLanguage === "bn"
                        ? "প্রশ্ন ও উত্তরের ইতিহাস"
                        : "Q&A History"}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      {currentLanguage === "bn"
                        ? "পূর্ববর্তী আলোচনা দেখুন (সর্বশেষ প্রশ্ন উপরে)"
                        : "View previous discussions (latest questions on top)"}
                    </p>
                  </div>
                </div>

                <ErrorBoundary>
                  <History
                    items={history}
                    language={currentLanguage}
                    ref={historyRef}
                  />
                </ErrorBoundary>
                <div ref={endOfMessagesRef} />
              </div>
            </div>
          </div>

          {/* Loading Status */}
          {loading && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-blue-200 rounded-full"></div>
                  <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="text-gray-700">
                  <p className="font-semibold text-lg">
                    {getTranslation(currentLanguage, "analysis.processing") ||
                      "Processing Image"}
                  </p>
                  <p className="text-gray-600">
                    {getTranslation(currentLanguage, "analysis.analyzing") ||
                      "Analyzing crop condition..."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Status */}
          {result && !loading && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white">✓</span>
                </div>
                <p className="text-green-700 font-medium">
                  {getTranslation(currentLanguage, "analysis.complete") ||
                    "Analysis Complete"}
                </p>
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-4 bg-white bg-opacity-60 backdrop-blur-lg rounded-full px-6 py-3 text-gray-600 shadow-lg">
              <span className="text-xs">API: {API_BASE}</span>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <span className="text-xs">
                {getTranslation(currentLanguage, "language")}:{" "}
                {currentLanguage === "bn" ? "বাংলা" : "English"}
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 transform transition-all duration-300 animate-slideInUp">
          <div
            className={`rounded-lg p-4 shadow-lg max-w-sm ${
              toastType === "success"
                ? "bg-green-100 border-l-4 border-green-500 text-green-700"
                : "bg-red-100 border-l-4 border-red-500 text-red-700"
            }`}
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {toastType === "success" ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{toastMessage}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
