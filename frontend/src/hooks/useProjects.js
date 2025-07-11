import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAllProjects } from '@/services/projectApiService';
import { useError } from '@/context/ErrorContext';
import { handleApiError } from '@/utils/errorHandler';

export const useProjects = () => {
  const { showErrorToast } = useError();

  const queryResult = useQuery({
    queryKey: ['projects'],
    queryFn: getAllProjects,
  });

  useEffect(() => {
    if (queryResult.error) {
      const processedError = handleApiError(
        queryResult.error,
        'fetching projects'
      );
      showErrorToast(processedError);
    }
  }, [queryResult.error, showErrorToast]);

  return queryResult;
};
