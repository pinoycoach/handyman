import React, { useState } from 'react';
import {
  Hammer,
  Upload,
  AlertCircle,
  ShoppingCart,
  CheckSquare,
  Sparkles,
  ExternalLink,
  ListChecks,
  Check,
  Copy,
  Printer,
  RotateCcw,
  Tag,
  DollarSign,
  FileText,
  Package,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Milestone,
  Plus,
  PlayCircle,
  Trophy,
} from 'lucide-react';
import {
  generateProjectPlan,
  extractShoppingList,
  extractTimeline,
  fileToBase64,
  addAffiliateLinksToText,
  GroundingUrl,
  ShoppingListResponse,
  ShoppingCategory,
  ShoppingItem,
  TimelineResponse,
  ProjectPhase,
  PhaseStep,
} from '../services/geminiService';
import Spinner from './Spinner';

interface ProjectPlannerTabProps {
  amazonAssociateTag?: string;
}

const ProjectPlannerTab: React.FC<ProjectPlannerTabProps> = ({ amazonAssociateTag = 'mytreat-20' }) => {
  const [plannerType, setPlannerType] = useState<'plan' | 'troubleshoot' | 'manual'>('plan');
  const [activeView, setActiveView] = useState<'blueprint' | 'checklist' | 'timeline'>('blueprint');

  const [inputPrompt, setInputPrompt] = useState<string>(
    'Build a 4x8 ft raised cedar garden bed with internal drip irrigation and wire mesh pest barrier underneath'
  );
  const [includeAffiliateLinks, setIncludeAffiliateLinks] = useState<boolean>(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Raw text input for standalone parsing
  const [rawTextToParse, setRawTextToParse] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [extractingList, setExtractingList] = useState<boolean>(false);
  const [extractingTimeline, setExtractingTimeline] = useState<boolean>(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [groundingUrls, setGroundingUrls] = useState<GroundingUrl[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Checkbox Shopping List state
  const [shoppingList, setShoppingList] = useState<ShoppingListResponse | null>(null);
  const [copiedList, setCopiedList] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Visual Progress Timeline state
  const [timeline, setTimeline] = useState<TimelineResponse | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<{ [phaseId: string]: boolean }>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResultText(null);
    setGroundingUrls([]);
    setShoppingList(null);
    setTimeline(null);

    try {
      let imagePayload: { data: string; mimeType: string } | undefined;
      if (imageFile) {
        imagePayload = await fileToBase64(imageFile);
      }

      let systemInstruction = '';
      if (plannerType === 'plan') {
        systemInstruction =
          'You are a master DIY and Landscape Construction Planner. Output a comprehensive plan including: 1. Required Materials & Lumber Checklist with specific specs, 2. Required Tools, 3. Safety Gear & PPE, 4. Step-by-Step Execution Guide with measurements, 5. Maintenance & Longevity Tips.';
      } else if (plannerType === 'troubleshoot') {
        systemInstruction =
          'You are an expert Home & Garden Troubleshooter. Diagnose the root cause, provide diagnostic steps, and detail the exact fix with tools, replacement parts, and safety precautions.';
      } else {
        systemInstruction =
          'You are a Technical Manual & Spec Explainer. Translate confusing instructions, wiring schematics, plumbing diagrams, or equipment error codes into plain, foolproof language.';
      }

      const res = await generateProjectPlan({
        prompt: inputPrompt.trim(),
        systemInstruction,
        image: imagePayload,
        amazonAssociateTag,
      });

      let text = res.text;
      if (includeAffiliateLinks) {
        text = addAffiliateLinksToText(text, amazonAssociateTag);
      }

      setResultText(text);
      setGroundingUrls(res.groundingUrls || []);
      setActiveView('blueprint');
    } catch (err: any) {
      console.error('Project planner error:', err);
      setError(err.message || 'Failed to generate project plan.');
    } finally {
      setLoading(false);
    }
  };

  // Extract shopping list
  const handleExtractShoppingList = async (sourceText?: string) => {
    const textToProcess = sourceText || resultText || rawTextToParse;
    if (!textToProcess || !textToProcess.trim()) {
      setError('Please generate or provide project text to extract a shopping checklist.');
      return;
    }

    setExtractingList(true);
    setError(null);

    try {
      const extracted = await extractShoppingList(textToProcess);
      setShoppingList(extracted);
      setActiveView('checklist');
    } catch (err: any) {
      console.error('Failed to extract shopping list:', err);
      setError(err.message || 'Failed to parse project text into shopping list.');
    } finally {
      setExtractingList(false);
    }
  };

  // Extract Visual Progress Timeline
  const handleExtractTimeline = async (sourceText?: string) => {
    const textToProcess = sourceText || resultText || rawTextToParse;
    if (!textToProcess || !textToProcess.trim()) {
      setError('Please generate or provide project text to extract a project timeline.');
      return;
    }

    setExtractingTimeline(true);
    setError(null);

    try {
      const extracted = await extractTimeline(textToProcess);
      setTimeline(extracted);
      // Auto-expand all phases initially
      const initialExpanded: { [key: string]: boolean } = {};
      extracted.phases.forEach((p) => {
        initialExpanded[p.id] = true;
      });
      setExpandedPhases(initialExpanded);
      setActiveView('timeline');
    } catch (err: any) {
      console.error('Failed to extract timeline:', err);
      setError(err.message || 'Failed to parse project text into visual timeline.');
    } finally {
      setExtractingTimeline(false);
    }
  };

  // Shopping list toggles
  const toggleItemChecked = (itemId: string) => {
    if (!shoppingList) return;
    const updatedCategories = shoppingList.categories.map((cat) => ({
      ...cat,
      items: cat.items.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
    }));
    setShoppingList({ ...shoppingList, categories: updatedCategories });
  };

  const setAllItemsChecked = (status: boolean) => {
    if (!shoppingList) return;
    const updatedCategories = shoppingList.categories.map((cat) => ({
      ...cat,
      items: cat.items.map((item) => ({ ...item, checked: status })),
    }));
    setShoppingList({ ...shoppingList, categories: updatedCategories });
  };

  // Shopping list metrics
  const allItems = shoppingList ? shoppingList.categories.flatMap((c) => c.items) : [];
  const totalCount = allItems.length;
  const acquiredCount = allItems.filter((i) => i.checked).length;
  const progressPercent = totalCount > 0 ? Math.round((acquiredCount / totalCount) * 100) : 0;

  // Timeline Step toggles
  const toggleTimelineStep = (phaseId: string, stepId: string) => {
    if (!timeline) return;
    const updatedPhases = timeline.phases.map((phase) => {
      if (phase.id !== phaseId) return phase;

      const updatedSteps = phase.steps.map((s) =>
        s.id === stepId ? { ...s, completed: !s.completed } : s
      );
      const totalSteps = updatedSteps.length;
      const completedSteps = updatedSteps.filter((s) => s.completed).length;
      const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

      return {
        ...phase,
        steps: updatedSteps,
        completionPercentage: percentage,
      };
    });

    setTimeline({ ...timeline, phases: updatedPhases });
  };

  // Quick phase percentage override
  const setPhasePercentage = (phaseId: string, targetPercent: number) => {
    if (!timeline) return;
    const updatedPhases = timeline.phases.map((phase) => {
      if (phase.id !== phaseId) return phase;

      const markCompleted = targetPercent === 100;
      const updatedSteps = phase.steps.map((s) => ({
        ...s,
        completed: markCompleted ? true : targetPercent === 0 ? false : s.completed,
      }));

      return {
        ...phase,
        steps: updatedSteps,
        completionPercentage: targetPercent,
      };
    });

    setTimeline({ ...timeline, phases: updatedPhases });
  };

  const togglePhaseExpanded = (phaseId: string) => {
    setExpandedPhases((prev) => ({
      ...prev,
      [phaseId]: !prev[phaseId],
    }));
  };

  // Overall Timeline completion metrics
  const totalPhases = timeline?.phases.length || 0;
  const overallTimelinePercentage =
    totalPhases > 0
      ? Math.round(
          timeline!.phases.reduce((acc, p) => acc + p.completionPercentage, 0) / totalPhases
        )
      : 0;

  const completedPhasesCount =
    timeline?.phases.filter((p) => p.completionPercentage === 100).length || 0;

  // Copy shopping list
  const handleCopyShoppingList = () => {
    if (!shoppingList) return;
    let text = `📋 Shopping Checklist: ${shoppingList.projectName || 'DIY Project'}\n`;
    if (shoppingList.totalEstimatedBudget) {
      text += `💰 Estimated Budget: ${shoppingList.totalEstimatedBudget}\n`;
    }
    text += `Progress: ${acquiredCount}/${totalCount} items acquired (${progressPercent}%)\n\n`;

    shoppingList.categories.forEach((cat) => {
      text += `=== ${cat.categoryName} ===\n`;
      cat.items.forEach((item) => {
        const mark = item.checked ? '[x]' : '[ ]';
        text += `${mark} ${item.name} (${item.quantity}) - Spec: ${item.specification} | Est: ${item.estimatedCost}\n`;
        if (item.notes) text += `    Note: ${item.notes}\n`;
      });
      text += '\n';
    });

    navigator.clipboard.writeText(text);
    setCopiedList(true);
    setTimeout(() => setCopiedList(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-green-900 to-slate-900 p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-600/80 border border-emerald-400/40 shadow-lg">
              <Hammer className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">Project Blueprint & Visual Execution Hub</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-mono">
                  gemini-3.8-flash
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-1">
                Generate blueprints, track supplies on shopping lists, and mark off execution timeline phases
              </p>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex bg-slate-950/60 p-1 rounded-xl border border-emerald-500/30 text-xs">
            <button
              onClick={() => setActiveView('blueprint')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeView === 'blueprint'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Blueprint</span>
            </button>
            <button
              onClick={() => setActiveView('checklist')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeView === 'checklist'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              <ListChecks className="w-4 h-4" />
              <span>Shopping List {shoppingList ? `(${totalCount})` : ''}</span>
            </button>
            <button
              onClick={() => setActiveView('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeView === 'timeline'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-200 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Progress Timeline {timeline ? `(${overallTimelinePercentage}%)` : ''}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 1. BLUEPRINT VIEW */}
      {/* ==================================================== */}
      {activeView === 'blueprint' && (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Column */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setPlannerType('plan')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  plannerType === 'plan' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'
                }`}
              >
                Project Plan
              </button>
              <button
                type="button"
                onClick={() => setPlannerType('troubleshoot')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  plannerType === 'troubleshoot' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'
                }`}
              >
                Troubleshoot
              </button>
              <button
                type="button"
                onClick={() => setPlannerType('manual')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  plannerType === 'manual' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-600'
                }`}
              >
                Manual Spec
              </button>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {plannerType === 'plan'
                  ? 'What project do you want to plan and build?'
                  : plannerType === 'troubleshoot'
                  ? 'What issue are you troubleshooting?'
                  : 'Paste or upload manual instructions / specifications'}
              </label>
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                rows={4}
                placeholder="Describe dimensions, tools on hand, materials, or symptoms..."
                className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl p-3 text-sm text-slate-800 outline-none"
                disabled={loading}
              />
            </div>

            {/* Optional Photo or Diagram Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                <span>Photo / Diagram / Blueprint (Optional)</span>
                {imageFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </label>
              <div className="border border-slate-200 hover:border-emerald-400 rounded-xl p-3 bg-slate-50 relative flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  disabled={loading}
                />
                {imagePreview ? (
                  <div className="flex items-center gap-3 w-full">
                    <img src={imagePreview} alt="Diagram" className="w-14 h-14 object-cover rounded-lg border border-slate-300" />
                    <div className="text-xs">
                      <p className="font-semibold text-slate-700">Image Attached</p>
                      <p className="text-slate-400">Gemini will analyze visual features</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span>Attach photo of repair spot, manual diagram, or yard space</span>
                  </div>
                )}
              </div>
            </div>

            {/* Affiliate suggestions toggle */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">Auto-Link Tools & Materials</p>
                  <p className="text-[11px] text-slate-500">Direct Amazon hardware tags ({amazonAssociateTag})</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={includeAffiliateLinks}
                onChange={(e) => setIncludeAffiliateLinks(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={loading || !inputPrompt.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              {loading ? (
                <>
                  <Spinner size="w-5 h-5" color="border-t-white" />
                  <span>Formulating Step-by-Step Blueprint...</span>
                </>
              ) : (
                <>
                  <Hammer className="w-5 h-5" />
                  <span>
                    {plannerType === 'plan'
                      ? 'Generate Project Blueprint'
                      : plannerType === 'troubleshoot'
                      ? 'Diagnose & Fix Issue'
                      : 'Explain Manual / Specs'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Blueprint Output Column */}
          <div className="lg:col-span-7 bg-slate-50 rounded-2xl p-6 border border-slate-200 min-h-[450px] flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200 mb-4 gap-2">
                <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <span>Structured Instructions & Execution Guide</span>
                </h4>

                {resultText && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExtractShoppingList()}
                      disabled={extractingList}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                    >
                      {extractingList ? (
                        <>
                          <Spinner size="w-3.5 h-3.5" color="border-t-white" />
                          <span>Extracting Checklist...</span>
                        </>
                      ) : (
                        <>
                          <ListChecks className="w-3.5 h-3.5" />
                          <span>Shopping Checklist</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleExtractTimeline()}
                      disabled={extractingTimeline}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
                    >
                      {extractingTimeline ? (
                        <>
                          <Spinner size="w-3.5 h-3.5" color="border-t-white" />
                          <span>Generating Timeline...</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Progress Timeline</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="py-20 text-center space-y-3">
                  <Spinner size="w-10 h-10" color="border-t-emerald-600" className="mx-auto" />
                  <h5 className="font-semibold text-slate-700">Calculating Structural & Horticultural Logic</h5>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Cross-referencing building guidelines, tool requirements, and safety protocols...
                  </p>
                </div>
              ) : resultText ? (
                <div className="space-y-4">
                  <div
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-sm text-slate-800 leading-relaxed prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: resultText }}
                  />

                  {groundingUrls.length > 0 && (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs">
                      <span className="font-bold text-emerald-900 block mb-1.5">References & Guidelines:</span>
                      <div className="flex flex-wrap gap-2">
                        {groundingUrls.map((url, idx) => (
                          <a
                            key={idx}
                            href={url.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                          >
                            <span className="truncate max-w-[200px]">{url.title || url.uri}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-20 text-center space-y-2 text-slate-400">
                  <Hammer className="w-12 h-12 mx-auto text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">No Plan Generated Yet</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Enter your project details on the left, then click generate. You can then auto-extract shopping checklists and visual progress timelines!
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Model: gemini-3.8-flash</span>
              <span>Safety First: Always wear eye protection & verify load ratings</span>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 2. CHECKBOX SHOPPING LIST VIEW */}
      {/* ==================================================== */}
      {activeView === 'checklist' && (
        <div className="p-6 space-y-6">
          {!shoppingList && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center max-w-2xl mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <ListChecks className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-lg">Auto-Parse Any Project into a Shopping Checklist</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Paste project instructions, lumber cut-lists, or repair manuals. Gemini will parse them into an itemized, checkbox-enabled checklist with exact specifications and store links.
                </p>
              </div>

              <textarea
                value={rawTextToParse}
                onChange={(e) => setRawTextToParse(e.target.value)}
                rows={5}
                placeholder="Paste any DIY project steps, Reddit build logs, woodworking cut-lists, or plant recipes here..."
                className="w-full bg-white border border-slate-300 focus:border-emerald-500 rounded-xl p-3 text-xs text-slate-800 outline-none"
              />

              <div className="flex items-center justify-center gap-3">
                {resultText && (
                  <button
                    onClick={() => handleExtractShoppingList(resultText)}
                    disabled={extractingList}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors"
                  >
                    Use Blueprint Generated Above
                  </button>
                )}
                <button
                  onClick={() => handleExtractShoppingList(rawTextToParse)}
                  disabled={extractingList || (!rawTextToParse.trim() && !resultText)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all"
                >
                  {extractingList ? (
                    <>
                      <Spinner size="w-4 h-4" color="border-t-white" />
                      <span>Parsing with Gemini Estimator...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Interactive Checklist</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {shoppingList && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-900 to-emerald-950 rounded-2xl p-6 text-white border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Verified Material List
                    </span>
                    {shoppingList.totalEstimatedBudget && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span>Est. Budget: {shoppingList.totalEstimatedBudget}</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    {shoppingList.projectName || 'Project Shopping & Preparation Checklist'}
                  </h3>
                  <p className="text-xs text-emerald-200/80">
                    Check off items you already own in your workshop. Unchecked items show direct hardware links with specifications.
                  </p>
                </div>

                <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Preparation Progress</p>
                    <p className="text-lg font-bold text-emerald-400">
                      {acquiredCount} <span className="text-slate-500 text-xs">/ {totalCount} acquired</span>
                    </p>
                  </div>
                  <div className="relative w-12 h-12 flex items-center justify-center rounded-full bg-slate-800 border-2 border-emerald-500/40">
                    <span className="text-xs font-bold font-mono text-emerald-300">{progressPercent}%</span>
                  </div>
                </div>
              </div>

              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-slate-500 mr-1">Filter:</span>
                  <button
                    onClick={() => setFilterCategory('all')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                      filterCategory === 'all'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All Items ({totalCount})
                  </button>
                  {shoppingList.categories.map((cat, idx) => (
                    <button
                      key={idx}
                      onClick={() => setFilterCategory(cat.categoryName)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                        filterCategory === cat.categoryName
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat.categoryName} ({cat.items.length})
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAllItemsChecked(true)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
                  >
                    Check All (Owned)
                  </button>
                  <button
                    onClick={() => setAllItemsChecked(false)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium"
                  >
                    Reset All
                  </button>
                  <button
                    onClick={handleCopyShoppingList}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-colors"
                  >
                    {copiedList ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedList ? 'Copied List!' : 'Copy Checklist'}</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-medium"
                    title="Print Checklist"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Categorized Checklist Cards */}
              <div className="space-y-6">
                {shoppingList.categories
                  .filter((cat) => filterCategory === 'all' || filterCategory === cat.categoryName)
                  .map((category, catIdx) => {
                    const catTotal = category.items.length;
                    const catAcquired = category.items.filter((i) => i.checked).length;

                    return (
                      <div
                        key={catIdx}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                      >
                        <div className="bg-slate-100/80 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-emerald-700" />
                            <h4 className="font-bold text-slate-800 text-sm">{category.categoryName}</h4>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                            {catAcquired} / {catTotal} acquired
                          </span>
                        </div>

                        <div className="divide-y divide-slate-100">
                          {category.items.map((item) => {
                            const isChecked = !!item.checked;
                            const amazonSearchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(
                              item.searchQuery || item.name
                            )}&tag=${amazonAssociateTag}`;
                            const homeDepotUrl = `https://www.homedepot.com/s/${encodeURIComponent(
                              item.searchQuery || item.name
                            )}`;

                            return (
                              <div
                                key={item.id}
                                className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                                  isChecked ? 'bg-slate-50/70 opacity-60' : 'hover:bg-emerald-50/30'
                                }`}
                              >
                                <div className="flex items-start gap-3 flex-1">
                                  <input
                                    type="checkbox"
                                    id={item.id}
                                    checked={isChecked}
                                    onChange={() => toggleItemChecked(item.id)}
                                    className="mt-1 w-5 h-5 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <div>
                                    <label
                                      htmlFor={item.id}
                                      className={`text-sm font-semibold cursor-pointer block ${
                                        isChecked ? 'line-through text-slate-400' : 'text-slate-800'
                                      }`}
                                    >
                                      {item.name}
                                    </label>
                                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                        Qty: {item.quantity}
                                      </span>
                                      {item.specification && (
                                        <span className="bg-slate-100 px-2 py-0.5 rounded">
                                          Spec: {item.specification}
                                        </span>
                                      )}
                                      {item.estimatedCost && (
                                        <span className="text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                          Est: {item.estimatedCost}
                                        </span>
                                      )}
                                      {item.isOptional && (
                                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-semibold">
                                          Optional
                                        </span>
                                      )}
                                    </div>
                                    {item.notes && (
                                      <p className="text-[11px] text-slate-400 mt-1 italic">
                                        Purpose: {item.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                  <a
                                    href={amazonSearchUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-colors"
                                    title="Search on Amazon with Associate Tag"
                                  >
                                    <span>Amazon</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                  <a
                                    href={homeDepotUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 text-xs font-medium transition-colors"
                                    title="Search on Home Depot"
                                  >
                                    <span>Home Depot</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  onClick={() => setActiveView('blueprint')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
                >
                  ← Back to Project Blueprint
                </button>
                <button
                  onClick={() => setActiveView('timeline')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                >
                  View Execution Timeline →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. VISUAL PROGRESS TIMELINE VIEW */}
      {/* ==================================================== */}
      {activeView === 'timeline' && (
        <div className="p-6 space-y-6">
          {!timeline && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center max-w-2xl mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-lg">Auto-Build Visual Progress Timeline</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Break down your project into sequential milestones (e.g., Demolition, Material Prep, Assembly, Finishing) with completion percentages and sub-step checklists.
                </p>
              </div>

              <textarea
                value={rawTextToParse}
                onChange={(e) => setRawTextToParse(e.target.value)}
                rows={5}
                placeholder="Paste any DIY project steps, construction blueprints, or garden plans to generate timeline phases..."
                className="w-full bg-white border border-slate-300 focus:border-indigo-500 rounded-xl p-3 text-xs text-slate-800 outline-none"
              />

              <div className="flex items-center justify-center gap-3">
                {resultText && (
                  <button
                    onClick={() => handleExtractTimeline(resultText)}
                    disabled={extractingTimeline}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors"
                  >
                    Use Blueprint Generated Above
                  </button>
                )}
                <button
                  onClick={() => handleExtractTimeline(rawTextToParse)}
                  disabled={extractingTimeline || (!rawTextToParse.trim() && !resultText)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all"
                >
                  {extractingTimeline ? (
                    <>
                      <Spinner size="w-4 h-4" color="border-t-white" />
                      <span>Formulating Timeline Milestones...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Progress Timeline</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {timeline && (
            <div className="space-y-6">
              {/* Overall Progress Banner */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Sequential Execution Plan
                    </span>
                    {timeline.totalEstimatedDuration && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Est: {timeline.totalEstimatedDuration}</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-white">
                    {timeline.projectName || 'Project Milestone & Progress Timeline'}
                  </h3>
                  <p className="text-xs text-indigo-200/80">
                    Track your progress phase by phase. Check off individual subtasks or use percentage presets as you work.
                  </p>
                </div>

                {/* Overall Radial / Percentage Indicator */}
                <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-4 flex items-center gap-5">
                  <div className="text-right">
                    <p className="text-xs text-indigo-300">Overall Progress</p>
                    <p className="text-xl font-extrabold text-white">
                      {overallTimelinePercentage}%{' '}
                      <span className="text-slate-400 text-xs font-normal">
                        ({completedPhasesCount}/{totalPhases} phases)
                      </span>
                    </p>
                  </div>
                  <div className="relative w-14 h-14 flex items-center justify-center rounded-full bg-slate-800 border-4 border-indigo-500 shadow-lg">
                    <span className="text-sm font-bold font-mono text-indigo-300">
                      {overallTimelinePercentage}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Completion Celebration Card if 100% */}
              {overallTimelinePercentage === 100 && (
                <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 p-5 rounded-2xl border border-emerald-500/50 shadow-xl text-white flex items-center justify-between gap-4 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500 text-slate-950 rounded-xl font-bold">
                      <Trophy className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-emerald-100">Project 100% Complete!</h4>
                      <p className="text-xs text-emerald-300">
                        All construction, installation, and inspection milestones have been marked completed. Outstanding workmanship!
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      timeline.phases.forEach((p) => setPhasePercentage(p.id, 0));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-xs font-semibold text-emerald-100 transition-colors"
                  >
                    Reset Milestones
                  </button>
                </div>
              )}

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="bg-gradient-to-r from-indigo-600 via-teal-500 to-emerald-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${overallTimelinePercentage}%` }}
                />
              </div>

              {/* Timeline Phase Rail & Milestone Cards */}
              <div className="relative border-l-2 border-indigo-200 ml-4 md:ml-6 pl-6 md:pl-8 space-y-8 py-2">
                {timeline.phases.map((phase, pIdx) => {
                  const isCompleted = phase.completionPercentage === 100;
                  const isInProgress = phase.completionPercentage > 0 && phase.completionPercentage < 100;
                  const isExpanded = !!expandedPhases[phase.id];

                  return (
                    <div key={phase.id} className="relative group">
                      {/* Timeline Node Icon on the rail */}
                      <div
                        className={`absolute -left-[37px] md:-left-[45px] top-1.5 w-7 h-7 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all shadow-md ${
                          isCompleted
                            ? 'bg-emerald-500 border-emerald-600 text-white'
                            : isInProgress
                            ? 'bg-amber-500 border-amber-600 text-white animate-pulse'
                            : 'bg-white border-slate-300 text-slate-600'
                        }`}
                      >
                        {isCompleted ? <Check className="w-4 h-4" /> : pIdx + 1}
                      </div>

                      {/* Phase Card */}
                      <div
                        className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden ${
                          isCompleted
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : isInProgress
                            ? 'border-indigo-400 ring-2 ring-indigo-100 shadow-md'
                            : 'border-slate-200'
                        }`}
                      >
                        {/* Phase Header */}
                        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
                          <div className="space-y-1 flex-1 min-w-[200px]">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  isCompleted
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isInProgress
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Pending'}
                              </span>
                              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {phase.estimatedDuration}
                              </span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                              {phase.phaseName}
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              {phase.description}
                            </p>
                          </div>

                          {/* Phase Percentage & Quick Presets */}
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <span className="text-xs text-slate-400 block font-medium">Phase Progress</span>
                                <span
                                  className={`text-lg font-bold font-mono ${
                                    isCompleted
                                      ? 'text-emerald-600'
                                      : isInProgress
                                      ? 'text-amber-600'
                                      : 'text-slate-600'
                                  }`}
                                >
                                  {phase.completionPercentage}%
                                </span>
                              </div>
                              <button
                                onClick={() => togglePhaseExpanded(phase.id)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                                title={isExpanded ? 'Collapse Phase Steps' : 'Expand Phase Steps'}
                              >
                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                              </button>
                            </div>

                            {/* Quick percentage buttons */}
                            <div className="flex items-center gap-1 text-[10px] bg-slate-50 p-1 rounded-lg border border-slate-200">
                              {[0, 25, 50, 75, 100].map((pct) => (
                                <button
                                  key={pct}
                                  onClick={() => setPhasePercentage(phase.id, pct)}
                                  className={`px-2 py-0.5 rounded font-semibold transition-all ${
                                    phase.completionPercentage === pct
                                      ? pct === 100
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-indigo-600 text-white'
                                      : 'hover:bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {pct}%
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Phase Mini Progress Bar */}
                        <div className="w-full bg-slate-100 h-1.5">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isCompleted
                                ? 'bg-emerald-500'
                                : isInProgress
                                ? 'bg-amber-500'
                                : 'bg-slate-300'
                            }`}
                            style={{ width: `${phase.completionPercentage}%` }}
                          />
                        </div>

                        {/* Milestone Goal Banner */}
                        {phase.milestone && (
                          <div className="bg-slate-50/80 px-5 py-2.5 text-xs text-slate-600 border-b border-slate-100 flex items-center gap-2">
                            <Milestone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="font-semibold text-slate-700">Milestone Goal:</span>
                            <span className="text-slate-600">{phase.milestone}</span>
                          </div>
                        )}

                        {/* Expandable Sub-steps Checklist */}
                        {isExpanded && (
                          <div className="p-5 space-y-3 bg-white">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                              Phase Subtasks ({phase.steps.filter((s) => s.completed).length} / {phase.steps.length} completed):
                            </span>

                            <div className="space-y-2">
                              {phase.steps.map((step) => (
                                <div
                                  key={step.id}
                                  onClick={() => toggleTimelineStep(phase.id, step.id)}
                                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                                    step.completed
                                      ? 'bg-emerald-50/60 border-emerald-200 text-slate-500 line-through'
                                      : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={step.completed}
                                    onChange={() => {}} // handled by parent div
                                    className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer pointer-events-none"
                                  />
                                  <span className="text-xs sm:text-sm font-medium select-none">
                                    {step.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions */}
              <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-200 gap-3">
                <button
                  onClick={() => setActiveView('blueprint')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
                >
                  ← Back to Project Blueprint
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      timeline.phases.forEach((p) => setPhasePercentage(p.id, 100));
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 transition-colors"
                  >
                    Mark All Phases 100%
                  </button>
                  <button
                    onClick={() => {
                      timeline.phases.forEach((p) => setPhasePercentage(p.id, 0));
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                  >
                    Reset Timeline
                  </button>
                  <button
                    onClick={() => setTimeline(null)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Clear Timeline
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectPlannerTab;
