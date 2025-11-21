import React, { useState, useEffect, useRef } from "react";
import { getTranslation } from "../utils/translations";

export default function ImageUpload({
  onUpload,
  loading = false,
  hasResult = false,
  language = "en",
  onReset,
}) {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = (file) => {
    if (!file) return;

    setIsAnimating(true);
    setImage(file);

    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    }

    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0] ?? null;
    handleImageUpload(file);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        handleImageUpload(file);
      } else {
        alert(
          language === "bn"
            ? "শুধুমাত্র ছবি ফাইল আপলোড করুন"
            : "Please upload only image files"
        );
      }
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleUploadClick = () => {
    if (!image)
      return alert(
        language === "bn"
          ? "প্রথমে একটি ছবি নির্বাচন করুন"
          : "Please select an image first"
      );
    onUpload?.(image);
  };

  const handleNewUpload = () => {
    setImage(null);
    setImagePreview(null);
    setIsDragOver(false);
    setIsAnimating(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Notify parent component to reset state
    onReset?.();
  };

  return (
    <div className="space-y-4">
      {/* Drag and Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
          isDragOver
            ? "border-blue-400 bg-blue-50 scale-105"
            : hasResult
            ? "border-green-300 bg-green-50"
            : "border-gray-300 bg-gray-50 hover:border-blue-300 hover:bg-blue-50"
        } ${isAnimating ? "animate-pulse" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !hasResult && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={hasResult}
          className="hidden"
        />

        {imagePreview ? (
          <div className="space-y-2">
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-60 rounded-md shadow-lg object-cover border border-white border-opacity-20"
              />
              {hasResult && (
                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>

            {hasResult && (
              <p className="text-white text-opacity-80 text-sm">
                {language === "bn"
                  ? "✅ ছবি সফলভাবে বিশ্লেষণ করা হয়েছে"
                  : "✅ Image successfully analyzed"}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Camera icon in dashed box */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-20 h-20 border-2 border-dashed border-gray-400 rounded-xl flex items-center justify-center bg-white bg-opacity-50 backdrop-blur-sm shadow-sm">
                  <div
                    className={`text-4xl ${
                      isDragOver ? "animate-bounce" : "float"
                    }`}
                  >
                    📸
                  </div>
                </div>
              </div>
            </div>

            <div className="text-gray-800">
              <p className="text-lg font-semibold mb-2">
                {isDragOver
                  ? language === "bn"
                    ? "ছবি ছাড়ুন"
                    : "Drop image here"
                  : language === "bn"
                  ? "ছবি আপলোড করুন"
                  : "Click to add photo"}
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                {language === "bn"
                  ? "এখানে ক্লিক করুন বা ছবি টেনে এনে ছাড়ুন"
                  : "Drag and drop or click to select"}
              </p>
              <p className="text-white text-opacity-50 text-xs mt-2">
                {getTranslation(language, "upload.supportedFormats")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        {!hasResult && image && (
          <button
            onClick={handleUploadClick}
            disabled={loading}
            className={`flex-1 btn-interactive px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 shadow-lg hover:shadow-xl"
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{getTranslation(language, "upload.uploading")}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <span>🔬</span>
                <span>
                  {language === "bn" ? "আপলোড ও বিশ্লেষণ" : "Upload & Analyze"}
                </span>
              </div>
            )}
          </button>
        )}

        {hasResult && (
          <button
            onClick={handleNewUpload}
            className="flex-1 btn-interactive px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-center space-x-2">
              <span>🆕</span>
              <span>{language === "bn" ? "নতুন ছবি" : "New Image"}</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
