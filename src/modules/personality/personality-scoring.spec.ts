import { PersonalityType } from '@prisma/client';
import { calculatePersonality } from './personality-scoring';

describe('calculatePersonality', () => {
  const allQuestions = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'];

  function answersFor(values: Record<string, number>) {
    return allQuestions.map((question_id) => ({
      question_id,
      value: values[question_id] ?? 3,
    }));
  }

  it('returns explorer when adventure questions score highest', () => {
    const result = calculatePersonality(
      answersFor({ q1: 5, q5: 5, q2: 1, q3: 1, q4: 1, q6: 1, q7: 1 }),
    );
    expect(result.personalityType).toBe(PersonalityType.explorer);
    expect(result.recommendedCategories).toContain('natural');
  });

  it('returns historian when history questions score highest', () => {
    const result = calculatePersonality(
      answersFor({ q2: 5, q6: 5, q1: 1, q3: 1, q4: 1, q5: 1, q7: 1 }),
    );
    expect(result.personalityType).toBe(PersonalityType.historian);
    expect(result.recommendedCategories).toContain('ancient-monument');
  });

  it('returns strategist when planning questions score highest', () => {
    const result = calculatePersonality(
      answersFor({ q3: 5, q7: 5, q1: 1, q2: 1, q4: 1, q5: 1, q6: 1 }),
    );
    expect(result.personalityType).toBe(PersonalityType.strategist);
  });

  it('returns culture_lover when culture questions score highest', () => {
    const result = calculatePersonality(
      answersFor({ q4: 5, q7: 5, q1: 1, q2: 1, q3: 1, q5: 1, q6: 1 }),
    );
    expect(result.personalityType).toBe(PersonalityType.culture_lover);
    expect(result.personalityLabel).toBe('Culture Lover');
  });

  it('is deterministic for the same answers', () => {
    const answers = answersFor({ q1: 4, q2: 3, q3: 5, q4: 2, q5: 4, q6: 3, q7: 5 });
    const first = calculatePersonality(answers);
    const second = calculatePersonality(answers);
    expect(first).toEqual(second);
  });
});
