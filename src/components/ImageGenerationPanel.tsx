import React, { useState } from 'react';
import { ImageGenerationService } from '../services/imageGeneration/types';
import { generateFluxImage } from '../services/imageGeneration/flux';
import { generateWanImage } from '../services/imageGeneration/wan';
import { Wand2 } from 'lucide-react';

interface ImageGenerationPanelProps {
  onImageGenerated: (imagePath: string) => void;
  fluxApiUrl: string;
  imageWidth: number;
  imageHeight: number;
}

export function ImageGenerationPanel({ 
  onImageGenerated, 
  fluxApiUrl,
  imageWidth,
  imageHeight
}: ImageGenerationPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [service, setService] = useState<ImageGenerationService>('FLUX');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      let imagePath: string;
      
      if (service === 'FLUX') {
        if (!fluxApiUrl) {
          throw new Error('FLUX API URL not configured');
        }
        imagePath = await generateFluxImage(prompt, fluxApiUrl, {
          width: imageWidth,
          height: imageHeight
        });
      } else {
        imagePath = await generateWanImage(prompt);
      }

      onImageGenerated(imagePath);
      setPrompt('');
    } catch (error) {
      console.error('Error generating image:', error);
      alert(error instanceof Error ? error.message : 'Error generating image');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
      <div className="flex space-x-4">
        <div className="flex-grow">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-24 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Enter prompt for image generation..."
          />
        </div>
        <div className="w-48">
          <select
            value={service}
            onChange={(e) => setService(e.target.value as ImageGenerationService)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="FLUX">FLUX</option>
            <option value="WAN2.1">WAN2.1</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="flex items-center space-x-2 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Wand2 size={20} />
          <span>{isGenerating ? 'Generating...' : 'Generate Image'}</span>
        </button>
      </div>
    </div>
  );
}