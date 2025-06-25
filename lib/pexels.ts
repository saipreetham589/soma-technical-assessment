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
        console.warn('PEXELS_API key not found in environment variables');
      }
    }
  
    async searchPhotos(query: string, perPage: number = 1): Promise<string | null> {
      if (!this.apiKey) {
        console.error('Pexels API key is not configured');
        return null;
      }
  
      try {
        // Clean and format the query for better results
        const cleanQuery = this.sanitizeQuery(query);
        
        const response = await fetch(
          `${this.baseUrl}/search?query=${encodeURIComponent(cleanQuery)}&per_page=${perPage}&page=1`,
          {
            headers: {
              'Authorization': this.apiKey,
            },
          }
        );
  
        if (!response.ok) {
          console.error(`Pexels API error: ${response.status} ${response.statusText}`);
          return null;
        }
  
        const data: PexelsResponse = await response.json();
        
        if (data.photos && data.photos.length > 0) {
          // Return medium-sized image for good balance of quality and loading speed
          return data.photos[0].src.medium;
        }
  
        return null;
      } catch (error) {
        console.error('Error fetching image from Pexels:', error);
        return null;
      }
    }
  
    private sanitizeQuery(query: string): string {
      // Remove special characters and extra spaces
      // Extract meaningful keywords for better image results
      return query
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
        .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
        .trim()
        .split(' ')
        .slice(0, 3)              // Take first 3 words for focused results
        .join(' ');
    }
  
    // Method to get a fallback/default image if specific search fails
    async getFallbackImage(): Promise<string | null> {
      return this.searchPhotos('productivity task planning');
    }
  }
  
  export const pexelsService = new PexelsService();