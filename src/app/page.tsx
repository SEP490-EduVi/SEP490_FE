'use client';

/**
 * EduVi Home Page
 * ===============
 * 
 * Landing page for choosing between:
 * 1. Prompt Editor - Create presentations using AI prompts (like Gamma)
 * 2. Slide Editor - Direct slide editing with drag-and-drop
 * 
 * Workflow:
 * Home → Prompt Editor → Generate Content → Slide Editor
 */

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Zap,
  ArrowRight,
  CheckCircle,
  Palette,
  ImagePlus,
  Edit3,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">EduVi</h1>
          </div>
          <nav className="flex items-center gap-4">
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Login
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
              Help
            </button>
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-6xl w-full">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Create Amazing Presentations
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose how you want to start: use AI to generate content or jump straight into editing
            </p>
          </div>

          {/* Options */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Prompt Editor Option */}
            <div
              onClick={() => router.push('/projects')}
              className="group cursor-pointer bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-blue-500"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                AI Prompt Editor
              </h3>
              <p className="text-gray-600 mb-4">
                Describe what you want to create and let AI generate a complete presentation outline for you
              </p>
              <div className="flex items-center text-blue-600 font-medium group-hover:gap-3 gap-2 transition-all">
                <span>Start with AI</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4" />
                  <span>Recommended for beginners</span>
                </div>
              </div>
            </div>

            {/* Slide Editor Option */}
            <div
              onClick={() => router.push('/editor')}
              className="group cursor-pointer bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 border-2 border-transparent hover:border-purple-500"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Edit3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Slide Editor
              </h3>
              <p className="text-gray-600 mb-4">
                Jump straight into editing with our powerful drag-and-drop editor and material library
              </p>
              <div className="flex items-center text-purple-600 font-medium group-hover:gap-3 gap-2 transition-all">
                <span>Start editing</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CheckCircle className="w-4 h-4" />
                  <span>Full control over design</span>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">AI-Powered</h4>
              <p className="text-sm text-gray-600">Generate content with smart prompts</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Palette className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Drag & Drop</h4>
              <p className="text-sm text-gray-600">Easy to use visual editor</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ImagePlus className="w-6 h-6 text-pink-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Rich Media</h4>
              <p className="text-sm text-gray-600">Add videos, PDFs, charts & more</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-6 text-center text-sm text-gray-500">
        <p>&copy; 2026 EduVi. Create beautiful presentations with AI.</p>
      </footer>
    </div>
  );
}
