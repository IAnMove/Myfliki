export interface Voice {
  [key: string]: string;
}

export interface VoiceMethod {
  azure: string;
  region: string;
  voices: Voice[];
  azure_api_url: string;
}

export interface Config {
  temp_folder: string;
  output_folder: string;
  voz_metodos: VoiceMethod[];
}

export interface TextBlock {
  id: string;
  text: string;
  voice: string;
  service: string;
  audioPath?: string;
  audioDuration?: number;
  mediaPath?: string;
  mediaType?: 'image' | 'video';
  imagePrompt?: string;
  imageService?: 'FLUX' | 'WAN2.1';
}

export interface TextToSpeechState {
  blocks: TextBlock[];
  selectedVoice: string;
  selectedService: string;
  initialText: string;
}