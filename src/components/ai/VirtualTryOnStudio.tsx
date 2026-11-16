import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  Check,
  Loader2,
  Download,
  HardDrive,
  RefreshCw,
  Sliders,
  X,
  Layers,
  Eye,
  Share2,
  Laptop,
  Cloud,
  Wand2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { executeVirtualTryOn, TryOnResult } from '@/services/ai/virtualTryOnService';
import { useUploadStore } from '@/stores/uploadStore';

interface VirtualTryOnStudioProps {
  isOpen: boolean;
  onClose: () => void;
  isLocalHostActive?: boolean;
}

// Sample presets for quick 1-click testing without uploading files
const SAMPLE_MODELS = [
  {
    name: 'Model 1 (Casual)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=768&q=80',
  },
  {
    name: 'Model 2 (Studio)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=768&q=80',
  },
  {
    name: 'Model 3 (Fashion)',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=768&q=80',
  },
];

const SAMPLE_GARMENTS = [
  {
    name: 'Denim Jacket',
    url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=768&q=80',
    description: 'A stylish blue denim jacket',
  },
  {
    name: 'Red Silk Dress',
    url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=768&q=80',
    description: 'An elegant red silk evening dress',
  },
  {
    name: 'Black Blazer',
    url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=768&q=80',
    description: 'A formal tailored black suit blazer',
  },
];

