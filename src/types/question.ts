export type Difficulty = "入门" | "中级" | "高级";

export interface QuestionStatus {
  completed: boolean;
  review: boolean;
  starred: boolean;
}

export const defaultQuestionStatus: QuestionStatus = {
  completed: false,
  review: false,
  starred: false,
};

export interface QuestionTopic {
  id: string;
  title: string;
  category: string;
  difficulty: Difficulty;
  summary: string;
  tags: string[];
  updatedAt: string;
  estimatedTime: string;
  keywords: string[];
  content: string;
  highlight?: string;
}

export interface QuestionRecommendation {
  id: string;
  title: string;
  hint: string;
}


