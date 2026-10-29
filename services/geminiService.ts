// Client-side API service communicating exclusively with server-side routes

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface GroundingUrl {
  uri: string;
  title?: string;
}

export interface GeminiResponseData {
  text?: string;
  groundingUrls?: GroundingUrl[];
  imageUrl?: string;
  videoUrl?: string;
  audioBase64?: string;
  mimeType?: string;
  lyrics?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: string;
  specification: string;
  estimatedCost: string;
  searchQuery: string;
  isOptional?: boolean;
  notes?: string;
  checked?: boolean; // user has it or purchased it
}

export interface ShoppingCategory {
  categoryName: string;
  items: ShoppingItem[];
}

export interface ShoppingListResponse {
  projectName?: string;
  totalEstimatedBudget?: string;
  categories: ShoppingCategory[];
}

/**
 * Converts a File object to a Base64 string with its MIME type.
 */
export const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const data = base64String.split(',')[1];
      resolve({ data, mimeType: file.type || 'application/octet-stream' });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Converts a Blob to a Base64 string with its MIME type.
 */
export const blobToBase64 = (blob: Blob): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const data = base64String.split(',')[1];
      resolve({ data, mimeType: blob.type || 'application/octet-stream' });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(blob);
  });
};

/**
 * Product keyword mapping to generate helpful affiliate links for DIY & Garden tools.
 */
const productKeywordsMap: { [key: string]: string } = {
  "hammer": "claw hammer",
  "drill": "cordless drill",
  "screwdriver set": "screwdriver set",
  "tape measure": "tape measure",
  "level": "spirit level",
  "pliers": "pliers set",
  "wrench": "adjustable wrench",
  "saw": "hand saw",
  "shovel": "garden shovel",
  "rake": "garden rake",
  "gardening gloves": "gardening gloves",
  "pruners": "garden bypass pruners",
  "paint brush": "paint brush set",
  "ladder": "step ladder",
  "lumber": "wood lumber",
  "screws": "assorted wood screws",
  "nails": "galvanized nails",
  "wood glue": "waterproof wood glue",
  "safety glasses": "safety glasses",
  "work gloves": "heavy duty work gloves",
  "multimeter": "digital multimeter",
  "spackle": "spackle paste",
  "sandpaper": "assorted grit sandpaper",
  "utility knife": "utility knife",
  "garden hose": "expandable garden hose",
  "sprinkler": "lawn sprinkler",
  "fertilizer": "organic garden fertilizer",
  "potting soil": "organic potting soil",
  "seeds": "vegetable garden seeds",
  "plant pots": "terracotta plant pots",
  "weed puller": "stand up weed puller",
  "compost bin": "outdoor compost bin",
  "soil moisture meter": "soil moisture test meter",
};

export function addAffiliateLinksToText(text: string, associateTag: string = "mytreat-20"): string {
  if (!associateTag) return text;

  const existingLinks: { [placeholder: string]: string } = {};
  let linkCounter = 0;
  const textWithPlaceholders = text.replace(/<a[^>]*>.*?<\/a>/gi, (match) => {
    const placeholder = `__AFFILIATE_LINK_${linkCounter++}__`;
    existingLinks[placeholder] = match;
    return placeholder;
  });

  let processedText = textWithPlaceholders;
  const sortedKeywords = Object.keys(productKeywordsMap).sort((a, b) => b.length - a.length);

  for (const keyword of sortedKeywords) {
    const searchTerm = productKeywordsMap[keyword];
    const encoded = encodeURIComponent(searchTerm);
    const link = `https://www.amazon.com/s?k=${encoded}&tag=${associateTag}`;
    const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');

    processedText = processedText.replace(regex, (_match, p1) => {
      return `<a href="${link}" target="_blank" rel="noopener noreferrer" class="text-emerald-700 hover:text-emerald-900 underline font-semibold inline-flex items-center gap-0.5">${p1} ↗</a>`;
    });
  }

  for (const placeholder in existingLinks) {
    processedText = processedText.replace(placeholder, existingLinks[placeholder]);
  }

  return processedText;
}

// 1. CHATBOT API
export async function sendChatMessage(params: {
  model: 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite';
  history: ChatMessage[];
  message: string;
  systemInstruction?: string;
}): Promise<{ text: string; model: string }> {
  const res = await fetch('/api/chat/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Chat request failed' }));
    throw new Error(err.error || 'Failed to send chat message');
  }
  return res.json();
}

// 2. MUSIC GENERATION API (Lyria 3)
export async function generateMusic(params: {
  prompt: string;
  model?: 'lyria-3-clip-preview' | 'lyria-3-pro-preview';
  image?: { data: string; mimeType: string };
}): Promise<{ audioBase64: string; mimeType: string; lyrics?: string; model: string }> {
  const res = await fetch('/api/music/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Music generation failed' }));
    throw new Error(err.error || 'Failed to generate music');
  }
  return res.json();
}

// 3. IMAGE GENERATION & EDITING API (Gemini Nano Banana 2.1)
export async function generateOrEditImage(params: {
  prompt: string;
  baseImage?: { data: string; mimeType: string };
  aspectRatio?: string;
  imageSize?: '1K' | '2K' | '4K';
  useSearch?: boolean;
}): Promise<{ imageUrl: string; text?: string; model: string }> {
  const res = await fetch('/api/image/generate-or-edit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Image generation failed' }));
    throw new Error(err.error || 'Failed to generate image');
  }
  return res.json();
}

