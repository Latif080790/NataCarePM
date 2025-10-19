/**
 * Advanced Search API Service
 * Priority 3F: Advanced Search System
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import type {
  SearchQuery,
  SearchResults,
  SearchResultItem,
  SearchEntityType,
  SearchFacets,
  SavedSearch,
  SearchHistory,
  SearchSuggestion,
} from '../types/search.types';

const SEARCH_HISTORY_COLLECTION = 'searchHistory';
const SAVED_SEARCHES_COLLECTION = 'savedSearches';

class SearchService {
  /**
   * Perform search across all entities
   */
  async search(searchQuery: SearchQuery): Promise<SearchResults> {
    const startTime = Date.now();
    
    try {
      const results: SearchResultItem[] = [];
      const entityTypes = searchQuery.entityTypes || ['all'];

      // Search in each entity type
      if (entityTypes.includes('all') || entityTypes.includes('project')) {
        const projectResults = await this.searchProjects(searchQuery);
        results.push(...projectResults);
      }

      if (entityTypes.includes('all') || entityTypes.includes('task')) {
        const taskResults = await this.searchTasks(searchQuery);
        results.push(...taskResults);
      }

      if (entityTypes.includes('all') || entityTypes.includes('document')) {
        const docResults = await this.searchDocuments(searchQuery);
        results.push(...docResults);
      }

      if (entityTypes.includes('all') || entityTypes.includes('risk')) {
        const riskResults = await this.searchRisks(searchQuery);
        results.push(...riskResults);
      }

      if (entityTypes.includes('all') || entityTypes.includes('change_order')) {
        const changeResults = await this.searchChangeOrders(searchQuery);
        results.push(...changeResults);
      }

      if (entityTypes.includes('all') || entityTypes.includes('resource')) {
        const resourceResults = await this.searchResources(searchQuery);
        results.push(...resourceResults);
      }

      // Sort by relevance
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);

      // Apply pagination
      const page = searchQuery.page || 1;
      const pageSize = searchQuery.pageSize || 20;
      const startIndex = (page - 1) * pageSize;
      const paginatedResults = results.slice(startIndex, startIndex + pageSize);

      // Build facets
      const facets = this.buildFacets(results);

      const searchTime = Date.now() - startTime;

      // Save to search history
      if (searchQuery.userId) {
        await this.addToHistory(searchQuery.userId, {
          query: searchQuery.query,
          timestamp: new Date(),
          resultCount: results.length,
        });
      }

      return {
        query: searchQuery,
        totalResults: results.length,
        results: paginatedResults,
        page,
        pageSize,
        totalPages: Math.ceil(results.length / pageSize),
        facets,
        searchTime,
        executedAt: new Date(),
      };
    } catch (error) {
      console.error('[SearchService] Error performing search:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  /**
   * Search projects
   */
  private async searchProjects(searchQuery: SearchQuery): Promise<SearchResultItem[]> {
    try {
      const projectsQuery = query(collection(db, 'projects'));
      const snapshot = await getDocs(projectsQuery);
      
      const results: SearchResultItem[] = [];
      const searchTerm = searchQuery.query.toLowerCase();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const name = (data.name || '').toLowerCase();
        const description = (data.description || '').toLowerCase();
        
        // Calculate relevance score
        let score = 0;
        if (name.includes(searchTerm)) score += 50;
        if (description.includes(searchTerm)) score += 30;
        if (name === searchTerm) score += 20; // Exact match bonus

        if (score > 0) {
          results.push({
            id: doc.id,
            type: 'project',
            title: data.name,
            description: data.description,
            excerpt: this.generateExcerpt(description, searchTerm),
            relevanceScore: score,
            metadata: {
              status: data.status,
              createdAt: data.createdAt?.toDate(),
              tags: data.tags || [],
            },
            url: `/projects/${doc.id}`,
          });
        }
      });

      return results;
    } catch (error) {
      console.error('[SearchService] Error searching projects:', error);
      return [];
    }
  }

  /**
   * Search tasks
   */
  private async searchTasks(searchQuery: SearchQuery): Promise<SearchResultItem[]> {
    try {
      const tasksQuery = query(collection(db, 'tasks'));
      const snapshot = await getDocs(tasksQuery);
      
      const results: SearchResultItem[] = [];
      const searchTerm = searchQuery.query.toLowerCase();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const title = (data.title || '').toLowerCase();
        const description = (data.description || '').toLowerCase();
        
        let score = 0;
        if (title.includes(searchTerm)) score += 50;
        if (description.includes(searchTerm)) score += 30;

        if (score > 0) {
          results.push({
            id: doc.id,
            type: 'task',
            title: data.title,
            description: data.description,
            excerpt: this.generateExcerpt(description, searchTerm),
            relevanceScore: score,
            metadata: {
              status: data.status,
              priority: data.priority,
              createdAt: data.createdAt?.toDate(),
            },
            url: `/tasks/${doc.id}`,
          });
        }
      });

      return results;
    } catch (error) {
      console.error('[SearchService] Error searching tasks:', error);
      return [];
    }
  }

  /**
   * Search documents
   */
  private async searchDocuments(searchQuery: SearchQuery): Promise<SearchResultItem[]> {
    try {
      const docsQuery = query(collection(db, 'documents'));
      const snapshot = await getDocs(docsQuery);
      
      const results: SearchResultItem[] = [];
      const searchTerm = searchQuery.query.toLowerCase();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const name = (data.name || '').toLowerCase();
        
        let score = 0;
        if (name.includes(searchTerm)) score += 50;

        if (score > 0) {
          results.push({
            id: doc.id,
            type: 'document',
            title: data.name,
            description: data.description,
            relevanceScore: score,
            metadata: {
              category: data.category,
              createdAt: data.createdAt?.toDate(),
            },
            url: `/documents/${doc.id}`,
          });
        }
      });

      return results;
    } catch (error) {
      console.error('[SearchService] Error searching documents:', error);
      return [];
    }
  }

  /**
   * Search risks
   */
  private async searchRisks(searchQuery: SearchQuery): Promise<SearchResultItem[]> {
    try {
      const risksQuery = query(collection(db, 'risks'));
      const snapshot = await getDocs(risksQuery);
      
      const results: SearchResultItem[] = [];
      const searchTerm = searchQuery.query.toLowerCase();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const title = (data.title || '').toLowerCase();
        const description = (data.description || '').toLowerCase();
        
        let score = 0;
        if (title.includes(searchTerm)) score += 50;
        if (description.includes(searchTerm)) score += 30;

        if (score > 0) {
          results.push({
            id: doc.id,
            type: 'risk',
            title: data.title,
            description: data.description,
            excerpt: this.generateExcerpt(description, searchTerm),
            relevanceScore: score,
            metadata: {
              status: data.status,
              priority: data.priorityLevel,
              category: data.category,
              createdAt: data.createdAt?.toDate(),
            },
            url: `/risks/${doc.id}`,
          });
        }
      });

      return results;
    } catch (error) {
      console.error('[SearchService] Error searching risks:', error);
      return [];
    }
  }

  /**
   * Search change orders
   */
  private async searchChangeOrders(searchQuery: SearchQuery): Promise<SearchResultItem[]> {
    try {
      const changeOrdersQuery = query(collection(db, 'changeOrders'));
      const snapshot = await getDocs(changeOrdersQuery);
      
      const results: SearchResultItem[] = [];
      const searchTerm = searchQuery.query.toLowerCase();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const title = (data.title || '').toLowerCase();
        
        let score = 0;
        if (title.includes(searchTerm)) score += 50;

        if (score > 0) {
          results.push({
            id: doc.id,
            type: 'change_order',
            title: data.title,
            description: data.description,
            relevanceScore: score,
            metadata: {
              status: data.status,
              createdAt: data.createdAt?.toDate(),
            },
            url: `/change-orders/${doc.id}`,
          });
        }
      });

      return results;
    } catch (error) {
      console.error('[SearchService] Error searching change orders:', error);
      return [];
    }
  }

  /**
   * Search resources
   */
  private async searchResources(searchQuery: SearchQuery): Promise<SearchResultItem[]> {
    try {
      const resourcesQuery = query(collection(db, 'resources'));
      const snapshot = await getDocs(resourcesQuery);
      
      const results: SearchResultItem[] = [];
      const searchTerm = searchQuery.query.toLowerCase();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const name = (data.name || '').toLowerCase();
        
        let score = 0;
        if (name.includes(searchTerm)) score += 50;

        if (score > 0) {
          results.push({
            id: doc.id,
            type: 'resource',
            title: data.name,
            description: data.description,
            relevanceScore: score,
            metadata: {
              status: data.status,
              category: data.category,
              createdAt: data.createdAt?.toDate(),
            },
            url: `/resources/${doc.id}`,
          });
        }
      });

      return results;
    } catch (error) {
      console.error('[SearchService] Error searching resources:', error);
      return [];
    }
  }

  /**
   * Generate excerpt with highlighted search term
   */
  private generateExcerpt(text: string, searchTerm: string, length: number = 200): string {
    const index = text.indexOf(searchTerm);
    if (index === -1) {
      return text.substring(0, length) + (text.length > length ? '...' : '');
    }

    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + searchTerm.length + 150);
    const excerpt = text.substring(start, end);

    return (start > 0 ? '...' : '') + excerpt + (end < text.length ? '...' : '');
  }

  /**
   * Build search facets
   */
  private buildFacets(results: SearchResultItem[]): SearchFacets {
    const facets: SearchFacets = {
      entityTypes: [],
      statuses: [],
      priorities: [],
      categories: [],
      tags: [],
      dateRanges: [],
    };

    // Count entity types
    const typeCounts = new Map<SearchEntityType, number>();
    results.forEach(r => {
      typeCounts.set(r.type, (typeCounts.get(r.type) || 0) + 1);
    });
    facets.entityTypes = Array.from(typeCounts.entries()).map(([type, count]) => ({
      type,
      count,
    }));

    return facets;
  }

  /**
   * Add to search history
   */
  private async addToHistory(userId: string, searchEntry: any): Promise<void> {
    try {
      const historyRef = doc(db, SEARCH_HISTORY_COLLECTION, userId);
      const historyDoc = await getDoc(historyRef);

      if (historyDoc.exists()) {
        const data = historyDoc.data() as SearchHistory;
        const searches = [searchEntry, ...data.searches].slice(0, 50); // Keep last 50
        
        await updateDoc(historyRef, { searches });
      } else {
        await addDoc(collection(db, SEARCH_HISTORY_COLLECTION), {
          userId,
          searches: [searchEntry],
          maxHistory: 50,
        });
      }
    } catch (error) {
      console.error('[SearchService] Error adding to history:', error);
      // Don't throw - history is non-critical
    }
  }

  /**
   * Save search
   */
  async saveSearch(search: Omit<SavedSearch, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedSearch> {
    try {
      const now = new Date();
      const searchData = {
        ...search,
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      };

      const docRef = await addDoc(collection(db, SAVED_SEARCHES_COLLECTION), searchData);

      return {
        ...search,
        id: docRef.id,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('[SearchService] Error saving search:', error);
      throw new Error(`Failed to save search: ${error.message}`);
    }
  }
}

export const searchService = new SearchService();
export default searchService;
