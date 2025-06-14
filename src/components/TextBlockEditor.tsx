import React, { useState, useRef } from 'react';
import { Play, Plus, Trash, Upload, Volume2, Eye, EyeOff, Video, Timer, Wand2 } from 'lucide-react';
import { TextBlock } from '../types';
import { ImageGenerationPanel } from './ImageGenerationPanel';
import { generateFluxImage } from '../services/imageGeneration/flux';

interface TextBlockEditorProps {
  blocks: TextBlock[];
  onUpdateBlocks: (blocks: TextBlock[]) => void;
  voices: { [key: string]: string }[];
  onGenerateAudio: (block: TextBlock, apiKey?: string) => Promise<void>;
  onGenerateVideo: () => void;
  onCombineAudio: () => void;
}

export function TextBlockEditor({ 
  blocks, 
  onUpdateBlocks, 
  voices, 
  onGenerateAudio,
  onGenerateVideo,
  onCombineAudio 
}: TextBlockEditorProps) {
  const [generating, setGenerating] = useState<string[]>([]);
  const [generatingImages, setGeneratingImages] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [outputName, setOutputName] = useState('');
  const [fluxApiUrl, setFluxApiUrl] = useState('');
  const [imageWidth, setImageWidth] = useState(1920);
  const [imageHeight, setImageHeight] = useState(1080);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  const addBlock = (index: number) => {
    const newBlock: TextBlock = {
      id: Math.random().toString(36).substr(2, 9),
      text: '',
      voice: Object.keys(voices[0])[0],
      service: 'azure',
      imagePrompt: '',
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    onUpdateBlocks(newBlocks);
  };

  const removeBlock = (index: number) => {
    if (blocks.length > 1) {
      const newBlocks = blocks.filter((_, i) => i !== index);
      onUpdateBlocks(newBlocks);
    }
  };

  const updateBlock = (index: number, updates: Partial<TextBlock>) => {
    const newBlocks = blocks.map((block, i) => 
      i === index ? { ...block, ...updates } : block
    );
    onUpdateBlocks(newBlocks);
  };

  const handleGenerateAudio = async (block: TextBlock, index: number) => {
    if (generating.includes(block.id) || !block.text.trim()) return;
    
    setGenerating(prev => [...prev, block.id]);
    try {
      await onGenerateAudio(block, apiKey);
    } finally {
      setGenerating(prev => prev.filter(id => id !== block.id));
    }
  };

  const handleGenerateImage = async (block: TextBlock, index: number) => {
    if (!block.imagePrompt?.trim() || generatingImages.includes(block.id)) return;

    setGeneratingImages(prev => [...prev, block.id]);
    try {
      const imagePath = await generateFluxImage(block.imagePrompt, fluxApiUrl, {
        width: imageWidth,
        height: imageHeight
      });
      updateBlock(index, { 
        mediaPath: imagePath,
        mediaType: 'image'
      });
    } catch (error) {
      console.error('Error generating image:', error);
      alert(error instanceof Error ? error.message : 'Error generating image');
    } finally {
      setGeneratingImages(prev => prev.filter(id => id !== block.id));
    }
  };

  const handleGenerateAllImages = async () => {
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      if (block.imagePrompt?.trim() && !block.mediaPath) {
        await handleGenerateImage(block, i);
      }
    }
  };

  const handleMediaUpload = async (index: number) => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
        const mediaUrl = URL.createObjectURL(file);
        
        updateBlock(index, {
          mediaPath: mediaUrl,
          mediaType,
        });
      };

      input.click();
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Error uploading media. Please try again.');
    }
  };

  const handlePlayAudioWithMedia = (block: TextBlock) => {
    if (!block.audioPath) return;

    const audio = new Audio(block.audioPath);
    audioRefs.current[block.id] = audio;

    // If there's a video, sync it with the audio
    const videoElement = document.getElementById(`video-${block.id}`) as HTMLVideoElement;
    if (videoElement && block.mediaType === 'video') {
      videoElement.currentTime = 0;
      videoElement.muted = true;
      videoElement.play();
    }

    audio.play();
    audio.onended = () => {
      if (videoElement) {
        videoElement.pause();
      }
    };
  };

  const handleSaveApiKey = () => {
    setIsEditingKey(false);
  };

  const maskedApiKey = apiKey ? '*'.repeat(apiKey.length) : '********';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-8">
        {blocks.map((block, index) => (
          <div key={block.id} className="relative">
            {blocks.length > 1 && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <button
                  onClick={() => removeBlock(index)}
                  className="bg-red-100 p-1 rounded-full hover:bg-red-200"
                >
                  <Trash size={16} className="text-red-600" />
                </button>
              </div>
            )}
            
            <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <textarea
                    value={block.text}
                    onChange={(e) => updateBlock(index, { text: e.target.value })}
                    className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter text for this block..."
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={block.voice}
                      onChange={(e) => updateBlock(index, { voice: e.target.value })}
                      className="p-2 border rounded-lg"
                    >
                      {voices.map((voice) => (
                        Object.entries(voice).map(([key, value]) => (
                          <option key={value} value={key}>
                            {key}
                          </option>
                        ))
                      ))}
                    </select>
                    
                    <select
                      value={block.service}
                      disabled
                      className="p-2 border rounded-lg bg-gray-100"
                    >
                      <option value="azure">Azure</option>
                    </select>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleGenerateAudio(block, index)}
                      disabled={generating.includes(block.id) || !block.text.trim()}
                      className="flex items-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Volume2 size={20} />
                      <span>{generating.includes(block.id) ? 'Generating...' : 'Generate Audio'}</span>
                    </button>

                    {block.audioPath && (
                      <button
                        onClick={() => handlePlayAudioWithMedia(block)}
                        className="flex items-center space-x-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                      >
                        <Play size={20} />
                        <span>Play</span>
                      </button>
                    )}
                  </div>

                  {block.audioPath && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Timer size={16} />
                      <span>{block.audioDuration?.toFixed(1)}s</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <textarea
                    value={block.imagePrompt}
                    onChange={(e) => updateBlock(index, { imagePrompt: e.target.value })}
                    className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter image prompt for this block..."
                  />

                  <button
                    onClick={() => handleGenerateImage(block, index)}
                    disabled={generatingImages.includes(block.id) || !block.imagePrompt?.trim()}
                    className="flex items-center space-x-2 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Wand2 size={20} />
                    <span>{generatingImages.includes(block.id) ? 'Generating...' : 'Generate Image'}</span>
                  </button>

                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    {block.mediaPath ? (
                      block.mediaType === 'video' ? (
                        <video 
                          id={`video-${block.id}`}
                          src={block.mediaPath} 
                          className="w-full h-full rounded-lg" 
                        />
                      ) : (
                        <img src={block.mediaPath} alt="Media preview" className="w-full h-full object-cover rounded-lg" />
                      )
                    ) : (
                      <button
                        onClick={() => handleMediaUpload(index)}
                        className="flex flex-col items-center space-y-2 text-gray-500 hover:text-gray-700"
                      >
                        <Upload size={24} />
                        <span>Upload media</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
              <button
                onClick={() => addBlock(index)}
                className="bg-blue-100 p-1 rounded-full hover:bg-blue-200"
              >
                <Plus size={16} className="text-blue-600" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-6 mt-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Azure API Key
              </label>
              <div className="flex items-center space-x-2">
                {isEditingKey ? (
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-grow p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your Azure API key"
                  />
                ) : (
                  <div className="flex-grow p-2 border rounded-lg bg-gray-50">
                    {showApiKey ? apiKey || 'No API key set' : maskedApiKey}
                  </div>
                )}
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-2 text-gray-600 hover:text-gray-800"
                >
                  {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <button
                  onClick={() => {
                    if (isEditingKey) {
                      handleSaveApiKey();
                    } else {
                      setIsEditingKey(true);
                    }
                  }}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
                >
                  {isEditingKey ? 'Save' : 'Change'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                FLUX API URL
              </label>
              <input
                type="text"
                value={fluxApiUrl}
                onChange={(e) => setFluxApiUrl(e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter FLUX API URL (e.g., http://localhost:8081)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Width
              </label>
              <input
                type="number"
                value={imageWidth}
                onChange={(e) => setImageWidth(parseInt(e.target.value))}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter image width"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image Height
              </label>
              <input
                type="number"
                value={imageHeight}
                onChange={(e) => setImageHeight(parseInt(e.target.value))}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter image height"
              />
            </div>
          </div>

          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Output File Name (optional)
            </label>
            <input
              type="text"
              value={outputName}
              onChange={(e) => setOutputName(e.target.value)}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter output file name"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={handleGenerateAllImages}
              className="flex items-center space-x-2 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
            >
              <Wand2 size={20} />
              <span>Generate All Images</span>
            </button>
            <button
              onClick={onCombineAudio}
              className="flex items-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              <Volume2 size={20} />
              <span>Combine Audio</span>
            </button>
            <button
              onClick={onGenerateVideo}
              className="flex items-center space-x-2 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700"
            >
              <Video size={20} />
              <span>Generate Video</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}