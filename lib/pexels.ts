// lib/pexels.ts

interface PexelsPhoto {
    id: number;
    url: string;
    src: {
      original: string;
      large2x: string;
      large: string;
      medium: string;
      small: string;
      portrait: string;
      landscape: string;
      tiny: string;
    };
    alt: string;
    photographer: string;
  }
  
  interface PexelsResponse {
    photos: PexelsPhoto[];
    total_results: number;
    page: number;
    per_page: number;
  }
  
  export class PexelsService {
    private apiKey: string;
    private baseUrl = 'https://api.pexels.com/v1';
  
    constructor() {
      this.apiKey = process.env.PEXELS_API || '';
      if (!this.apiKey) {
        console.warn('PEXELS_API key not found in environment variables. Images will not be fetched.');
      }
    }
  
    async searchPhotos(query: string, perPage: number = 1): Promise<string | null> {
      if (!this.apiKey) {
        console.warn('Pexels API key is not configured. Skipping image fetch.');
        return null;
      }
  
      try {
        // Clean and format the query for better results
        const cleanQuery = this.sanitizeQuery(query);
        
        if (!cleanQuery) {
          console.warn('Query is empty after sanitization, skipping image fetch');
          return null;
        }
        
        const response = await fetch(
          `${this.baseUrl}/search?query=${encodeURIComponent(cleanQuery)}&per_page=${perPage}&page=1`,
          {
            headers: {
              'Authorization': this.apiKey,
            },
            // Add timeout to prevent hanging requests
            signal: AbortSignal.timeout(10000), // 10 second timeout
          }
        );
  
        if (!response.ok) {
          if (response.status === 403) {
            console.error('Pexels API: Invalid API key or quota exceeded');
          } else if (response.status === 429) {
            console.error('Pexels API: Rate limit exceeded');
          } else {
            console.error(`Pexels API error: ${response.status} ${response.statusText}`);
          }
          return null;
        }
  
        const data: PexelsResponse = await response.json();
        
        if (data.photos && data.photos.length > 0) {
          // Return medium-sized image for good balance of quality and loading speed
          return data.photos[0].src.medium;
        }
  
        console.log(`No images found for query: "${cleanQuery}"`);
        return null;
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.error('Pexels API request timed out');
          } else {
            console.error('Error fetching image from Pexels:', error.message);
          }
        } else {
          console.error('Unknown error fetching image from Pexels:', error);
        }
        return null;
      }
    }
  
    private sanitizeQuery(query: string): string {
      if (!query || typeof query !== 'string') {
        return '';
      }
      
      // Remove special characters and extra spaces
      // Extract meaningful keywords for better image results
      return query
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
        .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
        .trim()
        .split(' ')
        .filter(word => word.length > 2) // Remove very short words
        .slice(0, 3)              // Take first 3 words for focused results
        .join(' ');
    }
  
    // Method to get a fallback/default image if specific search fails
    async getFallbackImage(): Promise<string | null> {
      if (!this.apiKey) {
        return null;
      }
      return this.searchPhotos('productivity task planning');
    }
  
    // Test method to verify API key is working
    async testConnection(): Promise<boolean> {
      if (!this.apiKey) {
        return false;
      }
      
      try {
        const response = await fetch(
          `${this.baseUrl}/search?query=test&per_page=1&page=1`,
          {
            headers: {
              'Authorization': this.apiKey,
            },
            signal: AbortSignal.timeout(5000),
          }
        );
        
        return response.ok;
      } catch (error) {
        console.error('Pexels connection test failed:', error);
        return false;
      }
    }
  }
  
  export const pexelsService = new PexelsService();