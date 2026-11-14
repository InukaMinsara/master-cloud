/**
 * webGpuEngine.ts
 * Master Cloud — Client-Side WebGPU Hardware Acceleration Engine.
 *
 * Provides real-time detection, diagnostics, and compute capabilities using
 * the user's browser WebGPU interface (Direct3D 12, Vulkan, Metal).
 */

export interface WebGpuDiagnostics {
  supported: boolean;
  adapterName: string;
  vendor: string;
  architecture: string;
  backend: string;
  description: string;
  maxBufferSizeMB: number;
  maxStorageBufferMB: number;
  maxComputeWorkgroupSize: [number, number, number];
  computeSpeedScore?: number;
  status: 'ready' | 'unsupported' | 'error';
  errorMessage?: string;
}

class WebGpuEngine {
  private diagnosticsCache: WebGpuDiagnostics | null = null;
  private isDetecting = false;

  /**
   * Check whether WebGPU is available and query detailed adapter info.
   */
  async getDiagnostics(): Promise<WebGpuDiagnostics> {
    if (this.diagnosticsCache) {
      return this.diagnosticsCache;
    }

    if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('gpu' in navigator)) {
      this.diagnosticsCache = {
        supported: false,
        adapterName: 'None (WebGPU API missing in navigator)',
        vendor: 'Unknown',
        architecture: 'Unknown',
        backend: 'software',
        description: 'WebGPU not available in this browser or platform.',
        maxBufferSizeMB: 0,
        maxStorageBufferMB: 0,
        maxComputeWorkgroupSize: [0, 0, 0],
        status: 'unsupported',
      };
      return this.diagnosticsCache;
    }

    try {
      this.isDetecting = true;
      const navGpu = (navigator as any).gpu;
      const adapter = await navGpu.requestAdapter({
        powerPreference: 'high-performance',
      });

      if (!adapter) {
        this.diagnosticsCache = {
          supported: false,
          adapterName: 'No WebGPU Adapter Granted',
          vendor: 'Unknown',
          architecture: 'Unknown',
          backend: 'none',
          description: 'Browser supports WebGPU but high-performance adapter request returned null.',
          maxBufferSizeMB: 0,
          maxStorageBufferMB: 0,
          maxComputeWorkgroupSize: [0, 0, 0],
          status: 'unsupported',
        };
        return this.diagnosticsCache;
      }

      // Query adapter info
      let info: any = {};
      if (typeof adapter.requestAdapterInfo === 'function') {
        try {
          info = await adapter.requestAdapterInfo();
        } catch {
          info = (adapter as any).info || {};
        }
      } else {
        info = (adapter as any).info || {};
      }

      const limits = adapter.limits || {};
      const maxBufferSizeMB = Math.round((limits.maxBufferSize || 0) / (1024 * 1024));
      const maxStorageBufferMB = Math.round((limits.maxStorageBufferBindingSize || 0) / (1024 * 1024));
      const maxComputeWorkgroupSize: [number, number, number] = [
        limits.maxComputeWorkgroupSizeX || 256,
        limits.maxComputeWorkgroupSizeY || 256,
        limits.maxComputeWorkgroupSizeZ || 64,
      ];

      this.diagnosticsCache = {
        supported: true,
        adapterName: info.description || info.device || info.architecture || 'WebGPU High-Performance GPU',
        vendor: info.vendor || 'Hardware Accelerated',
        architecture: info.architecture || 'Unified Shader Core',
        backend: (adapter as any).backend || 'Direct3D12/Vulkan/Metal',
        description: `${info.vendor || 'GPU'} - ${info.description || info.device || 'Direct GPU Access'}`,
        maxBufferSizeMB,
        maxStorageBufferMB,
        maxComputeWorkgroupSize,
        status: 'ready',
      };

      return this.diagnosticsCache;
    } catch (err: any) {
      this.diagnosticsCache = {
        supported: false,
        adapterName: 'Error querying WebGPU',
        vendor: 'Unknown',
        architecture: 'Unknown',
        backend: 'error',
        description: err?.message || 'Failed to initialize WebGPU',
        maxBufferSizeMB: 0,
        maxStorageBufferMB: 0,
        maxComputeWorkgroupSize: [0, 0, 0],
        status: 'error',
        errorMessage: err?.message,
      };
      return this.diagnosticsCache;
    } finally {
      this.isDetecting = false;
    }
  }

  /**
   * Run a lightweight WebGPU vector addition compute shader to benchmark latency & FLOPS.
   */
  async benchmarkCompute(): Promise<{ success: boolean; durationMs: number; error?: string }> {
    const diag = await this.getDiagnostics();
    if (!diag.supported || typeof navigator === 'undefined' || !('gpu' in navigator)) {
      return { success: false, durationMs: -1, error: 'WebGPU is not supported' };
    }

    try {
      const adapter = await (navigator as any).gpu.requestAdapter({ powerPreference: 'high-performance' });
      if (!adapter) throw new Error('No adapter available');

      const device = await adapter.requestDevice();
      const startTime = performance.now();

      // WGSL Shader for basic parallel math
      const shaderModule = device.createShaderModule({
        code: `
          @group(0) @binding(0) var<storage, read> inputA : array<f32>;
          @group(0) @binding(1) var<storage, read_write> output : array<f32>;

          @compute @workgroup_size(64)
          fn main(@builtin(global_invocation_id) global_id : vec3<u32>) {
            let index = global_id.x;
            if (index < 1024u) {
              output[index] = inputA[index] * 2.5 + 1.0;
            }
          }
        `,
      });

      const stageCompute = typeof (window as any).GPUShaderStage !== 'undefined' ? (window as any).GPUShaderStage.COMPUTE : 4;
      const usageStorage = typeof (window as any).GPUBufferUsage !== 'undefined' ? (window as any).GPUBufferUsage.STORAGE : 128;
      const usageCopyDst = typeof (window as any).GPUBufferUsage !== 'undefined' ? (window as any).GPUBufferUsage.COPY_DST : 8;
      const usageCopySrc = typeof (window as any).GPUBufferUsage !== 'undefined' ? (window as any).GPUBufferUsage.COPY_SRC : 4;

      const bindGroupLayout = device.createBindGroupLayout({
        entries: [
          { binding: 0, visibility: stageCompute, buffer: { type: 'read-only-storage' } },
          { binding: 1, visibility: stageCompute, buffer: { type: 'storage' } },
        ],
      });

      const pipeline = device.createComputePipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
        compute: { module: shaderModule, entryPoint: 'main' },
      });

      const bufferSize = 1024 * 4;
      const bufferA = device.createBuffer({ size: bufferSize, usage: usageStorage | usageCopyDst });
      const bufferOut = device.createBuffer({ size: bufferSize, usage: usageStorage | usageCopySrc });

      const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: bufferA } },
          { binding: 1, resource: { buffer: bufferOut } },
        ],
      });

      const commandEncoder = device.createCommandEncoder();
      const pass = commandEncoder.beginComputePass();
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, bindGroup);
      pass.dispatchWorkgroups(16);
      pass.end();

      device.queue.submit([commandEncoder.finish()]);
      await device.queue.onSubmittedWorkDone();

      const durationMs = Math.round((performance.now() - startTime) * 100) / 100;
      return { success: true, durationMs };
    } catch (err: any) {
      return { success: false, durationMs: -1, error: err?.message || 'Compute execution failed' };
    }
  }
}

export const webGpuEngine = new WebGpuEngine();
