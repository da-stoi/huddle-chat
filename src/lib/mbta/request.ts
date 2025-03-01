import { User } from 'next-auth';
import { cacheData, checkCache } from './cache';

// Load environment variables
const MBTA_API_BASE_URL = process.env.MBTA_API_BASE_URL as string;
const MBTA_API_KEY = process.env.MBTA_API_KEY as string;
const DISABLE_CACHE = process.env.DISABLE_CACHE === 'true';

export default async function requestMbta(path: string, user?: User) {
  // FOR DEBUGGING PURPOSES
  // console.log("MBTA API Request Debugging:");
  // console.log("MBTA API BASE URL:", MBTA_API_BASE_URL || "MISSING");
  // console.log("Request Path:", path);
  // console.log("Full Request URL:", `${MBTA_API_BASE_URL}${path}`);
  // console.log("MBTA API KEY:", MBTA_API_KEY ? "Loaded" : "MISSING");

  // Check that MBTA_API_BASE_URL is properly set
  if (!MBTA_API_BASE_URL) {
    throw new Error('MBTA_API_BASE_URL is missing from environment variables.');
  }

  // Check if caching is disabled
  if (!DISABLE_CACHE) {
    // Check if the request is cached
    const cachedData = await checkCache(path, user?.id as string);
    if (cachedData) {
      console.log('Returning cached data.');
      return cachedData;
    }
  }

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add API key only if it's required
  if (MBTA_API_KEY) {
    headers['x-api-key'] = MBTA_API_KEY;
  }

  try {
    // Try fetching the request
    const req = await fetch(`${MBTA_API_BASE_URL}${path}`, { headers });

    // Handle request failures
    if (!req.ok) {
      const errorText = await req.text(); // Capture error response
      throw new Error(
        `Failed to fetch ${path}: ${req.status} ${req.statusText} - ${errorText}`,
      );
    }

    // Extract data from response
    const { data } = await req.json();

    // Cache the response
    cacheData(path, data, user?.id);

    console.log('MBTA API Response Successful.');
    return data;
  } catch (error) {
    console.error('MBTA API Request Failed:', error);
    throw error;
  }
}
