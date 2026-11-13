import React, { useState } from 'react';
import {
  Settings,
  Lock,
  Award,
  Bell,
  Sliders,
  CheckCircle2,
  Calendar,
  X,
  Mail,
  Shield,
  Clock,
  Sparkles,
  Link2,
} from 'lucide-react';
import { MasterFormData, FormQuizSettings, FormAccessSettings } from '../types';
import { toast } from 'sonner';

interface MasterFormsSettingsModalProps {
  formData: MasterFormData;
  isOpen: boolean;
  onClose: () => void;
  onSaveSettings: (quiz: FormQuizSettings, access: FormAccessSettings) => void;
}

export function MasterFormsSettingsModal({
  formData,
  isOpen,
  onClose,
  onSaveSettings,
}: MasterFormsSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'quiz' | 'access' | 'notifications'>('general');

  const [quizSettings, setQuizSettings] = useState<FormQuizSettings>(
    formData.quizSettings || {
      isQuiz: false,
      shuffleQuestions: false,
      shuffleChoices: false,
      showResultsImmediately: true,
      showCorrectAnswers: true,
      showPointsPerQuestion: true,
      passPercentage: 70,
    }
  );

  const [accessSettings, setAccessSettings] = useState<FormAccessSettings>(
    formData.accessSettings || {
      isOpen: true,
      requireLogin: false,
      singleResponsePerUser: false,
      passwordProtected: false,
      collectEmail: 'none',
      showProgressBar: true,
      allowEditAfterSubmission: false,
      confirmationMessage: 'Your response has been recorded. Thank you for participating!',
      sendEmailNotification: false,
    }
  );

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(quizSettings, accessSettings);
    toast.success('Form settings saved successfully');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-card border border-border/80 rounded-3xl max-w-2xl w-full p-6 max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Form Settings & Configuration</h2>
              <p className="text-xs text-muted-foreground">Manage access control, quiz options, and notifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-border/60 py-3 shrink-0">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === 'general' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
              activeTab === 'quiz' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Award className="h-3.5 w-3.5" />
            <span>Quiz & Grading</span>
          </button>
          <button
            onClick={() => setActiveTab('access')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
              activeTab === 'access' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Security & Access</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
              activeTab === 'notifications' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Notifications</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-foreground">Respondent Experience</h4>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-semibold text-foreground">Show Progress Bar</div>
                    <div className="text-muted-foreground text-[11px]">Displays percentage completion bar to respondents</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={accessSettings.showProgressBar}
                    onChange={(e) => setAccessSettings({ ...accessSettings, showProgressBar: e.target.checked })}
                    className="rounded text-primary focus:ring-0"
                  />
                </label>

                <div className="pt-2 border-t border-border/40">
                  <label className="block font-semibold text-foreground mb-1">Email Collection Policy</label>
                  <select
                    value={accessSettings.collectEmail}
                    onChange={(e) => setAccessSettings({ ...accessSettings, collectEmail: e.target.value as any })}
                    className="w-full bg-card border border-border/60 rounded-xl px-3 py-2 text-xs font-medium text-foreground"
                  >
                    <option value="none">Do not collect email addresses (Anonymous)</option>
                    <option value="optional">Optional email collection</option>
                    <option value="required">Strictly required email collection</option>
                  </select>
                </div>
              </div>

              <div className="bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-foreground">Post-Submission Experience</h4>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Confirmation Message</label>
                  <textarea
                    rows={2}
                    value={accessSettings.confirmationMessage}
                    onChange={(e) => setAccessSettings({ ...accessSettings, confirmationMessage: e.target.value })}
                    className="w-full bg-card border border-border/60 rounded-xl p-2.5 text-xs text-foreground focus:outline-none focus:border-primary resize-none"
                    placeholder="Message shown after successful submission..."
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Custom Redirect URL (Optional)</label>
                  <input
                    type="url"
                    value={accessSettings.redirectUrl || ''}
                    onChange={(e) => setAccessSettings({ ...accessSettings, redirectUrl: e.target.value })}
                    placeholder="https://example.com/thank-you"
                    className="w-full bg-card border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUIZ & GRADING */}
          {activeTab === 'quiz' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-bold text-sm text-foreground">Enable Quiz & Assessment Mode</div>
                    <div className="text-muted-foreground text-[11px]">
                      Assign point values, define correct answer keys, and enable automated score computation.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={quizSettings.isQuiz}
                    onChange={(e) => setQuizSettings({ ...quizSettings, isQuiz: e.target.checked })}
                    className="h-5 w-5 rounded text-amber-500 focus:ring-0"
                  />
                </label>
              </div>

              {quizSettings.isQuiz && (
                <div className="bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-3">
                  <h4 className="font-bold text-foreground">Quiz Feedback & Display Rules</h4>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-semibold text-foreground">Release Scores Immediately</div>
                      <div className="text-muted-foreground text-[11px]">Show overall score right after submission</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={quizSettings.showResultsImmediately}
                      onChange={(e) => setQuizSettings({ ...quizSettings, showResultsImmediately: e.target.checked })}
                      className="rounded text-primary focus:ring-0"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-semibold text-foreground">Show Correct Answers to Responders</div>
                      <div className="text-muted-foreground text-[11px]">Reveal correct answers and answer explanations</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={quizSettings.showCorrectAnswers}
                      onChange={(e) => setQuizSettings({ ...quizSettings, showCorrectAnswers: e.target.checked })}
                      className="rounded text-primary focus:ring-0"
                    />
                  </label>

                  <div className="pt-2 border-t border-border/40">
                    <label className="block font-semibold text-foreground mb-1">
                      Passing Threshold Percentage ({quizSettings.passPercentage}%)
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={quizSettings.passPercentage}
                      onChange={(e) => setQuizSettings({ ...quizSettings, passPercentage: Number(e.target.value) })}
                      className="w-full accent-primary cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">Pass Feedback Message</label>
                    <input
                      type="text"
                      value={quizSettings.customPassMessage || ''}
                      onChange={(e) => setQuizSettings({ ...quizSettings, customPassMessage: e.target.value })}
                      placeholder="Congratulations! You have passed the assessment."
                      className="w-full bg-card border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">Fail Feedback Message</label>
                    <input
                      type="text"
                      value={quizSettings.customFailMessage || ''}
                      onChange={(e) => setQuizSettings({ ...quizSettings, customFailMessage: e.target.value })}
                      placeholder="You did not meet the passing grade. Please study and try again."
                      className="w-full bg-card border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SECURITY & ACCESS */}
          {activeTab === 'access' && (
            <div className="space-y-4">
              <div className="bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-semibold text-foreground">Accepting Submissions</div>
                    <div className="text-muted-foreground text-[11px]">Turn off to pause or close this form</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={accessSettings.isOpen}
                    onChange={(e) => setAccessSettings({ ...accessSettings, isOpen: e.target.checked })}
                    className="rounded text-primary focus:ring-0"
                  />
                </label>

                <div className="pt-2 border-t border-border/40">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-semibold text-foreground">Password Protection</div>
                      <div className="text-muted-foreground text-[11px]">Require a passcode before opening form</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={accessSettings.passwordProtected}
                      onChange={(e) => setAccessSettings({ ...accessSettings, passwordProtected: e.target.checked })}
                      className="rounded text-primary focus:ring-0"
                    />
                  </label>

                  {accessSettings.passwordProtected && (
                    <input
                      type="text"
                      value={accessSettings.accessPassword || ''}
                      onChange={(e) => setAccessSettings({ ...accessSettings, accessPassword: e.target.value })}
                      placeholder="Set access passcode..."
                      className="w-full mt-2 bg-card border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  )}
                </div>

                <div className="pt-2 border-t border-border/40">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-semibold text-foreground">Limit to 1 Response Per User</div>
                      <div className="text-muted-foreground text-[11px]">Requires sign-in to prevent duplicate entries</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={accessSettings.singleResponsePerUser}
                      onChange={(e) => setAccessSettings({ ...accessSettings, singleResponsePerUser: e.target.checked })}
                      className="rounded text-primary focus:ring-0"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="bg-muted/20 border border-border/60 rounded-2xl p-4 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="font-semibold text-foreground">Email Notifications on Submission</div>
                    <div className="text-muted-foreground text-[11px]">Receive an instant alert when a response is submitted</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={accessSettings.sendEmailNotification}
                    onChange={(e) => setAccessSettings({ ...accessSettings, sendEmailNotification: e.target.checked })}
                    className="rounded text-primary focus:ring-0"
                  />
                </label>

                {accessSettings.sendEmailNotification && (
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Notification Email Address</label>
                    <input
                      type="email"
                      value={accessSettings.notificationEmailAddress || ''}
                      onChange={(e) => setAccessSettings({ ...accessSettings, notificationEmailAddress: e.target.value })}
                      placeholder="owner@example.com"
                      className="w-full bg-card border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border/80 hover:bg-muted text-xs font-semibold text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
