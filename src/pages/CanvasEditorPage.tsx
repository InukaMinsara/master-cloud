import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CanvasAppType } from '@/types/canvas';
import { CanvasService } from '@/services/canvasService';
import { FileItem } from '@/types/file';
import { MasterDocsEditor } from '@/features/master-canvas/docs/MasterDocsEditor';
import { MasterSheetsEditor } from '@/features/master-canvas/sheets/MasterSheetsEditor';
import { MasterSlidesEditor } from '@/features/master-canvas/slides/MasterSlidesEditor';
import { MasterFormsEditor } from '@/features/master-canvas/forms/MasterFormsEditor';
import { MasterDrawEditor } from '@/features/master-canvas/draw/MasterDrawEditor';
import { MasterNotesEditor } from '@/features/master-canvas/notes/MasterNotesEditor';
import { MasterPicsStudio } from '@/features/master-canvas/pics/MasterPicsStudio';
import { MasterVidsStudio } from '@/features/master-canvas/vids/MasterVidsStudio';
import { AIPage } from '@/pages/AIPage';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';

export function CanvasEditorPage() {
  const { app, id } = useParams<{ app: string; id?: string }>();
  const navigate = useNavigate();

  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [docData, setDocData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const canvasApp = (app?.toLowerCase() || 'docs') as CanvasAppType;

  useEffect(() => {
    // Studios (pics, vids) do not need pre-existing file IDs
    if (canvasApp === 'pics' || canvasApp === 'vids') {
      setLoading(false);
      return;
    }

    async function initDocument() {
      setLoading(true);
      try {
        if (!id || id === 'new') {
          // Create new document in Master Cloud
          const defaultTitle = `Untitled ${canvasApp.charAt(0).toUpperCase() + canvasApp.slice(1)}`;
          const { file, initialData } = await CanvasService.createCanvasDocument(canvasApp, defaultTitle);
          setCurrentFile(file);
          setDocData(initialData);
          // Update URL without page reload
          window.history.replaceState(null, '', `/canvas/${canvasApp}/${file.id}`);
        } else {
          // Load existing document from Master Cloud
          const { file, data } = await CanvasService.loadCanvasDocument(id, canvasApp);
          setCurrentFile(file);
          setDocData(data);
        }
      } catch (err: any) {
        console.error('Error loading Canvas document:', err);
        toast.error('Failed to open document: ' + (err.message || 'File error'));
      } finally {
        setLoading(false);
      }
    }

    initDocument();
  }, [canvasApp, id]);

  const handleSave = async (updatedData: any) => {
    if (!currentFile) return;
    const updatedFile = await CanvasService.saveCanvasDocument(currentFile.id, updatedData);
    setCurrentFile(updatedFile);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background space-y-3">
        <Clock className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">
          Loading Master Canvas Document...
        </p>
      </div>
    );
  }

  // Render appropriate editor based on app type
  switch (canvasApp) {
    case 'docs':
      return <MasterDocsEditor initialFile={currentFile} initialData={docData} onSave={handleSave} />;
    case 'word':
      return <MasterDocsEditor initialFile={currentFile} initialData={docData} onSave={handleSave} />;
    case 'sheets':
      return <MasterSheetsEditor initialFile={currentFile} initialData={docData} onSave={handleSave} />;
    case 'excel':
      return <MasterSheetsEditor initialFile={currentFile} initialData={docData} onSave={handleSave} />;
    case 'slides':
      return <MasterSlidesEditor initialFile={currentFile} initialData={docData} onSave={handleSave} />;
    case 'forms':
      return <MasterFormsEditor initialFile={currentFile} initialData={docData} onSave={handleSave} />;
    case 'draw':
      return <MasterDrawEditor initialFile={currentFile} initialData={docData} onSave={handleSave} />;
    case 'notes':
      return <MasterNotesEditor initialFile={currentFile} initialData={docData} onSave={handleSave} />;
    case 'onenote':
      return <MasterNotesEditor initialFile={currentFile} initialData={docData} onSave={handleSave} />;
    case 'pics':
      return <MasterPicsStudio />;
    case 'vids':
      return <MasterVidsStudio />;
    case 'ai':
      return <AIPage />;
    default:
      return (
        <div className="flex-1 flex items-center justify-center p-8">
          <p className="text-muted-foreground">Unknown application type.</p>
        </div>
      );
  }
}
