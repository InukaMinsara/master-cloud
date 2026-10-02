import React from 'react';
import { X, Sparkles, Layout, CheckCircle2, ArrowRight } from 'lucide-react';
import { MasterPresentationData, MasterSlide } from '../types';
import { SlideTemplates } from '../services/SlideTemplates';

interface MasterSlidesTemplatesModalProps {
  onClose: () => void;
  onApplyTemplate: (deck: MasterPresentationData) => void;
}

interface TemplatePreset {
  id: string;
  title: string;
  category: string;
  description: string;
  slideCount: number;
  themeId: string;
  createDeck: () => MasterPresentationData;
}

export function MasterSlidesTemplatesModal({
  onClose,
  onApplyTemplate,
}: MasterSlidesTemplatesModalProps) {
  const templates: TemplatePreset[] = [
    {
      id: 'master-cloud-ecosystem',
      title: 'Master Cloud Ecosystem & Architecture',
      category: 'Product & Tech',
      description: 'Comprehensive presentation detailing Master Cloud storage, native Windows drive, and canvas apps.',
      slideCount: 3,
      themeId: 'dark-slate',
      createDeck: () => SlideTemplates.getPrebuiltDeck(),
    },
    {
      id: 'enterprise-product-launch',
      title: 'Enterprise Product Launch',
      category: 'Marketing & Sales',
      description: 'High-impact slide deck for introducing new SaaS products, customer value, and rollout timelines.',
      slideCount: 4,
      themeId: 'corporate-indigo',
      createDeck: () => ({
        title: 'Enterprise Product Launch 2026',
        version: 1,
        aspectRatio: '16:9',
        activeSlideId: 'slide-1',
        defaultTheme: 'corporate-indigo',
        lastSavedAt: new Date().toISOString(),
        slides: [
          {
            id: 'slide-1',
            title: 'Product Launch 2026',
            layout: 'title',
            bgTheme: 'corporate-indigo',
            notes: 'Introduce the core problem and market gap.',
            objects: [
              {
                id: 'obj-1',
                type: 'text',
                content: 'NEXT-GENERATION PLATFORM',
                x: 10,
                y: 28,
                width: 80,
                height: 18,
                zIndex: 1,
                format: { bold: true, fontSize: 40, textColor: '#818cf8', align: 'center' },
              },
              {
                id: 'obj-2',
                type: 'text',
                content: 'Transforming enterprise productivity with AI and instant synchronization',
                x: 15,
                y: 50,
                width: 70,
                height: 14,
                zIndex: 1,
                format: { fontSize: 20, textColor: '#c7d2fe', align: 'center' },
              },
            ],
          },
          {
            id: 'slide-2',
            title: 'Customer Pain Points & Opportunity',
            layout: 'two-columns',
            bgTheme: 'corporate-indigo',
            notes: 'Break down customer friction and operational latency.',
            objects: [
              {
                id: 'obj-s2-h',
                type: 'text',
                content: 'Market Friction vs. Our Solution',
                x: 8,
                y: 10,
                width: 84,
                height: 12,
                zIndex: 1,
                format: { bold: true, fontSize: 28, textColor: '#ffffff' },
              },
              {
                id: 'obj-s2-c1',
                type: 'shape',
                shapeKind: 'rounded',
                content: 'TRADITIONAL TOOLS\n\n• Segmented apps & paywalls\n• Cloud file sync conflicts\n• High cost per user seats',
                x: 8,
                y: 28,
                width: 40,
                height: 56,
                zIndex: 1,
                format: { fillColor: '#1e1b4b', strokeColor: '#4338ca', strokeWidth: 1, fontSize: 15, textColor: '#e0e7ff' },
              },
              {
                id: 'obj-s2-c2',
                type: 'shape',
                shapeKind: 'rounded',
                content: 'OUR SOLUTION\n\n• 10 TB Permanent Free Storage\n• Unified Master Canvas Suite\n• Native Windows M: Virtual Drive',
                x: 52,
                y: 28,
                width: 40,
                height: 56,
                zIndex: 1,
                format: { fillColor: '#064e3b', strokeColor: '#059669', strokeWidth: 1, fontSize: 15, textColor: '#ecfdf5' },
              },
            ],
          },
          {
            id: 'slide-3',
            title: 'Key Milestones & Traction',
            layout: 'big-stat',
            bgTheme: 'corporate-indigo',
            objects: [
              {
                id: 'obj-s3-h',
                type: 'text',
                content: 'Proven Performance & Adoption',
                x: 8,
                y: 10,
                width: 84,
                height: 12,
                zIndex: 1,
                format: { bold: true, fontSize: 28, textColor: '#ffffff' },
              },
              {
                id: 'obj-stat',
                type: 'shape',
                shapeKind: 'rounded',
                content: '99.99%\nPlatform Uptime Across Global Edge Regions',
                x: 20,
                y: 30,
                width: 60,
                height: 44,
                zIndex: 1,
                format: { fillColor: '#312e81', strokeColor: '#6366f1', strokeWidth: 2, fontSize: 22, bold: true, textColor: '#c7d2fe', align: 'center' },
              },
            ],
          },
        ],
      }),
    },
    {
      id: 'startup-pitch-deck',
      title: 'Startup Pitch Deck (Series A)',
      category: 'Fundraising',
      description: 'Compelling venture capital pitch deck outline covering problem, product, metrics, and ask.',
      slideCount: 3,
      themeId: 'crimson-bold',
      createDeck: () => ({
        title: 'Series A Investor Deck',
        version: 1,
        aspectRatio: '16:9',
        activeSlideId: 'slide-1',
        defaultTheme: 'crimson-bold',
        lastSavedAt: new Date().toISOString(),
        slides: [
          {
            id: 'slide-1',
            title: 'Vision & Opportunity',
            layout: 'title',
            bgTheme: 'crimson-bold',
            objects: [
              {
                id: 'obj-1',
                type: 'text',
                content: 'THE FUTURE OF CLOUD COMPUTING',
                x: 10,
                y: 30,
                width: 80,
                height: 20,
                zIndex: 1,
                format: { bold: true, fontSize: 38, textColor: '#fda4af', align: 'center' },
              },
              {
                id: 'obj-2',
                type: 'text',
                content: 'Series A Investment Overview & Roadmap',
                x: 15,
                y: 54,
                width: 70,
                height: 12,
                zIndex: 1,
                format: { fontSize: 20, textColor: '#ffe4e6', align: 'center' },
              },
            ],
          },
          {
            id: 'slide-2',
            title: 'Market Opportunity & Moat',
            layout: 'two-columns',
            bgTheme: 'crimson-bold',
            objects: [
              {
                id: 'obj-s2-h',
                type: 'text',
                content: 'Uncapped Growth Potential',
                x: 8,
                y: 10,
                width: 84,
                height: 12,
                zIndex: 1,
                format: { bold: true, fontSize: 28, textColor: '#fff1f2' },
              },
              {
                id: 'obj-s2-c1',
                type: 'shape',
                shapeKind: 'rounded',
                content: '$120B TAM\nGlobal Cloud Productivity Market',
                x: 10,
                y: 30,
                width: 36,
                height: 48,
                zIndex: 1,
                format: { fillColor: '#881337', strokeColor: '#f43f5e', strokeWidth: 1, fontSize: 18, bold: true, textColor: '#ffe4e6', align: 'center' },
              },
              {
                id: 'obj-s2-c2',
                type: 'shape',
                shapeKind: 'rounded',
                content: '3.4x YoY\nOrganic User Growth Rate',
                x: 54,
                y: 30,
                width: 36,
                height: 48,
                zIndex: 1,
                format: { fillColor: '#881337', strokeColor: '#f43f5e', strokeWidth: 1, fontSize: 18, bold: true, textColor: '#ffe4e6', align: 'center' },
              },
            ],
          },
        ],
      }),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-5xl max-h-[85vh] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-card/60">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Presentation Template Gallery</h2>
              <p className="text-[11px] text-muted-foreground">
                Choose a pre-built presentation blueprint to jumpstart your deck.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="flex flex-col rounded-2xl border border-border/80 bg-card/60 p-5 shadow-lg hover:border-border hover:shadow-xl transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                  {tpl.category}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {tpl.slideCount} slides
                </span>
              </div>

              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors mb-1.5">
                {tpl.title}
              </h3>

              <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-4">
                {tpl.description}
              </p>

              <button
                onClick={() => {
                  onApplyTemplate(tpl.createDeck());
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm"
              >
                <span>Use This Template</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
