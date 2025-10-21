/**
 * Advanced Search Type Definitions
 * Priority 3F: Advanced Search System
 */

export type SearchEntityType =
  | 'project'
  | 'task'
  | 'document'
  | 'risk'
  | 'change_order'
  | 'resource'
  | 'quality_inspection'
  | 'defect'
  | 'user'
  | 'all';

export type SearchSortField = 'relevance' | 'date' | 'name' | 'status' | 'priority';

export type SearchSortOrder = 'asc' | 'desc';

export interface SearchableEntity {
  id: string;
  type: SearchEntityType;
  title: string;
  description?: string;
  content?: string; // Full text content for search
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchQuery {
  query: string; // Search term
  entityTypes?: SearchEntityType[];

  filters?: SearchFilters;

  sortBy?: SearchSortField;
  sortOrder?: SearchSortOrder;

  page?: number;
  pageSize?: number;

  includeArchived?: boolean;
  fuzzyMatch?: boolean;

  userId?: string; // For personalized search
}

export interface SearchFilters {
  // Common filters
  status?: string[];
  priority?: string[];
  category?: string[];
  tags?: string[];

  // Date filters
  dateRange?: {
    field: 'created' | 'updated' | 'due' | 'completed';
    start?: Date;
    end?: Date;
  };

  // Assignment filters
  assignedTo?: string[];
  createdBy?: string[];
  owner?: string[];

  // Project/location filters
  projectId?: string[];
  location?: string[];

  // Numeric filters
  costRange?: {
    min?: number;
    max?: number;
  };

  scoreRange?: {
    min?: number;
    max?: number;
  };

  // Custom field filters
  customFilters?: {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
    value: any;
  }[];
}

export interface SearchResultItem {
  id: string;
  type: SearchEntityType;

  title: string;
  description?: string;
  excerpt?: string; // Highlighted excerpt from content

  relevanceScore: number; // 0-100

  highlights?: {
    field: string;
    snippets: string[]; // HTML with <mark> tags
  }[];

  metadata: {
    status?: string;
    priority?: string;
    category?: string;
    tags?: string[];
    createdAt: Date;
    updatedAt?: Date;
    [key: string]: any;
  };

  url: string; // Deep link to entity
  icon?: string;
}

export interface SearchResults {
  query: SearchQuery;

  totalResults: number;
  results: SearchResultItem[];

  page: number;
  pageSize: number;
  totalPages: number;

  groupedResults?: {
    [key in SearchEntityType]?: {
      count: number;
      results: SearchResultItem[];
    };
  };

  facets?: SearchFacets;

  suggestions?: string[]; // Did you mean...

  searchTime: number; // milliseconds

  executedAt: Date;
}

export interface SearchFacets {
  entityTypes: {
    type: SearchEntityType;
    count: number;
  }[];

  statuses?: {
    status: string;
    count: number;
  }[];

  priorities?: {
    priority: string;
    count: number;
  }[];

  categories?: {
    category: string;
    count: number;
  }[];

  tags?: {
    tag: string;
    count: number;
  }[];

  dateRanges?: {
    range: string; // 'Last 7 days', 'Last month', etc.
    count: number;
  }[];
}

export interface SearchHistory {
  userId: string;

  searches: {
    query: string;
    timestamp: Date;
    resultCount: number;
    clicked?: string; // ID of clicked result
  }[];

  maxHistory: number; // Default 50
}

export interface SavedSearch {
  id: string;
  userId: string;

  name: string;
  description?: string;

  query: SearchQuery;

  isDefault?: boolean;
  isPinned?: boolean;

  notifications?: {
    enabled: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
    lastNotified?: Date;
  };

  createdAt: Date;
  updatedAt: Date;
}

export interface SearchSuggestion {
  term: string;
  type: 'recent' | 'popular' | 'autocomplete';
  score: number;
  metadata?: {
    count?: number; // How many times searched
    lastSearched?: Date;
  };
}

export interface SearchAnalytics {
  period: {
    start: Date;
    end: Date;
  };

  totalSearches: number;
  uniqueUsers: number;

  topQueries: {
    query: string;
    count: number;
    clickThroughRate: number; // percentage
  }[];

  zeroResultQueries: {
    query: string;
    count: number;
  }[];

  popularEntities: {
    type: SearchEntityType;
    searchCount: number;
  }[];

  averageResultsPerSearch: number;
  averageSearchTime: number; // milliseconds

  clickThroughRate: number; // percentage

  userEngagement: {
    searchesPerUser: number;
    refinementRate: number; // How often users refine searches
  };
}

export interface SearchIndex {
  // Indexed entities for fast search
  projects: SearchableEntity[];
  tasks: SearchableEntity[];
  documents: SearchableEntity[];
  risks: SearchableEntity[];
  changeOrders: SearchableEntity[];
  resources: SearchableEntity[];
  qualityInspections: SearchableEntity[];
  defects: SearchableEntity[];
  users: SearchableEntity[];

  lastIndexed: Date;
  indexSize: number; // bytes
  documentCount: number;
}

export interface SearchFilterPreset {
  id: string;
  name: string;
  description?: string;

  filters: SearchFilters;

  isPublic: boolean; // Available to all users
  createdBy: string;

  usageCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface SearchConfig {
  // Search behavior configuration
  fuzzyMatchThreshold: number; // 0-1, lower = more fuzzy
  maxResults: number;
  defaultPageSize: number;

  // Boost factors for relevance scoring
  boostFactors: {
    titleMatch: number; // Default 2.0
    exactMatch: number; // Default 3.0
    recentDocuments: number; // Default 1.2
    popularDocuments: number; // Default 1.1
  };

  // Indexing configuration
  indexUpdateInterval: number; // minutes
  indexedFields: {
    [key in SearchEntityType]?: string[];
  };

  // Feature flags
  enableFuzzyMatch: boolean;
  enableSuggestions: boolean;
  enableFacets: boolean;
  enableHighlighting: boolean;
  enableSpellCheck: boolean;
}

export default SearchQuery;
