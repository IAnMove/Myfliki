import React, { useState } from 'react';
import { TextInput } from './components/TextInput';
import { TextBlockEditor } from './components/TextBlockEditor';
import { TextBlock } from './types';
import config from '../config.json';

function splitTextIntoBlocks(text: string): string[] {
  // First try to split by paragraphs
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
  
  if (paragraphs.length > 1) {
    return paragraphs;
  }

  // If no paragraphs, split by sentences (2-3 sentences per block)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const blocks: string[] = [];
  let currentBlock: string[] = [];

  sentences.forEach((sentence) => {
    currentBlock.push(sentence.trim());
    if (currentBlock.length >= 2) {
      blocks.push(currentBlock.join(' '));
      currentBlock = [];
    }
  });

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join(' '));
  }

  return blocks;
}

function getTimestamp(): string {
  const now = new Date();
  return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
}

function App() {
  const [step, setStep] = useState<'input' | 'editor'>('input');
  const [blocks, setBlocks] = useState<TextBlock[]>([]);
  const voices = config.voz_metodos[0].voices;

  const handleInitialSubmit = (text: string, imagePrompts: string, voice: string, service: string) => {
    const textBlocks = splitTextIntoBlocks(text);
    const imagePromptLines = imagePrompts.split('\n').map(line => line.trim());
    
    const newBlocks = textBlocks.map((text, index): TextBlock => ({
      id: Math.random().toString(36).substr(2, 9),
      text,
      voice,
      service,
      imagePrompt: imagePromptLines[index] || '', // Match image prompts with text blocks
    }));
    
    setBlocks(newBlocks);
    setStep('editor');
  };

  const handleGenerateAudio = async (block: TextBlock, customApiKey?: string) => {
    try {
      const method = config.voz_metodos[0];
      const voiceName = method.voices.find(v => Object.keys(v)[0] === block.voice)?.[block.voice];
      
      if (!voiceName) throw new Error('Voice not found');

      const url = `https://${method.region}.tts.speech.microsoft.com/cognitiveservices/v1`;
      
      const headers = {
        "Ocp-Apim-Subscription-Key": customApiKey || method.azure,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-16khz-32kbitrate-mono-mp3",
        "User-Agent": "TextToSpeechApp"
      };

      const data = `
        <speak version='1.0' xml:lang='es-ES'>
            <voice name='${voiceName}'>${block.text}</voice>
        </speak>
      `;

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: data
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      // Get audio duration
      const audio = new Audio(audioUrl);
      await new Promise((resolve) => {
        audio.onloadedmetadata = resolve;
      });
      const duration = audio.duration;

      // Save the audio file to the temp folder
      const fileName = `${block.id}.mp3`;
      const audioFile = new File([blob], fileName, { type: 'audio/mpeg' });
      
      setBlocks(prev => prev.map(b => 
        b.id === block.id ? { ...b, audioPath: audioUrl, audioDuration: duration } : b
      ));

    } catch (error) {
      console.error('Error generating audio:', error);
      alert('Error generating audio. Please try again.');
    }
  };

  const handleGenerateAll = async () => {
    for (const block of blocks) {
      if (!block.audioPath) {
        await handleGenerateAudio(block);
      }
    }
  };

  const handleCombineAudio = async () => {
    try {
      const audioBlocks = blocks.filter(block => block.audioPath);
      if (audioBlocks.length === 0) {
        throw new Error('No audio files to combine');
      }

      const timestamp = getTimestamp();
      const outputName = document.querySelector<HTMLInputElement>('input[placeholder="Enter output file name"]')?.value;
      const fileName = outputName ? `${outputName}-${timestamp}.mp3` : `${timestamp}.mp3`;
      const outputPath = `${config.output_folder}/${fileName}`;

      // Generate ffmpeg command for combining audio files
      const ffmpegCommand = `ffmpeg -y ${audioBlocks.map((block, i) => `-i "${config.temp_folder}/${block.id}.mp3"`).join(' ')} -filter_complex "${audioBlocks.map((_, i) => `[${i}:0]`).join('')}concat=n=${audioBlocks.length}:v=0:a=1[out]" -map "[out]" "${outputPath}"`;
      
      console.log('FFmpeg command for combining audio:');
      console.log(ffmpegCommand);

      alert('Audio combination command generated. Check the console for the ffmpeg command.');
    } catch (error) {
      console.error('Error combining audio:', error);
      alert(error.message);
    }
  };

  const handleGenerateVideo = async () => {
    try {
      const blocksWithMedia = blocks.filter(block => block.audioPath);
      if (blocksWithMedia.length === 0) {
        throw new Error('No audio files to process');
      }

      const timestamp = getTimestamp();
      const outputName = document.querySelector<HTMLInputElement>('input[placeholder="Enter output file name"]')?.value;
      const fileName = outputName ? `${outputName}-${timestamp}.mp4` : `${timestamp}.mp4`;
      const outputPath = `${config.output_folder}/${fileName}`;

      // Generate ffmpeg command for creating video
      let ffmpegCommand = 'ffmpeg -y';
      let filterComplex = '';
      let inputCount = 0;

      // Add inputs and build filter complex
      blocksWithMedia.forEach((block, i) => {
        // Add audio input
        ffmpegCommand += ` -i "${config.temp_folder}/${block.id}.mp3"`;
        
        if (block.mediaPath) {
          if (block.mediaType === 'video') {
            ffmpegCommand += ` -i "${block.mediaPath}"`;
            filterComplex += `[${inputCount + 1}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setdar=16/9[v${i}];`;
          } else {
            ffmpegCommand += ` -i "${block.mediaPath}"`;
            filterComplex += `[${inputCount + 1}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setdar=16/9[v${i}];`;
          }
          inputCount += 2;
        } else {
          // Create blank video for the duration of the audio
          filterComplex += `color=c=black:s=1920x1080:d=${block.audioDuration}[v${i}];`;
          inputCount += 1;
        }
      });

      // Concatenate all video and audio segments
      filterComplex += `${blocksWithMedia.map((_, i) => `[v${i}]`).join('')}concat=n=${blocksWithMedia.length}:v=1:a=0[v];`;
      filterComplex += `${blocksWithMedia.map((_, i) => `[${i * 2}:a]`).join('')}concat=n=${blocksWithMedia.length}:v=0:a=1[a]`;

      ffmpegCommand += ` -filter_complex "${filterComplex}" -map "[v]" -map "[a]" -c:v libx264 -c:a aac "${outputPath}"`;

      console.log('FFmpeg command for generating video:');
      console.log(ffmpegCommand);

      alert('Video generation command generated. Check the console for the ffmpeg command.');
    } catch (error) {
      console.error('Error generating video:', error);
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {step === 'input' ? (
        <TextInput onNext={handleInitialSubmit} voices={voices} />
      ) : (
        <div className="p-6 space-y-6">
          <TextBlockEditor
            blocks={blocks}
            onUpdateBlocks={setBlocks}
            voices={voices}
            onGenerateAudio={handleGenerateAudio}
            onGenerateVideo={handleGenerateVideo}
            onCombineAudio={handleCombineAudio}
          />
          
          <div className="max-w-4xl mx-auto flex justify-end space-x-4">
            <button
              onClick={handleGenerateAll}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
            >
              Generate All Audio
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;