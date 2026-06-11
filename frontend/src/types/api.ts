export interface InboxItem {
  id: string;
  title: string;
  content: string;
  source: string;
  status: string;
  routeTarget: string | null;
  tags: string;
  mood?: string;
  routedTo?: string;
  sourceUrl?: string;
  aiSummary?: string;
  collectedAt?: string;
  imageUrls: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  action?: string;
  tags?: string;
  createdAt: string;
}

export interface Tool {
  id: string;
  name: string;
  description?: string;
  category: string;
  url?: string;
  corePower?: string;
  initScript?: string;
  rating?: string;
  record?: string;
  tags?: string;
  createdAt: string;
}

export interface Method {
  id: string;
  title: string;
  essence?: string;
  status?: string;
  type?: string;
  learnedDate?: string;
  storage?: string;
  related?: string;
  tags?: string;
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  author?: string;
  url?: string;
  abstract?: string;
  keywords?: string;
  type?: string;
  status?: string;
  importance?: string;
  publishedAt?: string;
  snippet?: string;
  tags?: string;
  createdAt: string;
}

export interface FileAsset {
  id: string;
  filename?: string;
  text?: string;
  date?: string;
  url?: string;
  attachment?: string;
  mimeType?: string;
  size?: number;
  tags?: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  content?: string;
  description?: string;
  status?: string;
  priority?: string;
  startTime: string;
  endTime: string;
  allDay?: string;
  projectId?: string;
  createdAt: string;
}

export interface AiMechanism {
  id: string;
  name: string;
  component?: string;
  coreIdea?: string;
  features?: string;
  featuresDetail?: string;
  examples?: string;
  scenarios?: string;
  scenariosDetail?: string;
  source?: string;
  tags?: string;
  createdAt: string;
}

export interface Resource {
  id: string;
  name: string;
  url?: string;
  type?: string;
  stock?: string;
  status?: string;
  detail?: string;
  tags?: string;
  createdAt: string;
}

export interface Metric {
  id: string;
  name: string;
  value: number;
  unit: string;
  category: string;
  timestamp: string;
}

export interface Insight {
  id: string;
  title: string;
  content: string;
  category: string;
  source: string;
  tags: string;
  createdAt: string;
}

export interface SearchResult {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  content: string;
}
