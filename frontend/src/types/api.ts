export interface InboxItem {
  id: string;
  title: string;
  content: string;
  source: string;
  status: string;
  routeTarget: string | null;
  tags: string;
  imageUrls: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  priority: string;
  tags: string;
  createdAt: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  tags: string;
  createdAt: string;
}

export interface Method {
  id: string;
  title: string;
  content: string;
  tags: string;
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  abstract: string;
  author: string;
  tags: string;
  createdAt: string;
}

export interface FileAsset {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  tags: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

export interface AiMechanism {
  id: string;
  name: string;
  type: string;
  content: string;
  parameters: string;
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

export interface SearchResult {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  content: string;
}