export function VirtualTryOnStudio({
  isOpen,
  onClose,
  isLocalHostActive = false,
}: VirtualTryOnStudioProps) {
  // Modes: 'native-cloud' | 'web-cloud' | 'local-gpu'
  const [activeTab, setActiveTab] = useState<'native-cloud' | 'web-cloud' | 'local-gpu'>('native-cloud');

  // Input states
  const [personImage, setPersonImage] = useState<{ file?: File; preview: string; name: string } | null>(null);
  const [garmentImage, setGarmentImage] = useState<{ file?: File; preview: string; name: string } | null>(null);
  const [garmentDescription, setGarmentDescription] = useState('A stylish clothing garment');
  const [autoCrop, setAutoCrop] = useState(false);
  const [denoiseSteps, setDenoiseSteps] = useState(30);

  // Execution states
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [result, setResult] = useState<TryOnResult | null>(null);
  const [activeResultView, setActiveResultView] = useState<'output' | 'mask'>('output');
  const [showSettings, setShowSettings] = useState(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);

  const fileInputPersonRef = useRef<HTMLInputElement | null>(null);
  const fileInputGarmentRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // File selection handlers
  const handlePersonFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPersonImage({ file, preview: url, name: file.name });
    }
  };

  const handleGarmentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setGarmentImage({ file, preview: url, name: file.name });
    }
  };

  // Convert image URL to Blob for presets
  const urlToBlob = async (url: string): Promise<Blob> => {
    const res = await fetch(url);
    return await res.blob();
  };

  // Run Virtual Try-On via Cloud GPU API
  const handleStartTryOn = async () => {
    if (!personImage) {
      toast.error('Please upload a photo of the person first.');
      return;
    }
    if (!garmentImage) {
      toast.error('Please upload a photo of the clothing/garment.');
      return;
    }

    try {
      setIsProcessing(true);
      setStatusMessage('Preparing reference images...');

      // Prepare Blobs
      const personBlob = personImage.file || (await urlToBlob(personImage.preview));
      const garmentBlob = garmentImage.file || (await urlToBlob(garmentImage.preview));

      const tryOnResult = await executeVirtualTryOn(personBlob, garmentBlob, {
        garmentDescription,
        autoCrop,
        denoiseSteps,
        onStatusUpdate: (status) => setStatusMessage(status),
      });

      setResult(tryOnResult);
      toast.success(`Virtual Try-On completed in ${tryOnResult.durationSeconds}s! ✨`);
    } catch (err: any) {
      console.error('[VirtualTryOn] Error:', err);
      toast.error(err.message || 'Virtual Try-on failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setStatusMessage('');
    }
  };

  // Save generated image to Master Cloud Drive
  const handleSaveToDrive = async () => {
    if (!result?.outputImageUrl) return;
    try {
      setIsSavingToDrive(true);
      const res = await fetch(result.outputImageUrl);
      const blob = await res.blob();
      const filename = `TryOn_${Date.now()}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      await useUploadStore.getState().addFiles([file]);
      toast.success(`Saved "${filename}" directly to your Master Cloud Drive! ☁️`);
    } catch (err: any) {
      toast.error('Failed to save to Drive: ' + err.message);
    } finally {
      setIsSavingToDrive(false);
    }
  };

  // Download directly to PC
  const handleDownloadImage = () => {
    if (!result?.outputImageUrl) return;
    const a = document.createElement('a');
    a.href = result.outputImageUrl;
    a.download = `MasterCloud_VirtualTryOn_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('HD Image downloaded to your computer!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-card border border-purple-500/30 rounded-3xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* ─── MODAL TOP HEADER ─── */}
        <div className="h-16 border-b border-border/70 px-4 sm:px-6 flex items-center justify-between bg-card/60 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-foreground">
                  AI VIRTUAL TRY-ON STUDIO
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/15 text-cyan-400 flex items-center gap-1 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  CLOUD ZERO-GPU · 0 MB DOWNLOAD
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">
                Powered by IDM-VTON &amp; Hugging Face NVIDIA A100 Cloud Supercomputers (100% Free &amp; Unlimited)
              </p>
            </div>
          </div>

          {/* Mode Switcher & Close */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Segmented Mode Switcher */}
            <div className="flex items-center rounded-xl bg-muted/60 p-1 border border-border/60">
              <button
                type="button"
                onClick={() => setActiveTab('native-cloud')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'native-cloud'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Wand2 className="h-3 w-3" />
                <span className="hidden sm:inline">Native Studio</span>
                <span className="sm:hidden">Native</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('web-cloud')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'web-cloud'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Cloud className="h-3 w-3" />
                <span className="hidden sm:inline">Space Webview</span>
                <span className="sm:hidden">Web</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('local-gpu')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'local-gpu'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Laptop className="h-3 w-3" />
                <span className="hidden sm:inline">Local RTX 3050</span>
                <span className="sm:hidden">Local</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Close Studio"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ─── MODAL CONTENT BODY ─── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
          {/* TAB 1: NATIVE CLOUD STUDIO */}
          {activeTab === 'native-cloud' && (
            <div className="max-w-5xl mx-auto space-y-6">
              {/* Informative Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-cyan-500/10 border border-purple-500/20 text-xs">
                <div className="flex items-center gap-2 text-purple-200">
                  <Sparkles className="h-4 w-4 text-cyan-400 shrink-0" />
                  <span>
                    <strong>Zero Local Download Mode Active:</strong> Running on cloud NVIDIA A100 GPU. Only ~1 MB data is used for image upload.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettings((prev) => !prev)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-card/60 hover:bg-card border border-border/60 text-muted-foreground hover:text-foreground text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  <Sliders className="h-3 w-3" />
                  <span>{showSettings ? 'Hide Options' : 'Options'}</span>
                </button>
              </div>

              {/* Advanced Settings Drawer */}
              {showSettings && (
                <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-semibold text-foreground block mb-1.5">Garment Prompt / Style Description:</label>
                      <input
                        type="text"
                        value={garmentDescription}
                        onChange={(e) => setGarmentDescription(e.target.value)}
                        placeholder="e.g. A casual cotton t-shirt, floral silk dress..."
                        className="w-full px-3 py-2 rounded-xl bg-muted/60 border border-border focus:outline-none focus:ring-1 focus:ring-purple-500 text-xs"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="font-semibold text-foreground">Denoising Steps:</label>
                        <span className="font-mono text-purple-400 font-bold">{denoiseSteps}</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="40"
                        value={denoiseSteps}
                        onChange={(e) => setDenoiseSteps(parseInt(e.target.value, 10))}
                        className="w-full accent-purple-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>20 (Faster)</span>
                        <span>30 (Recommended)</span>
                        <span>40 (Ultra Detail)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TWO INPUT CARDS: PERSON & GARMENT ─── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. PERSON / MODEL PHOTO */}
                <div className="flex flex-col rounded-3xl bg-card border border-border/80 p-5 space-y-4 relative shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                        1
                      </div>
                      <h4 className="font-bold text-sm text-foreground">Person / Model Photo</h4>
                    </div>
                    {personImage && (
                      <button
                        type="button"
                        onClick={() => setPersonImage(null)}
                        className="text-xs text-rose-400 hover:text-rose-300 transition-colors font-medium cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Preview or Drop Area */}
                  <input
                    type="file"
                    ref={fileInputPersonRef}
                    onChange={handlePersonFileSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  {personImage ? (
                    <div className="relative rounded-2xl overflow-hidden border border-border bg-black/40 h-72 flex items-center justify-center group">
                      <img
                        src={personImage.preview}
                        alt="Person Preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputPersonRef.current?.click()}
                        className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition-all cursor-pointer"
                      >
                        Change Photo
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputPersonRef.current?.click()}
                      className="rounded-2xl border-2 border-dashed border-border hover:border-purple-500/60 bg-muted/20 hover:bg-muted/40 h-72 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all space-y-3"
                    >
                      <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                        <Upload className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Click to upload person's photo</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Supports JPG, PNG, WEBP</p>
                      </div>
                    </div>
                  )}

                  {/* Quick Preset Samples */}
                  {!personImage && (
                    <div className="pt-2">
                      <p className="text-[11px] text-muted-foreground mb-2 font-medium">Or test with a sample model:</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {SAMPLE_MODELS.map((sample, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPersonImage({ preview: sample.url, name: sample.name })}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/60 hover:bg-muted border border-border/70 text-[11px] text-muted-foreground hover:text-foreground transition-all shrink-0 cursor-pointer"
                          >
                            <img src={sample.url} alt="" className="h-4 w-4 rounded-full object-cover" />
                            <span>{sample.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. GARMENT / CLOTHING PHOTO */}
                <div className="flex flex-col rounded-3xl bg-card border border-border/80 p-5 space-y-4 relative shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs">
                        2
                      </div>
                      <h4 className="font-bold text-sm text-foreground">Clothing / Garment Photo</h4>
                    </div>
                    {garmentImage && (
                      <button
                        type="button"
                        onClick={() => setGarmentImage(null)}
                        className="text-xs text-rose-400 hover:text-rose-300 transition-colors font-medium cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    ref={fileInputGarmentRef}
                    onChange={handleGarmentFileSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  {garmentImage ? (
                    <div className="relative rounded-2xl overflow-hidden border border-border bg-black/40 h-72 flex items-center justify-center group">
                      <img
                        src={garmentImage.preview}
                        alt="Garment Preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputGarmentRef.current?.click()}
                        className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition-all cursor-pointer"
                      >
                        Change Garment
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputGarmentRef.current?.click()}
                      className="rounded-2xl border-2 border-dashed border-border hover:border-purple-500/60 bg-muted/20 hover:bg-muted/40 h-72 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all space-y-3"
                    >
                      <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">Click to upload garment photo</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Dress, shirt, suit, jacket or top</p>
                      </div>
                    </div>
                  )}

                  {/* Quick Preset Samples */}
                  {!garmentImage && (
                    <div className="pt-2">
                      <p className="text-[11px] text-muted-foreground mb-2 font-medium">Or test with a sample garment:</p>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {SAMPLE_GARMENTS.map((sample, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setGarmentImage({ preview: sample.url, name: sample.name });
                              setGarmentDescription(sample.description);
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/60 hover:bg-muted border border-border/70 text-[11px] text-muted-foreground hover:text-foreground transition-all shrink-0 cursor-pointer"
                          >
                            <img src={sample.url} alt="" className="h-4 w-4 rounded-full object-cover" />
                            <span>{sample.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ─── ACTION BUTTON ─── */}
              <div className="flex flex-col items-center justify-center space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleStartTryOn}
                  disabled={isProcessing || !personImage || !garmentImage}
                  className={`w-full max-w-md py-3.5 px-6 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer ${
                    isProcessing || !personImage || !garmentImage
                      ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                      : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white shadow-purple-500/25 active:scale-[0.99]'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{statusMessage || 'Processing on Cloud GPU...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>✨ Magic Virtual Try-On (Cloud GPU · 0 MB Data)</span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-muted-foreground">
                  No local download required · Runs on volunteer high-speed NVIDIA A100 GPU
                </p>
              </div>

              {/* ─── RESULT DISPLAY CARD ─── */}
              {result && (
                <div className="rounded-3xl bg-card border border-purple-500/30 p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <Check className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-foreground">Synthesis Complete!</h4>
                        <p className="text-xs text-muted-foreground">
                          Synthesized in {result.durationSeconds} seconds on Cloud ZeroGPU
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSaveToDrive}
                        disabled={isSavingToDrive}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer"
                      >
                        {isSavingToDrive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <HardDrive className="h-3.5 w-3.5" />}
                        <span>Save to Drive</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadImage}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold border border-border transition-all cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download HD</span>
                      </button>
                      {result.maskedImageUrl && (
                        <button
                          type="button"
                          onClick={() => setActiveResultView((prev) => (prev === 'output' ? 'mask' : 'output'))}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground text-xs font-medium border border-border transition-all cursor-pointer"
                        >
                          <Layers className="h-3.5 w-3.5" />
                          <span>{activeResultView === 'output' ? 'View Mask' : 'View Result'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Generated Image Showcase */}
                  <div className="rounded-2xl overflow-hidden border border-border/80 bg-black/60 max-h-[600px] flex items-center justify-center p-2 relative">
                    <img
                      src={activeResultView === 'output' ? result.outputImageUrl : result.maskedImageUrl}
                      alt="Virtual Try-On Result"
                      className="max-h-[560px] w-auto object-contain rounded-xl shadow-lg"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SPACE WEBVIEW (IFRAME) */}
          {activeTab === 'web-cloud' && (
            <div className="w-full h-full min-h-[700px] rounded-2xl overflow-hidden border border-border relative">
              <iframe
                src="https://yisol-idm-vton.hf.space"
                title="Hugging Face IDM-VTON Cloud Space"
                className="w-full h-full min-h-[700px] border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
                allow="camera; microphone; clipboard-write"
              />
            </div>
          )}

          {/* TAB 3: LOCALHOST RTX 3050 */}
          {activeTab === 'local-gpu' && (
            <div className="w-full h-full min-h-[700px] rounded-2xl overflow-hidden border border-border relative bg-background">
              <iframe
                src="http://127.0.0.1:7860"
                title="Localhost IDM-VTON"
                className="w-full h-full min-h-[700px] border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
              />
              {!isLocalHostActive && (
                <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-10 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Laptop className="h-8 w-8" />
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <h4 className="text-base font-bold text-foreground">Local Server Offline</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      To run locally on your RTX 3050, run the batch file. Or switch to <strong>✨ Native Studio</strong> tab above for 0 MB data usage without downloading 12GB!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('native-cloud')}
                    className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-md hover:bg-purple-700 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    <span>Switch to Native Cloud Studio (Instant)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
