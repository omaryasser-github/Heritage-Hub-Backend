import { PersonalityType } from '@prisma/client';

export interface QuizOption {
  value: number;
  label_en: string;
  label_ar: string;
}

export interface QuizQuestion {
  id: string;
  prompt_en: string;
  prompt_ar: string;
  options: QuizOption[];
  weights: Record<PersonalityType, number>;
}

const LIKERT_OPTIONS: QuizOption[] = [
  { value: 1, label_en: 'Strongly disagree', label_ar: 'أعارض بشدة' },
  { value: 2, label_en: 'Disagree', label_ar: 'أعارض' },
  { value: 3, label_en: 'Neutral', label_ar: 'محايد' },
  { value: 4, label_en: 'Agree', label_ar: 'أوافق' },
  { value: 5, label_en: 'Strongly agree', label_ar: 'أوافق بشدة' },
];

export const PERSONALITY_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    prompt_en: 'I prefer spontaneous adventures over fixed itineraries.',
    prompt_ar: 'أفضل المغامرات العفوية على الخطط السياحية الثابتة.',
    options: LIKERT_OPTIONS,
    weights: { explorer: 2, historian: 1, strategist: 1, culture_lover: 1 },
  },
  {
    id: 'q2',
    prompt_en: 'Ancient history and archaeological details excite me most.',
    prompt_ar: 'التاريخ القديم والتفاصيل الأثرية هي ما يثير اهتمامي أكثر.',
    options: LIKERT_OPTIONS,
    weights: { explorer: 1, historian: 2, strategist: 1, culture_lover: 1 },
  },
  {
    id: 'q3',
    prompt_en: 'I like planning every stop to maximize my time efficiently.',
    prompt_ar: 'أحب التخطيط لكل محطة لاستغلال وقتي بأفضل شكل.',
    options: LIKERT_OPTIONS,
    weights: { explorer: 1, historian: 1, strategist: 2, culture_lover: 1 },
  },
  {
    id: 'q4',
    prompt_en: 'Local customs, markets, and living culture matter most to me.',
    prompt_ar: 'العادات المحلية والأسواق والثقافة المعيشية هي الأهم بالنسبة لي.',
    options: LIKERT_OPTIONS,
    weights: { explorer: 1, historian: 1, strategist: 1, culture_lover: 2 },
  },
  {
    id: 'q5',
    prompt_en: 'I am drawn to natural landscapes and off-the-beaten-path sites.',
    prompt_ar: 'تجذبني المناظر الطبيعية والمواقع بعيدة عن المسار السياحي.',
    options: LIKERT_OPTIONS,
    weights: { explorer: 2, historian: 1, strategist: 1, culture_lover: 1 },
  },
  {
    id: 'q6',
    prompt_en: 'Museums and documented heritage deepen my travel experience.',
    prompt_ar: 'المتاحف والتراث الموثق يعمقان تجربة سفري.',
    options: LIKERT_OPTIONS,
    weights: { explorer: 1, historian: 2, strategist: 1, culture_lover: 1 },
  },
  {
    id: 'q7',
    prompt_en: 'I enjoy structured learning combined with respectful cultural immersion.',
    prompt_ar: 'أستمتع بالتعلم المنظم مع الانغماس الثقافي المحترم.',
    options: LIKERT_OPTIONS,
    weights: { explorer: 1, historian: 1, strategist: 2, culture_lover: 2 },
  },
];

export const PERSONA_CATEGORY_SLUGS: Record<PersonalityType, string[]> = {
  [PersonalityType.explorer]: ['natural', 'attraction', 'historic-site'],
  [PersonalityType.historian]: ['ancient-monument', 'temple', 'museum', 'historic-site'],
  [PersonalityType.strategist]: ['museum', 'historic-site', 'ancient-monument'],
  [PersonalityType.culture_lover]: ['mosque', 'church', 'market', 'museum'],
};

export const PERSONA_LABELS: Record<PersonalityType, { en: string; ar: string }> = {
  [PersonalityType.explorer]: { en: 'Explorer', ar: 'المستكشف' },
  [PersonalityType.historian]: { en: 'Historian', ar: 'المؤرخ' },
  [PersonalityType.strategist]: { en: 'Strategist', ar: 'الاستراتيجي' },
  [PersonalityType.culture_lover]: { en: 'Culture Lover', ar: 'عاشق الثقافة' },
};

export const QUIZ_QUESTION_IDS = new Set(PERSONALITY_QUIZ_QUESTIONS.map((question) => question.id));
