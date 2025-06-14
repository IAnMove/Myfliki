import { Client } from "@gradio/client";

interface FluxGenerationParams {
  prompt: string;
  checkpoint?: string;
  seed?: number;
  guidance_scale?: number;
  num_images_per_prompt?: number;
  randomize_seed?: boolean;
  width?: number;
  height?: number;
  num_inference_steps?: number;
}

export async function generateFluxImage(
  prompt: string,
  apiUrl: string,
  params: Partial<FluxGenerationParams> = {}
): Promise<string> {
  try {
    // Remove trailing slash from API URL if present
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    
    // Connect directly to the FLUX API without using the proxy
    const client = await Client.connect(baseUrl, {
      hf_token: undefined,
      status_callback: undefined,
      setup_callback: undefined,
      protocol: 'http'
    });

    const defaultParams = {
      prompt,
      checkpoint: "black-forest-labs/FLUX.1-schnell",
      seed: 0,
      guidance_scale: 3,
      num_images_per_prompt: 1,
      randomize_seed: true,
      width: params.width || 1920,
      height: params.height || 1080,
      num_inference_steps: 10,
    };

    // Use the predict method with named parameters
    const result = await client.predict(
      "infer", // The API endpoint
      {
        fn_index: 0,
        data: [
          defaultParams.prompt,
          defaultParams.checkpoint,
          defaultParams.seed,
          defaultParams.guidance_scale,
          defaultParams.num_images_per_prompt,
          defaultParams.randomize_seed,
          defaultParams.width,
          defaultParams.height,
          defaultParams.num_inference_steps,
        ]
      }
    );

    if (!result || !result.data || !Array.isArray(result.data) || result.data.length === 0) {
      throw new Error('Invalid response format from FLUX API');
    }

    const images = result.data[0];
    if (!Array.isArray(images) || images.length === 0) {
      throw new Error('No images generated');
    }

    // Extract the image path from the response
    const imagePath = images[0]?.image;
    if (!imagePath) {
      throw new Error('Invalid image data in response');
    }

    // If the image path is relative, make it absolute
    return imagePath.startsWith('http') ? imagePath : `${baseUrl}${imagePath}`;
  } catch (error) {
    console.error('Error generating image with FLUX:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to generate image');
  }
}