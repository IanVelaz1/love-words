"use client";

export interface MixerNodes {
  context: AudioContext;
  voiceSource: AudioBufferSourceNode | null;
  musicSource: AudioBufferSourceNode | null;
  voiceGain: GainNode;
  musicGain: GainNode;
}

/**
 * Load an audio URL into an AudioBuffer
 */
export async function loadAudioBuffer(
  context: AudioContext,
  url: string
): Promise<AudioBuffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return context.decodeAudioData(arrayBuffer);
}

/**
 * Create a simple mixer with two gain nodes
 */
export function createMixer(context: AudioContext): {
  voiceGain: GainNode;
  musicGain: GainNode;
} {
  const voiceGain = context.createGain();
  const musicGain = context.createGain();
  voiceGain.connect(context.destination);
  musicGain.connect(context.destination);
  return { voiceGain, musicGain };
}

/**
 * Play a buffer through a gain node, returns the source node
 */
export function playBuffer(
  context: AudioContext,
  buffer: AudioBuffer,
  gainNode: GainNode,
  loop = false
): AudioBufferSourceNode {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = loop;
  source.connect(gainNode);
  source.start(0);
  return source;
}

/**
 * Format seconds to mm:ss
 */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
