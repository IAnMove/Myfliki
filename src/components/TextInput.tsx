import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface TextInputProps {
  onNext: (text: string, imagePrompts: string, voice: string, service: string) => void;
  voices: { [key: string]: string }[];
}

export function TextInput({ onNext, voices }: TextInputProps) {
  const [text, setText] = useState('');
  const [imagePrompts, setImagePrompts] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(Object.keys(voices[0])[0]);
  const [selectedService] = useState('azure'); // For now, only Azure is supported

  const handleNext = () => {
    if (text.trim()) {
      onNext(text, imagePrompts, selectedVoice, selectedService);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Text to Speech Converter</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter your text (one paragraph per block)
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full h-48 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter the text you want to convert to speech..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter image prompts (one per line, matching text blocks)
          </label>
          <textarea
            value={imagePrompts}
            onChange={(e) => setImagePrompts(e.target.value)}
            className="w-full h-48 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter the image prompts, one per line..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Voice
            </label>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {voices.map((voice) => (
                Object.entries(voice).map(([key, value]) => (
                  <option key={value} value={key}>
                    {key}
                  </option>
                ))
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service
            </label>
            <select
              value={selectedService}
              disabled
              className="w-full p-2 border rounded-lg bg-gray-100"
            >
              <option value="azure">Azure</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleNext}
          disabled={!text.trim()}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <span>Next</span>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}