/**
 * MASTER CLOUD - Screenshot & Frame Capture Service
 * Captures the exact current video frame to PNG and handles browser security/CORS cleanly.
 */

export interface FrameCaptureResult {
  success: boolean;
  dataUrl?: string;
  blob?: Blob;
  width?: number;
  height?: number;
  error?: string;
}

export async function captureVideoFrame(video: HTMLVideoElement): Promise<FrameCaptureResult> {
  if (!video) {
    return { success: false, error: 'No video element provided.' };
  }

  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return { success: false, error: 'Video is not ready or has zero dimensions.' };
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { success: false, error: 'Failed to create 2D canvas context.' };
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Test for tainted canvas (cross-origin restriction)
    let dataUrl: string;
    try {
      dataUrl = canvas.toDataURL('image/png');
    } catch (taintErr: unknown) {
      return {
        success: false,
        error:
          'Browser security restricted frame capture for this remote stream (cross-origin CORS restriction). Frame capture is always supported for local files.',
      };
    }

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              success: true,
              dataUrl,
              blob,
              width: canvas.width,
              height: canvas.height,
            });
          } else {
            resolve({
              success: true,
              dataUrl,
              width: canvas.width,
              height: canvas.height,
            });
          }
        },
        'image/png'
      );
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Frame capture failed: ${msg}` };
  }
}

export async function downloadVideoScreenshot(video: HTMLVideoElement, baseName = 'master-cloud-frame'): Promise<boolean> {
  const result = await captureVideoFrame(video);
  if (!result.success || !result.dataUrl) {
    throw new Error(result.error || 'Failed to capture frame.');
  }

  const timeStr = Math.floor(video.currentTime).toString().padStart(3, '0');
  const safeName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_${timeStr}s.png`;

  const link = document.createElement('a');
  link.href = result.dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return true;
}
