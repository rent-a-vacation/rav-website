import { describe, it, expect } from 'vitest';
import { scoreDestinations, QUIZ_QUESTIONS, type QuizAnswers } from './resortQuiz';

describe('resortQuiz', () => {
  it('has 5 quiz questions', () => {
    expect(QUIZ_QUESTIONS).toHaveLength(5);
  });

  it('each question has at least 2 options', () => {
    for (const q of QUIZ_QUESTIONS) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('scores all 10 destinations', () => {
    const answers: QuizAnswers = {
      climate: 'tropical',
      activities: ['beach'],
      budget: 'mid-range',
      partySize: 'couple',
      amenities: ['pool'],
    };
    const results = scoreDestinations(answers);
    expect(results).toHaveLength(10);
  });

  it('returns results sorted by score descending', () => {
    const answers: QuizAnswers = {
      climate: 'tropical',
      activities: ['beach', 'golf'],
      budget: 'mid-range',
      partySize: 'family',
      amenities: ['pool', 'ocean-view'],
    };
    const results = scoreDestinations(answers);
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].score).toBeGreaterThanOrEqual(results[i + 1].score);
    }
  });

  it('ranks tropical destinations higher for tropical climate preference', () => {
    const answers: QuizAnswers = {
      climate: 'tropical',
      activities: ['beach'],
      budget: 'mid-range',
      partySize: 'couple',
      amenities: [],
    };
    const results = scoreDestinations(answers);
    const topSlugs = results.slice(0, 3).map((r) => r.destination.slug);
    // Hawaii, Florida, or Caribbean should be in top 3
    const tropicalDests = ['hawaii', 'florida', 'caribbean', 'mexico'];
    const tropicalInTop3 = topSlugs.filter((s) => tropicalDests.includes(s));
    expect(tropicalInTop3.length).toBeGreaterThanOrEqual(2);
  });

  it('ranks mountain destinations higher for ski + mountain preference', () => {
    const answers: QuizAnswers = {
      climate: 'mountain',
      activities: ['ski', 'hiking'],
      budget: 'mid-range',
      partySize: 'couple',
      amenities: [],
    };
    const results = scoreDestinations(answers);
    const topSlugs = results.slice(0, 3).map((r) => r.destination.slug);
    // Colorado or Utah should be in top 3
    const mountainDests = ['colorado', 'utah'];
    const mountainInTop3 = topSlugs.filter((s) => mountainDests.includes(s));
    expect(mountainInTop3.length).toBeGreaterThanOrEqual(1);
  });

  it('gives flexible climate a moderate baseline score', () => {
    const flexible: QuizAnswers = {
      climate: 'any',
      activities: ['golf'],
      budget: 'mid-range',
      partySize: 'couple',
      amenities: [],
    };
    const results = scoreDestinations(flexible);
    // All should have some score from climate baseline
    for (const r of results) {
      expect(r.score).toBeGreaterThan(0);
    }
  });

  it('includes match reasons', () => {
    const answers: QuizAnswers = {
      climate: 'tropical',
      activities: ['beach', 'theme-parks'],
      budget: 'mid-range',
      partySize: 'family',
      amenities: ['pool'],
    };
    const results = scoreDestinations(answers);
    const florida = results.find((r) => r.destination.slug === 'florida');
    expect(florida).toBeDefined();
    expect(florida!.matchReasons.length).toBeGreaterThan(0);
  });

  it('includes top cities for each result', () => {
    const answers: QuizAnswers = {
      climate: 'tropical',
      activities: ['beach'],
      budget: 'budget',
      partySize: 'solo',
      amenities: [],
    };
    const results = scoreDestinations(answers);
    for (const r of results) {
      expect(r.topCities.length).toBeGreaterThan(0);
      expect(r.topCities.length).toBeLessThanOrEqual(3);
    }
  });
});
