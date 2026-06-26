import { Injectable, NotFoundException } from '@nestjs/common';
import { PersonalityType } from '@prisma/client';
import { PrismaService } from '../../core/database/prisma.service';
import {
  PERSONALITY_QUIZ_QUESTIONS,
  PERSONA_CATEGORY_SLUGS,
  PERSONA_LABELS,
} from './data/personality-quiz.data';
import { QuizSubmitDto } from './dto/quiz-submit.dto';
import { calculatePersonality } from './personality-scoring';

export interface QuizResponse {
  questions: Array<{
    id: string;
    prompt_en: string;
    prompt_ar: string;
    options: Array<{ value: number; label_en: string; label_ar: string }>;
  }>;
}

export interface PersonalityResultResponse {
  personality_type: PersonalityType;
  personality_label: string;
  recommended_categories: string[];
  assessed_at: string;
}

@Injectable()
export class PersonalityService {
  constructor(private readonly prisma: PrismaService) {}

  getQuiz(): QuizResponse {
    return {
      questions: PERSONALITY_QUIZ_QUESTIONS.map((question) => ({
        id: question.id,
        prompt_en: question.prompt_en,
        prompt_ar: question.prompt_ar,
        options: question.options,
      })),
    };
  }

  async submitQuiz(userId: string, dto: QuizSubmitDto): Promise<PersonalityResultResponse> {
    const result = calculatePersonality(dto.answers);
    const assessedAt = new Date();

    await this.prisma.personalityProfile.upsert({
      where: { userId },
      create: {
        userId,
        personalityType: result.personalityType,
        assessedAt,
      },
      update: {
        personalityType: result.personalityType,
        assessedAt,
      },
    });

    return {
      personality_type: result.personalityType,
      personality_label: result.personalityLabel,
      recommended_categories: result.recommendedCategories,
      assessed_at: assessedAt.toISOString(),
    };
  }

  async getUserPersonality(userId: string): Promise<PersonalityResultResponse> {
    const profile = await this.prisma.personalityProfile.findUnique({ where: { userId } });

    if (!profile) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Personality profile not found. Complete the onboarding quiz first.',
      });
    }

    return {
      personality_type: profile.personalityType,
      personality_label: PERSONA_LABELS[profile.personalityType].en,
      recommended_categories: PERSONA_CATEGORY_SLUGS[profile.personalityType],
      assessed_at: profile.assessedAt.toISOString(),
    };
  }
}
