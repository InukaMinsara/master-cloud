import React, { useState, useEffect } from 'react';
import {
  FileText,
  Mic,
  MicOff,
  Download,
  Plus,
  Trash2,
  Play,
  X,
  Clock,
  Check,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useVideoPlayerStore } from '@/stores/videoPlayerStore';
import {
  SubtitleCue,
  formatSrtTimestamp,
  exportToSrt,
  exportToVtt,
  downloadSubtitleFile,
} from '@/services/subtitleParser';
import { speechToTextEngine, TranscriptionEvent } from '@/services/videoIntelligence';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function SubtitleEditorModal({ videoRef }: { videoRef: React.RefObject<HTMLVideoElement> }) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionSnippet, setTranscriptionSnippet] = useState('');
  const [editingCueId, setEditingCueId] = useState<string | null>(null);
  const [newText, setNewText] = useState('');

  const subtitleTracks = useVideoPlayerStore((s) => s.subtitleTracks);
  const activeSubtitleTrackId = useVideoPlayerStore((s) => s.activeSubtitleTrackId);
  const subtitleOffset = useVideoPlayerStore((s) => s.subtitleOffset);
  const currentTime = useVideoPlayerStore((s) => s.currentTime);
  const fileName = useVideoPlayerStore((s) => s.fileName);

  const addSubtitleCue = useVideoPlayerStore((s) => s.addSubtitleCue);
  const updateSubtitleCue = useVideoPlayerStore((s) => s.updateSubtitleCue);
  const removeSubtitleCue = useVideoPlayerStore((s) => s.removeSubtitleCue);
  const setSubtitleOffset = useVideoPlayerStore((s) => s.setSubtitleOffset);
  const setCurrentTime = useVideoPlayerStore((s) => s.setCurrentTime);
  const setActivePanel = useVideoPlayerStore((s) => s.setActivePanel);

  const activeTrack = subtitleTracks.find((t) => t.id === activeSubtitleTrackId) || subtitleTracks[0];
  const cues = activeTrack?.cues || [];

  const handleToggleTranscription = () => {
    if (isTranscribing) {
      speechToTextEngine.stop();
      setIsTranscribing(false);
      setTranscriptionSnippet('');
      toast.info('Voice transcription stopped.');
    } else {
      const started = speechToTextEngine.start(
        () => (videoRef.current ? videoRef.current.currentTime : currentTime),
        (cue: SubtitleCue) => {
          addSubtitleCue(cue);
          toast.success(`Transcribed: "${cue.text.substring(0, 30)}…"`);
        },
        (event: TranscriptionEvent) => {
          if (event.status === 'error') {
            setIsTranscribing(false);
            toast.error(event.error || 'Speech recognition error.');
          } else if (event.transcriptSnippet) {
            setTranscriptionSnippet(event.transcriptSnippet);
          }
        },
      );

      if (started) {
        setIsTranscribing(true);
        toast.success('Live voice transcription started! Speak into your microphone or play dialogue.');
      }
    }
  };

  useEffect(() => {
    return () => {
      speechToTextEngine.stop();
    };
  }, []);

  const handleAddCueAtCurrentTime = () => {
    const start = videoRef.current ? videoRef.current.currentTime : currentTime;
    const newCue: SubtitleCue = {
      id: `cue_manual_${Date.now()}`,
      start: Math.round(start * 10) / 10,
      end: Math.round((start + 2.5) * 10) / 10,
      text: 'New subtitle cue text…',
    };
    addSubtitleCue(newCue);
    setEditingCueId(newCue.id);
    setNewText(newCue.text);
    toast.success(`Cue added at ${formatSrtTimestamp(start)}`);
  };

  const handleExportSrt = () => {
    if (cues.length === 0) {
      toast.error('No cues to export.');
      return;
    }
    const content = exportToSrt(cues);
    const baseName = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'subtitles';
    downloadSubtitleFile(`${baseName}.srt`, content, 'text/plain');
    toast.success('Exported SubRip (.srt) subtitles!');
  };

  const handleExportVtt = () => {
    if (cues.length === 0) {
      toast.error('No cues to export.');
      return;
    }
    const content = exportToVtt(cues, fileName || undefined);
    const baseName = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'subtitles';
    downloadSubtitleFile(`${baseName}.vtt`, content, 'text/vtt');
    toast.success('Exported WebVTT (.vtt) subtitles!');
  };

  const jumpToCue = (start: number) => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = start;
      setCurrentTime(start);
    }
  };

  return (
    <div
      data-controls="true"
      onClick={(e) => e.stopPropagation()}
      className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/10 bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-2xl text-white max-h-[90vh] flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Subtitle Studio & Live Transcription
              </h2>
              <p className="text-xs text-white/50">
                Edit subtitle cues, transcribe speech with Web Speech API, adjust synchronization, and export SRT/VTT.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePanel('none')}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Bar */}
        <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10 flex-wrap shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Speech to text toggle */}
            <Button
              onClick={handleToggleTranscription}
              variant={isTranscribing ? 'destructive' : 'gradient'}
              size="sm"
              className="rounded-xl h-8 gap-1.5 text-xs font-semibold"
            >
              {isTranscribing ? (
                <>
                  <MicOff className="w-3.5 h-3.5 animate-pulse" />
                  Stop Voice Dictation
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  Live Voice Transcription
                </>
              )}
            </Button>

            <Button
              onClick={handleAddCueAtCurrentTime}
              variant="outline"
              size="sm"
              className="rounded-xl h-8 gap-1.5 text-xs font-semibold border-white/15 hover:bg-white/10"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              Add Cue at Playhead
            </Button>
          </div>

          {/* Export buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleExportSrt}
              variant="ghost"
              size="sm"
              className="rounded-xl h-8 gap-1.5 text-xs text-cyan-300 hover:bg-cyan-500/10"
            >
              <Download className="w-3.5 h-3.5" />
              Export .SRT
            </Button>
            <Button
              onClick={handleExportVtt}
              variant="ghost"
              size="sm"
              className="rounded-xl h-8 gap-1.5 text-xs text-cyan-300 hover:bg-cyan-500/10"
            >
              <Download className="w-3.5 h-3.5" />
              Export .VTT
            </Button>
          </div>
        </div>

        {/* Live speech transcription preview feedback */}
        {isTranscribing && (
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs text-cyan-200 flex items-center gap-2 animate-pulse">
            <Mic className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate">
              Listening: {transcriptionSnippet || 'Speak or play dialogue to capture cues…'}
            </span>
          </div>
        )}

        {/* Sync Offset Control */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10 shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Subtitle Timing Sync Offset:</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={-5}
              max={5}
              step={0.1}
              value={subtitleOffset}
              onChange={(e) => setSubtitleOffset(Number(e.target.value))}
              className="w-36 vp-range"
            />
            <span className="font-mono text-cyan-300 font-bold w-12 text-right">
              {subtitleOffset > 0 ? `+${subtitleOffset.toFixed(1)}s` : `${subtitleOffset.toFixed(1)}s`}
            </span>
            {subtitleOffset !== 0 && (
              <button
                onClick={() => setSubtitleOffset(0)}
                className="text-[10px] text-white/50 hover:text-white"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Cue Table / List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {cues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-white/50 space-y-2">
              <FileText className="w-8 h-8 text-white/20" />
              <p className="text-xs">No subtitle cues loaded.</p>
              <p className="text-[11px] text-white/40 max-w-xs">
                Upload an SRT/VTT file, use Live Voice Transcription, or click &quot;Add Cue at Playhead&quot;.
              </p>
            </div>
          ) : (
            cues.map((cue, idx) => (
              <div
                key={cue.id}
                className="group flex items-start justify-between p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all gap-3"
              >
                {/* Index & Jump */}
                <button
                  onClick={() => jumpToCue(cue.start)}
                  className="p-1 rounded bg-white/5 text-white/60 hover:text-cyan-300 hover:bg-cyan-500/20 font-mono text-[11px] shrink-0"
                  title="Jump to cue"
                >
                  #{idx + 1}
                </button>

                {/* Timestamps inputs */}
                <div className="flex flex-col gap-1 shrink-0 text-[11px] font-mono text-white/60">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <input
                      type="number"
                      step="0.1"
                      value={cue.start}
                      onChange={(e) => updateSubtitleCue(cue.id, { start: Number(e.target.value) })}
                      className="w-16 px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-white text-[11px]"
                    />
                    <span>➔</span>
                    <input
                      type="number"
                      step="0.1"
                      value={cue.end}
                      onChange={(e) => updateSubtitleCue(cue.id, { end: Number(e.target.value) })}
                      className="w-16 px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-white text-[11px]"
                    />
                  </div>
                  <span className="text-[9px] text-white/40">
                    Duration: {(cue.end - cue.start).toFixed(1)}s
                  </span>
                </div>

                {/* Cue Text editing */}
                <div className="flex-1 min-w-0">
                  <textarea
                    rows={2}
                    value={cue.text}
                    onChange={(e) => updateSubtitleCue(cue.id, { text: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-black/50 border border-white/10 focus:border-cyan-400 text-white outline-none resize-none"
                    placeholder="Subtitle dialogue text…"
                  />
                </div>

                {/* Delete Cue */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    onClick={() => jumpToCue(cue.start)}
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-white/60 hover:text-white"
                    title="Play this cue"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </Button>
                  <button
                    onClick={() => removeSubtitleCue(cue.id)}
                    className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete cue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
