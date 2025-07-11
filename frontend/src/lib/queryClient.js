import { QueryClient } from '@tanstack/react-query';
import { api } from '@/services/apiClient';

/**
 * Custom query function that uses our centralized API client.
 * The `queryKey` array is destructured to get the URL.
 * Example: `useQuery({ queryKey: ['/projects'] })` will call `api.get('/projects')`
 * Example: `useQuery({ queryKey: ['/projects', projectId] })` will call `api.get('/projects/some-id')`
 */
const defaultQueryFn = async ({ queryKey }) => {
  // Handle URL construction more safely
  const [baseUrl, ...params] = queryKey;
  const url = params.length > 0 ? `${baseUrl}/${params.join('/')}` : baseUrl;
  const { data } = await api.get(url, `fetching ${baseUrl}`);
  return data;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Use our custom query function as the default for all queries
      queryFn: defaultQueryFn,
      // Keep data fresh for 2 minutes in the background, refetch every 5 minutes
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 5, // 5 minutes, was cacheTime
      // Retry failed requests once, with a small delay
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Do not refetch automatically when the window is refocused
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Centralized error handling for mutations
      onError: (error, variables, context, mutation) => {
        // The global interceptor in apiClient.js already handles showing a toast.
        // We could add more specific logic here if needed in the future.
        console.error(
          `A mutation with key ${mutation.options.mutationKey} failed:`,
          error
        );
      },
    },
  },
});
