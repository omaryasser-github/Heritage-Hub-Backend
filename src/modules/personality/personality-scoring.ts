import { BadRequestException } from '@nestjs/common';
import { PersonalityType } from '@prisma/client';
import {
  PERSONALITY_QUIZ_QUESTIONS,
  PERSONA_CATEGORY_SLUGS,
  PERSONA_LABELS,
  QUIZ_QUESTION_IDS,
} from './data/personality-quiz.data';
import type { QuizQuestion } from './data/personality-quiz.data';

export interface QuizAnswerInput {
  question_id: string;
  value: number;
}

export interface PersonalityScoreResult {
  personalityType: PersonalityType;
  personalityLabel: string;
  recommendedCategories: string[];
  scores: Record<PersonalityType, number>;
}

const PERSONA_PRIORITY: PersonalityType[] = [
  PersonalityType.explorer,
  PersonalityType.historian,
  PersonalityType.strategist,
  PersonalityType.culture_lover,
];

export function calculatePersonality(answers: QuizAnswerInput[]): PersonalityScoreResult {
  validateAnswers(answers);

  const scores: Record<PersonalityType, number> = {
    [PersonalityType.explorer]: 0,
    [PersonalityType.historian]: 0,
    [PersonalityType.strategist]: 0,
    [PersonalityType.culture_lover]: 0,
  };

  for (const answer of answers) {
    const question = PERSONALITY_QUIZ_QUESTIONS.find(
      (item: QuizQuestion) => item.id === answer.question_id,
    )!;

    for (const persona of PERSONA_PRIORITY) {
      scores[persona] += answer.value * question.weights[persona];
    }
  }

  const personalityType = resolveWinner(scores);

  return {
    personalityType,
    personalityLabel: PERSONA_LABELS[personalityType].en,
    recommendedCategories: PERSONA_CATEGORY_SLUGS[personalityType],
    scores,
  };
}

export function validateAnswers(answers: QuizAnswerInput[]): void {
  if (answers.length !== PERSONALITY_QUIZ_QUESTIONS.length) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: `Exactly ${PERSONALITY_QUIZ_QUESTIONS.length} answers are required`,
      details: { answers: ['invalid_count'] },
    });
  }

  const seen = new Set<string>();

  for (const answer of answers) {
    if (!QUIZ_QUESTION_IDS.has(answer.question_id)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Unknown question_id in answers',
        details: { question_id: [answer.question_id] },
      });
    }

    if (seen.has(answer.question_id)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Duplicate question_id in answers',
        details: { question_id: [answer.question_id] },
      });
    }

    seen.add(answer.question_id);

    if (!Number.isInteger(answer.value) || answer.value < 1 || answer.value > 5) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Answer values must be integers between 1 and 5',
        details: { value: [String(answer.value)] },
      });
    }
  }

  if (seen.size !== PERSONALITY_QUIZ_QUESTIONS.length) {
    throw new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'All quiz questions must be answered',
      details: { answers: ['missing_questions'] },
    });
  }
}

function resolveWinner(scores: Record<PersonalityType, number>): PersonalityType {
  let winner = PERSONA_PRIORITY[0];
  let bestScore = scores[winner];

  for (const persona of PERSONA_PRIORITY.slice(1)) {
    if (scores[persona] > bestScore) {
      winner = persona;
      bestScore = scores[persona];
    }
  }

  return winner;
}
