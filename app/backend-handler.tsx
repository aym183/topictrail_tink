'use client'
// backend-handler.tsx
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { root } from 'postcss';

dotenv.config();

const supabaseUrl = 'https://migbaueucuvtlcthzlzh.supabase.co'; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ2JhdWV1Y3V2dGxjdGh6bHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUxMTYzODQsImV4cCI6MjA1MDY5MjM4NH0.UfY3xAlnE7EsBSBjoPTTMndYrIOWgRxsR0Nz0YJ8B0g';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class BackendHandler {
  private static readonly baseUrl = 'https://totpictrail-backend-7d9b84224f41.herokuapp.com';

  static getBaseUrl(): string {
    return this.baseUrl;
  }

  static async checkHealth(): Promise<boolean> {
    try {
      console.log('Attempting to connect to:', `${this.baseUrl}/health`);
      const response = await fetch(`${this.baseUrl}/health`);
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      return data.status === 'healthy';
    } catch (error) {
      console.error('Backend health check failed. Full error:', error);
      return false;
    }
  }

  static async testBackendConnection() {
    try {
      // Test ping endpoint
      const pingResponse = await fetch(`${this.baseUrl}/ping`);
      console.log('Ping response:', await pingResponse.text());
      
      // Test health endpoint
      const healthResponse = await fetch(`${this.baseUrl}/health`);
      console.log('Health response:', await healthResponse.text());
    } catch (error) {
      console.error('Connection test failed:', error);
    }
  }

  /**
   * Processes the initial user input and retrieves topic suggestions
   */

  static async processUserInput(input: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate-base-tree?prompt=${encodeURIComponent(input)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      // Store the branch_id and tree_root in sessionStorage
      if (data.branch_id && data.tree_root) {
        sessionStorage.setItem('branch_id', data.branch_id);
        sessionStorage.setItem('tree_root', data.tree_root);
      }

      return {
        success: response.ok,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to process user input',
      };
    }
  }

  static async fetchNodesAndEdges(branchId: string) {

    try {
      const response = await fetch(`${this.baseUrl}/fetch-nodes-and-edges?branch_id=${encodeURIComponent(branchId)}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
      });
      
      const data = await response.json();
      
      return { nodes: data.nodes, edges: data.edges };
    } catch (error) {
      console.error('Failed to fetch nodes and edges:', error);
      return { nodes: [], edges: [] };
    }
  }

    /**
   * Expands on a given topic with additional information
   */
    static async expandElement(branchId: string, parentId: string, parentValue: string, root: string): Promise<ApiResponse> {
      try {
        const queryParams = new URLSearchParams({
          branch_id: branchId,
          parent_id: parentId,
          parent_value: parentValue,
          root: root
        });

        const response = await fetch(`${this.baseUrl}/expand-element?${queryParams.toString()}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Expand request failed:', errorText);
          throw new Error(`Failed to expand element: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return {
          success: true,
          data: data,
        };
      } catch (error) {
        console.error('Error in expandElement:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to expand element',
        };
      }
    }

    static async subscribeToBranchChanges(branchId: string, onUpdate: (nodes: any[], edges: any[]) => void) {
      return supabase
        .channel(`branches:branch_id=eq.${branchId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'branches' }, (payload: any) => {
          const { nodes, edges } = payload.new;
          onUpdate(nodes, edges);
        })
        .subscribe();
    }

  /**
   * Generates a summary for the selected topic
   */
  static async generateSummary(topic: string, root: string, branch_id: string, parent_value: string, onData: (chunk: string) => void): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/summarise-element?topic=${encodeURIComponent(topic)}&root=${encodeURIComponent(root)}&branch_id=${encodeURIComponent(branch_id)}&parent_value=${encodeURIComponent(parent_value)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: true });
        onData(chunk);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate summary',
      };
    }
  }

  /**
   * Generates detailed knowledge about a topic
   */
  static async generateKnowledge(topic: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate-knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic }),
      });

      const data = await response.json();
      return {
        success: response.ok,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate knowledge',
      };
    }
  }

  /**
   * Fetches academic sources for a given topic
   */
  static async fetchAcademicSources(topic: string, root: string, onData: (source: any) => void): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/fetch-academic-sources?topic=${encodeURIComponent(topic)}&root=${encodeURIComponent(root)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: true });
        
        // Process each line (each paper)
        const lines = chunk.split('\n').filter(line => line.trim());
        for (const line of lines) {
          try {
            const paper = JSON.parse(line);
            onData(paper);
          } catch (e) {
            console.error('Error parsing paper:', e);
          }
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch academic sources',
      };
    }
  }

  /**
   * Generates a concise summary of a topic
   */
  static async generateTopicSummary(topic: string, root: string, onData: (chunk: string) => void): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate-topic-summary?topic=${encodeURIComponent(topic)}&root=${encodeURIComponent(root)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value, { stream: true });
        onData(chunk);
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to generate topic summary',
      };
    }
  }
} 