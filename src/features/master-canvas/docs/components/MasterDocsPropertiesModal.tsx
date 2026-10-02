import React, { useState } from 'react';
import { X, Tag, Check, Hash, Building2, User, Flag } from 'lucide-react';
import { DocPropertyMetadata } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MasterDocsPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties?: DocPropertyMetadata;
  onSaveProperties: (props: DocPropertyMetadata) => void;
}

export function MasterDocsPropertiesModal({
  isOpen,
  onClose,
  properties,
  onSaveProperties,
}: MasterDocsPropertiesModalProps) {
  const [propsData, setPropsData] = useState<DocPropertyMetadata>(
    () =>
      properties || {
        project: 'Master Cloud Ecosystem',
        department: 'Engineering',
        client: 'Internal',
        priority: 'medium',
        status: 'Active',
        category: 'Technical Specification',
        tags: ['Production', 'Cloud', 'Docs'],
        referenceNumber: 'DOC-' + Math.floor(1000 + Math.random() * 9000),
      }
  );

  const [tagInput, setTagInput] = useState('');

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const currentTags = propsData.tags || [];
    if (!currentTags.includes(tagInput.trim())) {
      setPropsData({ ...propsData, tags: [...currentTags, tagInput.trim()] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setPropsData({
      ...propsData,
      tags: (propsData.tags || []).filter((t) => t !== tagToRemove),
    });
  };

  const handleSave = () => {
    onSaveProperties(propsData);
    toast.success('Document metadata and properties saved');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Document Properties & Metadata</h2>
              <p className="text-xs text-muted-foreground">Track project ownership, client association, and smart tags</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1">Project</label>
              <input
                type="text"
                value={propsData.project || ''}
                onChange={(e) => setPropsData({ ...propsData, project: e.target.value })}
                className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1">Department</label>
              <input
                type="text"
                value={propsData.department || ''}
                onChange={(e) => setPropsData({ ...propsData, department: e.target.value })}
                className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1">Client / Partner</label>
              <input
                type="text"
                value={propsData.client || ''}
                onChange={(e) => setPropsData({ ...propsData, client: e.target.value })}
                className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1">Priority</label>
              <select
                value={propsData.priority || 'medium'}
                onChange={(e) => setPropsData({ ...propsData, priority: e.target.value as any })}
                className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1">Reference ID</label>
              <input
                type="text"
                value={propsData.referenceNumber || ''}
                onChange={(e) => setPropsData({ ...propsData, referenceNumber: e.target.value })}
                className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 font-mono focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-foreground block mb-1">Category</label>
              <input
                type="text"
                value={propsData.category || ''}
                onChange={(e) => setPropsData({ ...propsData, category: e.target.value })}
                className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Smart Tags */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="text-xs font-semibold text-foreground block">Smart Tags</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tag and press Enter"
                className="flex-1 text-xs rounded-xl bg-background border border-border px-3 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none"
              />
              <Button size="sm" variant="outline" onClick={handleAddTag} className="rounded-xl text-xs">
                Add Tag
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {(propsData.tags || []).map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-semibold"
                >
                  #{t}
                  <button onClick={() => handleRemoveTag(t)} className="hover:text-destructive transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/80 bg-muted/40">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Cancel
          </Button>
          <Button variant="gradient" size="sm" onClick={handleSave} className="rounded-xl text-xs font-bold gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Save Properties
          </Button>
        </div>
      </div>
    </div>
  );
}
