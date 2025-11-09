import { useCallback, useEffect, useState } from "react";

import {
  defaultQuestionStatus,
  type QuestionStatus,
} from "@/types/question";

interface QuestionProgressEntry extends QuestionStatus {
  updatedAt: string;
}

type QuestionProgressMap = Record<string, QuestionProgressEntry>;

const STORAGE_KEY = "interview-questions-progress";

const sanitizeStatus = (status: QuestionStatus): QuestionStatus => ({
  completed: Boolean(status.completed),
  review: Boolean(status.review),
  starred: Boolean(status.starred),
});

const hasAnyStatus = (status: QuestionStatus) =>
  status.completed || status.review || status.starred;

const readProgressFromStorage = (): QuestionProgressMap => {
  if (typeof window === "undefined") {
    return {};
  }

  const storedValue = window.localStorage.getItem(STORAGE_KEY);
  if (!storedValue) {
    return {};
  }

  try {
    const parsed = JSON.parse(storedValue) as Record<string, QuestionProgressEntry>;
    const normalized: QuestionProgressMap = {};

    for (const [id, value] of Object.entries(parsed ?? {})) {
      if (!value || typeof value !== "object") {
        continue;
      }

      const normalizedStatus = sanitizeStatus(value);
      if (!hasAnyStatus(normalizedStatus)) {
        continue;
      }

      normalized[id] = {
        ...normalizedStatus,
        updatedAt:
          typeof value.updatedAt === "string"
            ? value.updatedAt
            : new Date().toISOString(),
      };
    }

    return normalized;
  } catch (error) {
    console.warn("[useQuestionProgress] Failed to parse stored progress", error);
    return {};
  }
};

const persistProgress = (map: QuestionProgressMap) => {
  if (typeof window === "undefined") {
    return;
  }

  if (Object.keys(map).length === 0) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }
};

export function useQuestionProgress() {
  const [progress, setProgress] = useState<QuestionProgressMap>(() =>
    readProgressFromStorage(),
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }
      setProgress(readProgressFromStorage());
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const updateStatus = useCallback(
    (id: string, updater: (status: QuestionStatus) => QuestionStatus) => {
      setProgress((previous) => {
        const currentEntry = previous[id];
        const currentStatus = currentEntry
          ? {
              completed: currentEntry.completed,
              review: currentEntry.review,
              starred: currentEntry.starred,
            }
          : { ...defaultQuestionStatus };

        const nextStatus = sanitizeStatus(updater(currentStatus));
        let nextMap: QuestionProgressMap;

        if (hasAnyStatus(nextStatus)) {
          nextMap = {
            ...previous,
            [id]: {
              ...nextStatus,
              updatedAt: new Date().toISOString(),
            },
          };
        } else {
          const { [id]: _removed, ...rest } = previous;
          nextMap = rest;
        }

        persistProgress(nextMap);
        return nextMap;
      });
    },
    [],
  );

  const toggleCompleted = useCallback(
    (id: string) =>
      updateStatus(id, (status) => ({
        ...status,
        completed: !status.completed,
      })),
    [updateStatus],
  );

  const toggleReview = useCallback(
    (id: string) =>
      updateStatus(id, (status) => ({
        ...status,
        review: !status.review,
      })),
    [updateStatus],
  );

  const toggleStar = useCallback(
    (id: string) =>
      updateStatus(id, (status) => ({
        ...status,
        starred: !status.starred,
      })),
    [updateStatus],
  );

  const clearStatus = useCallback(
    (id: string) => updateStatus(id, () => ({ ...defaultQuestionStatus })),
    [updateStatus],
  );

  const resetAll = useCallback(() => {
    setProgress(() => {
      persistProgress({});
      return {};
    });
  }, []);

  const getStatus = useCallback(
    (id: string): QuestionStatus => {
      const entry = progress[id];
      if (!entry) {
        return { ...defaultQuestionStatus };
      }
      return {
        completed: entry.completed,
        review: entry.review,
        starred: entry.starred,
      };
    },
    [progress],
  );

  return {
    progress,
    getStatus,
    toggleCompleted,
    toggleReview,
    toggleStar,
    clearStatus,
    resetAll,
  };
}


