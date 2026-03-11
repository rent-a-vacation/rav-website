/**
 * Resort Finder Quiz — match user preferences to resorts.
 *
 * Scoring algorithm: weighted match across climate, activities, budget,
 * party size, and amenity preferences against our destination data.
 */

import { DESTINATIONS, type Destination, type DestinationCity } from './destinations';

export interface QuizAnswers {
  climate: 'tropical' | 'mountain' | 'desert' | 'any';
  activities: ('beach' | 'ski' | 'golf' | 'theme-parks' | 'hiking' | 'nightlife')[];
  budget: 'budget' | 'mid-range' | 'luxury';
  partySize: 'solo' | 'couple' | 'family' | 'group';
  amenities: ('pool' | 'spa' | 'kitchen' | 'ocean-view' | 'pet-friendly')[];
}

export interface QuizQuestion {
  id: keyof QuizAnswers;
  question: string;
  type: 'single' | 'multi';
  options: { value: string; label: string; icon?: string }[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'climate',
    question: 'What climate do you prefer?',
    type: 'single',
    options: [
      { value: 'tropical', label: 'Tropical — warm, beaches, ocean' },
      { value: 'mountain', label: 'Mountain — cool, scenic, snow sports' },
      { value: 'desert', label: 'Desert — dry heat, golf, spas' },
      { value: 'any', label: "I'm flexible!" },
    ],
  },
  {
    id: 'activities',
    question: 'What activities matter most? (Pick up to 3)',
    type: 'multi',
    options: [
      { value: 'beach', label: 'Beach & Water Sports' },
      { value: 'ski', label: 'Skiing & Snowboarding' },
      { value: 'golf', label: 'Golf' },
      { value: 'theme-parks', label: 'Theme Parks' },
      { value: 'hiking', label: 'Hiking & Nature' },
      { value: 'nightlife', label: 'Nightlife & Dining' },
    ],
  },
  {
    id: 'budget',
    question: 'What\'s your nightly budget?',
    type: 'single',
    options: [
      { value: 'budget', label: 'Under $150/night' },
      { value: 'mid-range', label: '$150-$300/night' },
      { value: 'luxury', label: '$300+/night' },
    ],
  },
  {
    id: 'partySize',
    question: 'Who are you traveling with?',
    type: 'single',
    options: [
      { value: 'solo', label: 'Just me' },
      { value: 'couple', label: 'Couple' },
      { value: 'family', label: 'Family with kids' },
      { value: 'group', label: 'Group (5+)' },
    ],
  },
  {
    id: 'amenities',
    question: 'Which amenities are must-haves? (Pick any)',
    type: 'multi',
    options: [
      { value: 'pool', label: 'Pool' },
      { value: 'spa', label: 'Spa & Wellness' },
      { value: 'kitchen', label: 'Full Kitchen' },
      { value: 'ocean-view', label: 'Ocean View' },
      { value: 'pet-friendly', label: 'Pet Friendly' },
    ],
  },
];

/** Climate tags for each destination. */
const DESTINATION_CLIMATE: Record<string, string[]> = {
  hawaii: ['tropical'],
  florida: ['tropical'],
  california: ['tropical', 'mountain'],
  mexico: ['tropical'],
  caribbean: ['tropical'],
  colorado: ['mountain'],
  arizona: ['desert'],
  nevada: ['desert'],
  south_carolina: ['tropical'],
  utah: ['mountain', 'desert'],
};

/** Activity tags for each destination. */
const DESTINATION_ACTIVITIES: Record<string, string[]> = {
  hawaii: ['beach', 'hiking', 'golf'],
  florida: ['beach', 'theme-parks', 'golf', 'nightlife'],
  california: ['beach', 'hiking', 'nightlife', 'golf'],
  mexico: ['beach', 'nightlife', 'golf'],
  caribbean: ['beach', 'golf'],
  colorado: ['ski', 'hiking', 'golf'],
  arizona: ['golf', 'hiking'],
  nevada: ['nightlife', 'golf', 'hiking'],
  south_carolina: ['beach', 'golf'],
  utah: ['ski', 'hiking'],
};

/** Budget tier mapping to destination affordability (lower = cheaper). */
const DESTINATION_BUDGET: Record<string, string> = {
  hawaii: 'luxury',
  florida: 'mid-range',
  california: 'luxury',
  mexico: 'budget',
  caribbean: 'mid-range',
  colorado: 'mid-range',
  arizona: 'mid-range',
  nevada: 'budget',
  south_carolina: 'budget',
  utah: 'budget',
};

/** Family-friendliness score (0-1). */
const DESTINATION_FAMILY: Record<string, number> = {
  hawaii: 0.8,
  florida: 1.0,
  california: 0.8,
  mexico: 0.6,
  caribbean: 0.6,
  colorado: 0.7,
  arizona: 0.5,
  nevada: 0.3,
  south_carolina: 0.7,
  utah: 0.6,
};

export interface QuizMatch {
  destination: Destination;
  score: number;
  matchReasons: string[];
  topCities: DestinationCity[];
}

export function scoreDestinations(answers: QuizAnswers): QuizMatch[] {
  const results: QuizMatch[] = [];

  for (const dest of DESTINATIONS) {
    let score = 0;
    const reasons: string[] = [];

    // Climate match (weight: 25)
    const climates = DESTINATION_CLIMATE[dest.slug] || [];
    if (answers.climate === 'any') {
      score += 15;
    } else if (climates.includes(answers.climate)) {
      score += 25;
      reasons.push(`${answers.climate} climate`);
    }

    // Activities match (weight: 30 max)
    const activities = DESTINATION_ACTIVITIES[dest.slug] || [];
    const activityMatches = answers.activities.filter((a) => activities.includes(a));
    const activityScore = answers.activities.length > 0
      ? Math.round((activityMatches.length / answers.activities.length) * 30)
      : 15;
    score += activityScore;
    if (activityMatches.length > 0) {
      reasons.push(activityMatches.join(', '));
    }

    // Budget match (weight: 20)
    const destBudget = DESTINATION_BUDGET[dest.slug] || 'mid-range';
    if (destBudget === answers.budget) {
      score += 20;
      reasons.push(`fits ${answers.budget} budget`);
    } else if (
      (answers.budget === 'luxury' && destBudget === 'mid-range') ||
      (answers.budget === 'mid-range' && destBudget === 'budget')
    ) {
      score += 12; // slightly under budget is fine
    } else if (
      (answers.budget === 'budget' && destBudget === 'mid-range')
    ) {
      score += 8;
    }

    // Party size match (weight: 15)
    const familyScore = DESTINATION_FAMILY[dest.slug] || 0.5;
    if (answers.partySize === 'family' && familyScore >= 0.7) {
      score += 15;
      reasons.push('family-friendly');
    } else if (answers.partySize === 'couple' || answers.partySize === 'solo') {
      score += 10;
    } else if (answers.partySize === 'group') {
      score += 10;
    } else {
      score += 5;
    }

    // Amenity match (weight: 10)
    if (answers.amenities.includes('ocean-view') && climates.includes('tropical')) {
      score += 5;
    }
    if (answers.amenities.includes('pool')) {
      score += 3; // most resorts have pools
    }
    if (answers.amenities.length > 0) {
      score += 2;
    }

    results.push({
      destination: dest,
      score,
      matchReasons: reasons,
      topCities: dest.cities.slice(0, 3),
    });
  }

  return results.sort((a, b) => b.score - a.score);
}
