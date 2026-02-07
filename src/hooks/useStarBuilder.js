import { useState, useCallback } from 'react';

const initialStarState = {
  situation: '',
  task: '',
  action: '',
  result: '',
  competency: '',
  jobContext: ''
};

export function useStarBuilder() {
  const [star, setStar] = useState(initialStarState);

  const updateStar = useCallback((updates) => {
    setStar(prev => {
      const newStar = { ...prev };

      if (updates.situation !== undefined && updates.situation !== null) {
        newStar.situation = updates.situation;
      }

      if (updates.task !== undefined && updates.task !== null) {
        newStar.task = updates.task;
      }

      if (updates.action !== undefined && updates.action !== null) {
        newStar.action = updates.action;
      }

      if (updates.result !== undefined && updates.result !== null) {
        newStar.result = updates.result;
      }

      if (updates.competency !== undefined && updates.competency !== null) {
        newStar.competency = updates.competency;
      }

      if (updates.jobContext !== undefined && updates.jobContext !== null) {
        newStar.jobContext = updates.jobContext;
      }

      return newStar;
    });
  }, []);

  const resetStar = useCallback(() => {
    setStar(initialStarState);
  }, []);

  return {
    star,
    updateStar,
    resetStar
  };
}
