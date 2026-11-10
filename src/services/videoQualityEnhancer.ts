/**
 * MASTER CLOUD — REAL-TIME GPU VIDEO QUALITY ENHANCER & UPSCALER (v0.6)
 * 
 * Hardware-Accelerated WebGL Shader Pipeline:
 * 1. Contrast Adaptive Sharpening (CAS / AMD FSR style edge-adaptive sharpening)
 * 2. Luma Texture Edge Peaking & Fine-Detail Reconstruction
 * 3. Bilateral Deblocking & Noise Suppression for low-resolution 360p/480p videos
 * 4. HDR Tone & Dynamic Vibrance Curve
 * 5. Interactive Before/After Split-Screen Visual Comparison Slider
 * 
 * Zero CPU overhead, zero external dependencies, 60fps real-time on client GPU.
 */

import { QualityBoostSettings } from '@/stores/videoPlayerStore';

const VERTEX_SHADER_SRC = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_uv;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_uv = a_texCoord;
  }
`;

const FRAGMENT_SHADER_SRC = `
  precision mediump float;

  uniform sampler2D u_video;
  uniform vec2 u_resolution; // Canvas target / upscale output resolution
  uniform vec2 u_source_res; // Native source video resolution
  uniform float u_sharpness; // 0.0 to 1.0
  uniform float u_edge_peaking; // 0.0 to 1.0
  uniform float u_deblock; // 0.0 to 1.0
  uniform float u_hdr_contrast; // 0.0 to 1.0
  uniform float u_saturation; // 0.0 to 1.0
  uniform int u_split_screen; // 0 or 1
  uniform float u_split_pos; // 0.0 to 1.0

  varying vec2 v_uv;

  // Converts RGB to Luminance (Rec.709)
  float getLuma(vec3 rgb) {
    return dot(rgb, vec3(0.2126, 0.7152, 0.0722));
  }

  // 1. Bilateral Deblocking & Compression Denoise
  vec3 applyDeblock(vec2 uv, vec2 dx, vec2 dy, vec3 center) {
    if (u_deblock <= 0.01) return center;

    vec3 sum = center * 4.0;
    float totalWeight = 4.0;
    float rangeSigma = 0.08 + u_deblock * 0.15;

    vec2 offsets[8];
    offsets[0] = -dx;
    offsets[1] = dx;
    offsets[2] = -dy;
    offsets[3] = dy;
    offsets[4] = -dx - dy;
    offsets[5] = dx - dy;
    offsets[6] = -dx + dy;
    offsets[7] = dx + dy;

    for (int i = 0; i < 8; i++) {
      vec3 sampleCol = texture2D(u_video, uv + offsets[i]).rgb;
      float diff = length(sampleCol - center);
      float weight = exp(-(diff * diff) / (2.0 * rangeSigma * rangeSigma));
      sum += sampleCol * weight;
      totalWeight += weight;
    }

    vec3 filtered = sum / max(totalWeight, 0.001);
    return mix(center, filtered, u_deblock * 0.75);
  }

  // 2. Edge-Adaptive Spatial Reconstruction (EASU direction gradient filter for upscaling)
  vec3 applyEASUUpscale(vec2 uv, vec2 dxSrc, vec2 dySrc, vec3 center) {
    if (u_resolution.x <= u_source_res.x * 1.05) {
      return center;
    }

    vec3 colL = texture2D(u_video, uv - dxSrc).rgb;
    vec3 colR = texture2D(u_video, uv + dxSrc).rgb;
    vec3 colU = texture2D(u_video, uv - dySrc).rgb;
    vec3 colD = texture2D(u_video, uv + dySrc).rgb;

    float lumaL = getLuma(colL);
    float lumaR = getLuma(colR);
    float lumaU = getLuma(colU);
    float lumaD = getLuma(colD);

    vec3 colUL = texture2D(u_video, uv - dxSrc - dySrc).rgb;
    vec3 colUR = texture2D(u_video, uv + dxSrc - dySrc).rgb;
    vec3 colDL = texture2D(u_video, uv - dxSrc + dySrc).rgb;
    vec3 colDR = texture2D(u_video, uv + dxSrc + dySrc).rgb;

    float lumaUL = getLuma(colUL);
    float lumaUR = getLuma(colUR);
    float lumaDL = getLuma(colDL);
    float lumaDR = getLuma(colDR);

    float dirH = abs(lumaL - lumaR);
    float dirV = abs(lumaU - lumaD);
    float dirD1 = abs(lumaUL - lumaDR);
    float dirD2 = abs(lumaUR - lumaDL);

    float wH = 1.0 / (1.0 + dirH * 4.0);
    float wV = 1.0 / (1.0 + dirV * 4.0);
    float wD1 = 1.0 / (1.0 + dirD1 * 4.0);
    float wD2 = 1.0 / (1.0 + dirD2 * 4.0);

    vec3 edgeBlend = (colL + colR) * wH * 0.5 +
                     (colU + colD) * wV * 0.5 +
                     (colUL + colDR) * wD1 * 0.25 +
                     (colUR + colDL) * wD2 * 0.25;
    float totalW = wH + wV + (wD1 + wD2) * 0.5;

    vec3 reconstructed = mix(center, edgeBlend / max(totalW, 0.001), 0.45);
    return reconstructed;
  }

  // 3. Contrast Adaptive Sharpening (CAS / FSR Algorithm on output grid)
  vec3 applyCAS(vec2 uv, vec2 dx, vec2 dy, vec3 baseColor) {
    if (u_sharpness <= 0.01 && u_edge_peaking <= 0.01) return baseColor;

    // 4-tap cross neighborhood on target resolution
    vec3 colUp    = texture2D(u_video, uv - dy).rgb;
    vec3 colDown  = texture2D(u_video, uv + dy).rgb;
    vec3 colLeft  = texture2D(u_video, uv - dx).rgb;
    vec3 colRight = texture2D(u_video, uv + dx).rgb;

    // Corner samples for higher-order detail reconstruction
    vec3 colUL = texture2D(u_video, uv - dx - dy).rgb;
    vec3 colUR = texture2D(u_video, uv + dx - dy).rgb;
    vec3 colDL = texture2D(u_video, uv - dx + dy).rgb;
    vec3 colDR = texture2D(u_video, uv + dx + dy).rgb;

    // Calculate local min/max luminance
    float lumaC = getLuma(baseColor);
    float lumaU = getLuma(colUp);
    float lumaD = getLuma(colDown);
    float lumaL = getLuma(colLeft);
    float lumaR = getLuma(colRight);

    float minLuma = min(lumaC, min(min(lumaU, lumaD), min(lumaL, lumaR)));
    float maxLuma = max(lumaC, max(max(lumaU, lumaD), max(lumaL, lumaR)));

    // Contrast Adaptive Weight calculation
    float peak = -1.0 / mix(8.0, 5.0, u_sharpness);
    float amp = clamp(min(minLuma, 1.0 - maxLuma) / max(maxLuma - minLuma, 0.01), 0.0, 1.0);
    float weight = peak * amp * u_sharpness;

    // Sharpened blend
    vec3 crossSum = colUp + colDown + colLeft + colRight;
    vec3 cornerSum = (colUL + colUR + colDL + colDR) * 0.5;
    vec3 sharpened = (baseColor + (crossSum + cornerSum * (u_edge_peaking * 0.5)) * weight) / (1.0 + (4.0 + 2.0 * u_edge_peaking) * weight);

    return clamp(sharpened, 0.0, 1.0);
  }

  // 4. Dynamic Contrast & Color Vibrance Tone
  vec3 applyGrading(vec3 col) {
    if (u_hdr_contrast > 0.01) {
      vec3 cont = (col - 0.5) * (1.0 + u_hdr_contrast * 0.4) + 0.5;
      col = clamp(cont, 0.0, 1.0);
    }

    if (u_saturation > 0.01) {
      float luma = getLuma(col);
      col = mix(vec3(luma), col, 1.0 + u_saturation * 0.45);
    }

    return clamp(col, 0.0, 1.0);
  }

  void main() {
    vec3 rawColor = texture2D(u_video, v_uv).rgb;

    // Split-Screen Before/After View
    if (u_split_screen == 1) {
      float splitDist = abs(v_uv.x - u_split_pos);
      float lineThresh = 2.0 / u_resolution.x;
      if (splitDist < lineThresh) {
        gl_FragColor = vec4(0.06, 0.85, 0.95, 1.0); // Neon Cyan Line
        return;
      }

      // Left side: Original raw video
      if (v_uv.x < u_split_pos) {
        gl_FragColor = vec4(rawColor, 1.0);
        return;
      }
    }

    // Source vs Target coordinate deltas
    vec2 dxSrc = vec2(1.0 / u_source_res.x, 0.0);
    vec2 dySrc = vec2(0.0, 1.0 / u_source_res.y);
    vec2 dxDst = vec2(1.0 / u_resolution.x, 0.0);
    vec2 dyDst = vec2(0.0, 1.0 / u_resolution.y);

    // Step 1: Denoise & Deblocking on source scale
    vec3 deblocked = applyDeblock(v_uv, dxSrc, dySrc, rawColor);

    // Step 2: Edge-Adaptive Spatial Upscaling (EASU direction reconstruction)
    vec3 upscaled = applyEASUUpscale(v_uv, dxSrc, dySrc, deblocked);

    // Step 3: Contrast Adaptive Sharpening & Edge Peaking on high-res target grid
    vec3 sharpened = applyCAS(v_uv, dxDst, dyDst, upscaled);

    // Step 4: HDR Tone & Vibrance
    vec3 finalColor = applyGrading(sharpened);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export class VideoQualityEnhancer {
  private static instance: VideoQualityEnhancer;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private isInitialized = false;

  // Uniform locations
  private uVideoLoc: WebGLUniformLocation | null = null;
  private uResLoc: WebGLUniformLocation | null = null;
  private uSourceResLoc: WebGLUniformLocation | null = null;
  private uSharpnessLoc: WebGLUniformLocation | null = null;
  private uEdgePeakingLoc: WebGLUniformLocation | null = null;
  private uDeblockLoc: WebGLUniformLocation | null = null;
  private uHdrContrastLoc: WebGLUniformLocation | null = null;
  private uSaturationLoc: WebGLUniformLocation | null = null;
  private uSplitScreenLoc: WebGLUniformLocation | null = null;
  private uSplitPosLoc: WebGLUniformLocation | null = null;

  public static getInstance(): VideoQualityEnhancer {
    if (!VideoQualityEnhancer.instance) {
      VideoQualityEnhancer.instance = new VideoQualityEnhancer();
    }
    return VideoQualityEnhancer.instance;
  }

  public init(canvas: HTMLCanvasElement): boolean {
    if (this.canvas === canvas && this.isInitialized) {
      return true;
    }

    this.cleanup();
    this.canvas = canvas;

    const gl =
      (canvas.getContext('webgl2', { alpha: false, depth: false, antialias: false, powerPreference: 'high-performance' }) as WebGLRenderingContext) ||
      (canvas.getContext('webgl', { alpha: false, depth: false, antialias: false, powerPreference: 'high-performance' }) as WebGLRenderingContext);

    if (!gl) {
      console.warn('VideoQualityEnhancer: WebGL not supported on this browser/GPU.');
      return false;
    }

    this.gl = gl;

    // Compile Shaders
    const vertShader = this.compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fragShader = this.compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vertShader || !fragShader) return false;

    const program = gl.createProgram();
    if (!program) return false;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('VideoQualityEnhancer program link failed:', gl.getProgramInfoLog(program));
      return false;
    }

    this.program = program;
    gl.useProgram(program);

    // Setup Quad geometry
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,  0, 1,
         1, -1,  1, 1,
        -1,  1,  0, 0,
        -1,  1,  0, 0,
         1, -1,  1, 1,
         1,  1,  1, 0,
      ]),
      gl.STATIC_DRAW,
    );

    const aPos = gl.getAttribLocation(program, 'a_position');
    const aTex = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(aTex);
    gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 16, 8);

    // Create Video Texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.texture = texture;

    // Cache Uniforms
    this.uVideoLoc = gl.getUniformLocation(program, 'u_video');
    this.uResLoc = gl.getUniformLocation(program, 'u_resolution');
    this.uSourceResLoc = gl.getUniformLocation(program, 'u_source_res');
    this.uSharpnessLoc = gl.getUniformLocation(program, 'u_sharpness');
    this.uEdgePeakingLoc = gl.getUniformLocation(program, 'u_edge_peaking');
    this.uDeblockLoc = gl.getUniformLocation(program, 'u_deblock');
    this.uHdrContrastLoc = gl.getUniformLocation(program, 'u_hdr_contrast');
    this.uSaturationLoc = gl.getUniformLocation(program, 'u_saturation');
    this.uSplitScreenLoc = gl.getUniformLocation(program, 'u_split_screen');
    this.uSplitPosLoc = gl.getUniformLocation(program, 'u_split_pos');

    this.isInitialized = true;
    return true;
  }

  public render(video: HTMLVideoElement, settings: QualityBoostSettings): boolean {
    const gl = this.gl;
    if (!gl || !this.program || !this.texture || !this.canvas || !this.isInitialized) {
      return false;
    }

    if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      return false;
    }

    // Super-Resolution Upscaling: Compute target output resolution
    let targetWidth = video.videoWidth;
    let targetHeight = video.videoHeight;

    if (settings.enabled && settings.preset !== 'off') {
      const aspect = (video.videoWidth || 16) / Math.max(video.videoHeight || 9, 1);
      if (settings.preset === 'fhd-to-4k') {
        // 4K UHD Target (3840×2160)
        targetWidth = Math.max(video.videoWidth, 3840);
        targetHeight = Math.round(targetWidth / aspect);
      } else if (settings.preset === 'hd-to-fhd' || settings.preset === 'sd-to-hd') {
        // 1080p FHD Target (1920×1080)
        targetWidth = Math.max(video.videoWidth, 1920);
        targetHeight = Math.round(targetWidth / aspect);
      } else {
        // Anime or Custom: match container viewport * devicePixelRatio, min video resolution
        const rect = this.canvas.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (rect.width > 0 && rect.height > 0) {
          targetWidth = Math.max(video.videoWidth, Math.round(rect.width * dpr));
          targetHeight = Math.max(video.videoHeight, Math.round(rect.height * dpr));
        }
      }
    }

    // Clamp to maximum safe WebGL texture/framebuffer dimensions
    targetWidth = Math.min(Math.max(targetWidth, 16), 3840);
    targetHeight = Math.min(Math.max(targetHeight, 16), 2160);

    if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;
      gl.viewport(0, 0, targetWidth, targetHeight);
    }

    gl.useProgram(this.program);

    // Upload video frame to texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
    gl.uniform1i(this.uVideoLoc, 0);

    // Pass parameters
    gl.uniform2f(this.uResLoc, targetWidth, targetHeight);
    gl.uniform2f(this.uSourceResLoc, video.videoWidth, video.videoHeight);
    gl.uniform1f(this.uSharpnessLoc, settings.sharpness / 100);
    gl.uniform1f(this.uEdgePeakingLoc, settings.edgePeaking / 100);
    gl.uniform1f(this.uDeblockLoc, settings.deblock / 100);
    gl.uniform1f(this.uHdrContrastLoc, settings.hdrContrast / 100);
    gl.uniform1f(this.uSaturationLoc, settings.saturation / 100);
    gl.uniform1i(this.uSplitScreenLoc, settings.splitScreen ? 1 : 0);
    gl.uniform1f(this.uSplitPosLoc, (settings.splitPosition || 50) / 100);

    // Render Quad
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    return true;
  }

  public cleanup() {
    const gl = this.gl;
    if (gl) {
      if (this.texture) gl.deleteTexture(this.texture);
      if (this.program) gl.deleteProgram(this.program);
    }
    this.gl = null;
    this.program = null;
    this.texture = null;
    this.canvas = null;
    this.isInitialized = false;
  }

  private compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
}

export const videoQualityEnhancer = VideoQualityEnhancer.getInstance();
