"use client";

import { toBlobURL } from "@ffmpeg/util";

export interface FFmpegClient {
  loaded: boolean;
  on: (event: "log" | "progress", cb: (data: { message: string; progress: number }) => void) => void;
  load: (config: { coreURL: string; wasmURL: string }) => Promise<boolean>;
  writeFile: (path: string, data: Uint8Array) => Promise<boolean>;
  exec: (args: string[]) => Promise<number>;
  readFile: (path: string) => Promise<Uint8Array | string>;
  deleteFile: (path: string) => Promise<boolean>;
}

declare global {
  interface Window {
    FFmpegWASM?: {
      FFmpeg: new () => FFmpegClient;
    };
  }
}

let ffmpegInstance: FFmpegClient | null = null;
let loadingPromise: Promise<FFmpegClient> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export async function getFFmpeg(
  onLog?: (message: string) => void,
  onProgress?: (ratio: number) => void
): Promise<FFmpegClient> {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    if (onProgress) {
      ffmpegInstance.on("progress", ({ progress }) => {
        onProgress(Math.min(1, Math.max(0, progress)));
      });
    }
    return ffmpegInstance;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    // Load same-origin UMD script so 814.ffmpeg.js Web Worker is allowed by browser Same-Origin Policy
    await loadScript("/ffmpeg/ffmpeg.js");
    const FFmpegCtor = window.FFmpegWASM?.FFmpeg;
    if (!FFmpegCtor) {
      throw new Error("FFmpeg WebAssembly runtime failed to initialize.");
    }

    const ffmpeg = new FFmpegCtor();
    if (onLog) {
      ffmpeg.on("log", ({ message }) => onLog(message));
    }
    if (onProgress) {
      ffmpeg.on("progress", ({ progress }) => {
        onProgress(Math.min(1, Math.max(0, progress)));
      });
    }

    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  try {
    return await loadingPromise;
  } catch (err) {
    loadingPromise = null;
    throw err;
  }
}
