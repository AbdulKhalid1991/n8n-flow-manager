/**
 * Workflow Repository Integration
 * Integrates external workflow repositories for Claude Code reference
 */

import axios from 'axios';
import https from 'https';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class WorkflowRepository {
  constructor() {
    this.repositories = [
      {
        name: 'Zie619/n8n-workflows',
        type: 'api',
        baseUrl: 'https://n8n-workflows.zie619.com/api',
        apiEndpoints: {
          search: '/workflows/search',
          categories: '/categories',
          workflow: '/workflow',
          stats: '/stats'
        },
        quality: 95,
        count: 2053,
        features: ['full-text-search', 'rest-api', 'metadata']
      },
      {
        name: 'oxbshw/ultimate-n8n-ai-workflows',
        type: 'github',
        url: 'https://api.github.com/repos/oxbshw/ultimate-n8n-ai-workflows/contents/workflows',
        rawUrl: 'https://raw.githubusercontent.com/oxbshw/ultimate-n8n-ai-workflows/main',
        quality: 88,
        count: 3400,
        features: ['ai-focused', 'enterprise-grade', 'error-handling']
      },
      {
        name: 'felipfr/awesome-n8n-workflows',
        type: 'github',
        url: 'https://api.github.com/repos/felipfr/awesome-n8n-workflows/contents/workflows',
        rawUrl: 'https://raw.githubusercontent.com/felipfr/awesome-n8n-workflows/main',
        quality: 82,
        count: 2000,
        features: ['business-focused', 'curated', 'categorized']
      }
    ];

    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    this.initialized = false;
    this.workflowIndex = [];
  }

  /**
   * Initialize the workflow repository system
   */
  async initialize() {
    try {
      logger.info('🔄 Initializing Workflow Repository System...');
      
      // Create cache directory
      const cacheDir = path.join(__dirname, '../../cache/workflows');
      await fs.mkdir(cacheDir, { recursive: true });
      
      // Load cached workflow index if exists
      await this.loadWorkflowIndex();
      
      // Test repository connections
      await this.testRepositoryConnections();
      
      this.initialized = true;
      logger.info(`✅ Workflow Repository System initialized with ${this.repositories.length} repositories`);
      
      return {
        success: true,
        message: 'Workflow repositories initialized',
        repositories: this.repositories.length,
        totalWorkflows: this.repositories.reduce((sum, repo) => sum + repo.count, 0)
      };
      
    } catch (error) {
      logger.error('Failed to initialize workflow repositories:', error);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  /**
   * Search for workflows across all repositories
   */
  async searchWorkflows(query, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    logger.info(`🔍 Searching workflows for: "${query}"`);
    
    const {
      limit = 20,
      category = null,
      aiOnly = false,
      businessOnly = false,
      minQuality = 80
    } = options;

    try {
      const searchPromises = this.repositories
        .filter(repo => repo.quality >= minQuality)
        .filter(repo => {
          if (aiOnly && !repo.features.includes('ai-focused')) return false;
          if (businessOnly && !repo.features.includes('business-focused')) return false;
          return true;
        })
        .map(repo => this.searchRepository(repo, query, { limit: Math.ceil(limit / this.repositories.length) }));

      const results = await Promise.allSettled(searchPromises);
      
      // Combine and rank results
      const allWorkflows = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          result.value.workflows.forEach(workflow => {
            allWorkflows.push({
              ...workflow,
              source: this.repositories[index].name,
              quality: this.repositories[index].quality,
              features: this.repositories[index].features
            });
          });
        }
      });

      // Sort by relevance and quality
      const sortedWorkflows = allWorkflows
        .sort((a, b) => {
          const aScore = this.calculateRelevanceScore(a, query);
          const bScore = this.calculateRelevanceScore(b, query);
          return bScore - aScore;
        })
        .slice(0, limit);

      return {
        success: true,
        query: query,
        results: sortedWorkflows,
        total: allWorkflows.length,
        repositories: results.filter(r => r.status === 'fulfilled').length,
        cached: false
      };

    } catch (error) {
      logger.error('Workflow search failed:', error);
      return {
        success: false,
        error: error.message,
        query: query
      };
    }
  }

  /**
   * Get workflow by ID from specific repository
   */
  async getWorkflow(workflowId, repositoryName) {
    if (!this.initialized) {
      await this.initialize();
    }

    const repository = this.repositories.find(r => r.name === repositoryName);
    if (!repository) {
      throw new Error(`Repository ${repositoryName} not found`);
    }

    logger.info(`📄 Fetching workflow ${workflowId} from ${repositoryName}`);

    try {
      const workflow = await this.fetchWorkflowFromRepository(repository, workflowId);
      
      return {
        success: true,
        workflow: workflow,
        source: repositoryName,
        quality: repository.quality,
        features: repository.features
      };

    } catch (error) {
      logger.error(`Failed to fetch workflow ${workflowId}:`, error);
      return {
        success: false,
        error: error.message,
        workflowId: workflowId,
        repository: repositoryName
      };
    }
  }

  /**
   * Get workflow recommendations for a specific task
   */
  async getWorkflowRecommendations(task, options = {}) {
    logger.info(`💡 Getting workflow recommendations for: "${task}"`);

    const {
      count = 5,
      includeAI = true,
      includeBusiness = true,
      minNodes = 0,
      maxNodes = 50
    } = options;

    try {
      // Enhanced search with task-specific keywords
      const searchTerms = this.extractTaskKeywords(task);
      const searchResults = await this.searchWorkflows(searchTerms.join(' '), {
        limit: count * 2, // Get more results to filter
        aiOnly: !includeBusiness,
        businessOnly: !includeAI
      });

      if (!searchResults.success) {
        throw new Error('Search failed');
      }

      // Filter and enhance recommendations
      const recommendations = searchResults.results
        .filter(workflow => {
          const nodeCount = workflow.nodeCount || 0;
          return nodeCount >= minNodes && nodeCount <= maxNodes;
        })
        .slice(0, count)
        .map(workflow => ({
          ...workflow,
          relevanceScore: this.calculateTaskRelevance(workflow, task),
          recommendation: this.generateWorkflowRecommendation(workflow, task)
        }));

      return {
        success: true,
        task: task,
        recommendations: recommendations,
        searchTerms: searchTerms,
        total: recommendations.length
      };

    } catch (error) {
      logger.error('Failed to get workflow recommendations:', error);
      return {
        success: false,
        error: error.message,
        task: task
      };
    }
  }

  /**
   * Get workflow templates for Claude Code generation
   */
  async getWorkflowTemplates(category = 'general', options = {}) {
    logger.info(`📋 Getting workflow templates for category: ${category}`);

    const {
      includeMetadata = true,
      includeNodes = true,
      includeConnections = true,
      simplify = false
    } = options;

    try {
      const searchQuery = this.getCategorySearchTerms(category);
      const searchResults = await this.searchWorkflows(searchQuery, {
        limit: 10,
        category: category
      });

      if (!searchResults.success) {
        throw new Error('Template search failed');
      }

      // Convert workflows to templates
      const templates = searchResults.results.map(workflow => {
        let template = {
          id: workflow.id || workflow.name?.replace(/[^a-zA-Z0-9]/g, '_'),
          name: workflow.name,
          description: workflow.description,
          category: category,
          source: workflow.source,
          quality: workflow.quality,
          tags: workflow.tags || [],
          complexity: this.calculateWorkflowComplexity(workflow)
        };

        if (includeMetadata) {
          template.metadata = {
            nodeCount: workflow.nodeCount || 0,
            triggerType: workflow.triggerType,
            integrations: workflow.integrations || [],
            aiCapable: workflow.features?.includes('ai-focused'),
            businessReady: workflow.features?.includes('business-focused')
          };
        }

        if (includeNodes && workflow.nodes) {
          template.nodes = simplify ? 
            this.simplifyNodes(workflow.nodes) : 
            workflow.nodes;
        }

        if (includeConnections && workflow.connections) {
          template.connections = workflow.connections;
        }

        template.usage = this.generateUsageInstructions(workflow, category);

        return template;
      });

      return {
        success: true,
        category: category,
        templates: templates,
        total: templates.length,
        sources: [...new Set(templates.map(t => t.source))]
      };

    } catch (error) {
      logger.error('Failed to get workflow templates:', error);
      return {
        success: false,
        error: error.message,
        category: category
      };
    }
  }

  /**
   * Search specific repository
   */
  async searchRepository(repository, query, options = {}) {
    const cacheKey = `search_${repository.name}_${query}_${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      let result;
      
      if (repository.type === 'api') {
        result = await this.searchApiRepository(repository, query, options);
      } else if (repository.type === 'github') {
        result = await this.searchGithubRepository(repository, query, options);
      } else {
        throw new Error(`Unsupported repository type: ${repository.type}`);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      logger.error(`Search failed for repository ${repository.name}:`, error);
      return {
        success: false,
        error: error.message,
        workflows: []
      };
    }
  }

  /**
   * Search API-based repository (Zie619/n8n-workflows)
   */
  async searchApiRepository(repository, query, options = {}) {
    const searchUrl = `${repository.baseUrl}${repository.apiEndpoints.search}`;
    
    const params = {
      q: query,
      limit: options.limit || 10,
      offset: options.offset || 0
    };

    const response = await axios.get(searchUrl, {
      params: params,
      timeout: 10000,
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });

    if (!response.data || !response.data.workflows) {
      throw new Error('Invalid API response format');
    }

    return {
      success: true,
      workflows: response.data.workflows.map(workflow => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        nodeCount: workflow.node_count,
        triggerType: workflow.trigger_type,
        tags: workflow.tags || [],
        integrations: workflow.integrations || [],
        complexity: workflow.complexity || 'medium',
        apiData: workflow
      })),
      total: response.data.total || 0,
      repository: repository.name
    };
  }

  /**
   * Search GitHub-based repository
   */
  async searchGithubRepository(repository, query, options = {}) {
    // For GitHub repositories, we'll implement a simplified search
    // In production, this would use GitHub's search API or local indexing
    
    return {
      success: true,
      workflows: [
        {
          id: `github_${repository.name}_sample`,
          name: `Sample workflow for ${query}`,
          description: `AI-generated workflow template based on ${query}`,
          nodeCount: 5,
          triggerType: 'webhook',
          tags: ['sample', 'template'],
          integrations: ['http', 'email'],
          complexity: 'medium',
          githubData: {
            repository: repository.name,
            searchQuery: query
          }
        }
      ],
      total: 1,
      repository: repository.name
    };
  }

  /**
   * Test repository connections
   */
  async testRepositoryConnections() {
    logger.info('🔗 Testing repository connections...');

    const testPromises = this.repositories.map(async repo => {
      try {
        if (repo.type === 'api') {
          const response = await axios.get(`${repo.baseUrl}${repo.apiEndpoints.stats}`, {
            timeout: 5000,
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
          });
          return { name: repo.name, status: 'connected', data: response.data };
        } else {
          return { name: repo.name, status: 'available', type: repo.type };
        }
      } catch (error) {
        return { name: repo.name, status: 'failed', error: error.message };
      }
    });

    const results = await Promise.allSettled(testPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const test = result.value;
        if (test.status === 'connected') {
          logger.info(`✅ ${test.name}: Connected`);
        } else if (test.status === 'available') {
          logger.info(`📁 ${test.name}: Available (${test.type})`);
        } else {
          logger.warn(`⚠️ ${test.name}: ${test.error}`);
        }
      }
    });
  }

  // Helper methods

  calculateRelevanceScore(workflow, query) {
    let score = 0;
    const queryLower = query.toLowerCase();
    const name = (workflow.name || '').toLowerCase();
    const description = (workflow.description || '').toLowerCase();
    const tags = (workflow.tags || []).join(' ').toLowerCase();

    // Name match (highest weight)
    if (name.includes(queryLower)) score += 100;
    
    // Description match
    if (description.includes(queryLower)) score += 50;
    
    // Tags match
    if (tags.includes(queryLower)) score += 30;
    
    // Quality bonus
    score += (workflow.quality || 0) * 0.1;
    
    // Node count bonus (moderate complexity preferred)
    const nodeCount = workflow.nodeCount || 0;
    if (nodeCount >= 3 && nodeCount <= 15) score += 20;

    return score;
  }

  calculateTaskRelevance(workflow, task) {
    const taskKeywords = this.extractTaskKeywords(task);
    const workflowText = `${workflow.name} ${workflow.description} ${workflow.tags?.join(' ')}`.toLowerCase();
    
    let relevance = 0;
    taskKeywords.forEach(keyword => {
      if (workflowText.includes(keyword.toLowerCase())) {
        relevance += 10;
      }
    });
    
    return relevance;
  }

  extractTaskKeywords(task) {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by'];
    return task
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word));
  }

  getCategorySearchTerms(category) {
    const categoryMap = {
      'general': 'automation workflow',
      'ai': 'artificial intelligence machine learning AI',
      'business': 'business process automation CRM',
      'communication': 'email slack telegram discord notification',
      'data': 'data processing ETL database',
      'marketing': 'marketing social media campaign',
      'ecommerce': 'ecommerce shop store payment',
      'monitoring': 'monitoring alerts logging',
      'finance': 'finance accounting invoice payment'
    };
    
    return categoryMap[category] || category;
  }

  calculateWorkflowComplexity(workflow) {
    const nodeCount = workflow.nodeCount || 0;
    if (nodeCount <= 3) return 'simple';
    if (nodeCount <= 8) return 'medium';
    return 'complex';
  }

  simplifyNodes(nodes) {
    return nodes.map(node => ({
      type: node.type,
      name: node.name,
      parameters: node.parameters ? Object.keys(node.parameters) : []
    }));
  }

  generateWorkflowRecommendation(workflow, task) {
    return {
      why: `This workflow is relevant because it matches your task: "${task}"`,
      howToUse: `Customize the parameters and connections based on your specific requirements`,
      modifications: ['Update credentials', 'Modify parameters', 'Test thoroughly'],
      complexity: this.calculateWorkflowComplexity(workflow)
    };
  }

  generateUsageInstructions(workflow, category) {
    return {
      setup: [
        'Import the workflow JSON into your n8n instance',
        'Configure required credentials',
        'Update node parameters as needed'
      ],
      requirements: workflow.integrations || [],
      testing: [
        'Test with sample data first',
        'Verify all connections work',
        'Check error handling'
      ]
    };
  }

  async loadWorkflowIndex() {
    try {
      const indexPath = path.join(__dirname, '../../cache/workflows/index.json');
      const indexData = await fs.readFile(indexPath, 'utf8');
      this.workflowIndex = JSON.parse(indexData);
      logger.info(`📚 Loaded workflow index with ${this.workflowIndex.length} entries`);
    } catch (error) {
      logger.info('No workflow index found, will create new one');
      this.workflowIndex = [];
    }
  }

  async saveWorkflowIndex() {
    try {
      const indexPath = path.join(__dirname, '../../cache/workflows/index.json');
      await fs.writeFile(indexPath, JSON.stringify(this.workflowIndex, null, 2));
      logger.info('💾 Workflow index saved');
    } catch (error) {
      logger.error('Failed to save workflow index:', error);
    }
  }

  async fetchWorkflowFromRepository(repository, workflowId) {
    // Implementation would fetch full workflow data
    // This is a placeholder for the actual implementation
    return {
      id: workflowId,
      name: `Workflow from ${repository.name}`,
      nodes: [],
      connections: {},
      source: repository.name
    };
  }

  getStatus() {
    return {
      initialized: this.initialized,
      repositories: this.repositories.length,
      totalWorkflows: this.repositories.reduce((sum, repo) => sum + repo.count, 0),
      cacheSize: this.cache.size,
      indexSize: this.workflowIndex.length,
      lastUpdate: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const workflowRepository = new WorkflowRepository();