// 4. TEXT-TO-VIDEO API (Omni Flash)
export async function generateTextToVideo(params: {
  prompt: string;
  aspectRatio?: '16:9' | '9:16';
  duration?: '5s' | '10s';
  resolution?: '720p' | '1080p';
}): Promise<{ videoUrl: string; aspectRatio: string; model: string }> {
  const res = await fetch('/api/video/generate-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Video generation failed' }));
    throw new Error(err.error || 'Failed to generate video');
  }
  return res.json();
}

// 5. ANIMATE IMAGE INTO VIDEO API (Omni Flash)
export async function animateImageToVideo(params: {
  image: { data: string; mimeType: string };
  motionPrompt?: string;
  aspectRatio?: '16:9' | '9:16';
}): Promise<{ videoUrl: string; aspectRatio: string; model: string }> {
  const res = await fetch('/api/video/animate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Animate image to video failed' }));
    throw new Error(err.error || 'Failed to animate image to video');
  }
  return res.json();
}

// 6. SEARCH GROUNDING API (Gemini 3.8 Flash)
export async function searchGrounding(params: {
  prompt: string;
  systemInstruction?: string;
}): Promise<{ text: string; groundingUrls: GroundingUrl[]; model: string }> {
  const res = await fetch('/api/grounding/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Search grounding failed' }));
    throw new Error(err.error || 'Failed to execute search grounding');
  }
  return res.json();
}

// 7. MAPS GROUNDING API (Gemini 3.8 Flash)
export async function mapsGrounding(params: {
  prompt: string;
  locationContext?: string;
}): Promise<{ text: string; groundingChunks: any[]; model: string }> {
  const res = await fetch('/api/grounding/maps', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Maps grounding failed' }));
    throw new Error(err.error || 'Failed to execute maps grounding');
  }
  return res.json();
}

// 8. AUDIO TRANSCRIPTION API (Gemini 3.5 Transcribe)
export async function transcribeAudio(params: {
  audioData: string;
  mimeType?: string;
}): Promise<{ transcription: string; model: string }> {
  const res = await fetch('/api/audio/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Audio transcription failed' }));
    throw new Error(err.error || 'Failed to transcribe audio');
  }
  return res.json();
}

// 9. PROJECT PLANNER / GENERAL API
export async function generateProjectPlan(params: {
  prompt: string;
  systemInstruction?: string;
  image?: { data: string; mimeType: string };
  amazonAssociateTag?: string;
}): Promise<{ text: string; groundingUrls: GroundingUrl[]; model: string }> {
  const res = await fetch('/api/planner/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Project plan generation failed' }));
    throw new Error(err.error || 'Failed to generate project plan');
  }
  return res.json();
}

// 10. EXTRACT SHOPPING CHECKLIST API
export async function extractShoppingList(projectText: string): Promise<ShoppingListResponse> {
  const res = await fetch('/api/planner/extract-shopping-list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectText }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Shopping list extraction failed' }));
    throw new Error(err.error || 'Failed to extract shopping list.');
  }
  const data = await res.json();
  // Ensure items have unique IDs and initial checked state
  const formattedCategories: ShoppingCategory[] = (data.categories || []).map((cat: any, cIdx: number) => ({
    categoryName: cat.categoryName || 'General Items',
    items: (cat.items || []).map((item: any, iIdx: number) => ({
      ...item,
      id: `item-${cIdx}-${iIdx}`,
      checked: false,
    })),
  }));

  return {
    projectName: data.projectName,
    totalEstimatedBudget: data.totalEstimatedBudget,
    categories: formattedCategories,
  };
}

// 11. TIMELINE INTERFACES & API
export interface PhaseStep {
  id: string;
  title: string;
  completed: boolean;
}

export interface ProjectPhase {
  id: string;
  phaseName: string;
  estimatedDuration: string;
  description: string;
  milestone?: string;
  steps: PhaseStep[];
  completionPercentage: number;
}

export interface TimelineResponse {
  projectName?: string;
  totalEstimatedDuration?: string;
  phases: ProjectPhase[];
}

export async function extractTimeline(projectText: string): Promise<TimelineResponse> {
  const res = await fetch('/api/planner/extract-timeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectText }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Timeline extraction failed' }));
    throw new Error(err.error || 'Failed to extract project timeline.');
  }
  const data = await res.json();
  const formattedPhases: ProjectPhase[] = (data.phases || []).map((p: any, pIdx: number) => {
    const steps: PhaseStep[] = (p.steps || []).map((stepText: string, sIdx: number) => ({
      id: `phase-${pIdx}-step-${sIdx}`,
      title: typeof stepText === 'string' ? stepText : (stepText as any)?.title || 'Task step',
      completed: false,
    }));
    return {
      id: `phase-${pIdx}`,
      phaseName: p.phaseName || `Phase ${pIdx + 1}`,
      estimatedDuration: p.estimatedDuration || '1 Day',
      description: p.description || '',
      milestone: p.milestone || '',
      steps,
      completionPercentage: 0,
    };
  });

  return {
    projectName: data.projectName,
    totalEstimatedDuration: data.totalEstimatedDuration,
    phases: formattedPhases,
  };
}