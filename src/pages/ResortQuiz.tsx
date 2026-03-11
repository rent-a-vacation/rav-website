import { useState } from 'react';
import { Compass, ArrowRight, ArrowLeft, RotateCcw, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePageMeta } from '@/hooks/usePageMeta';
import { trackEvent } from '@/lib/posthog';
import {
  QUIZ_QUESTIONS,
  scoreDestinations,
  type QuizAnswers,
  type QuizMatch,
} from '@/lib/resortQuiz';

const DEFAULT_ANSWERS: QuizAnswers = {
  climate: 'any',
  activities: [],
  budget: 'mid-range',
  partySize: 'couple',
  amenities: [],
};

export default function ResortQuiz() {
  usePageMeta(
    'Resort Finder Quiz — RAV Tools',
    'Answer 5 quick questions and get matched to the perfect vacation resort from our 117-resort database.',
  );

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({ ...DEFAULT_ANSWERS });
  const [results, setResults] = useState<QuizMatch[] | null>(null);

  const currentQuestion = QUIZ_QUESTIONS[step];
  const isLastQuestion = step === QUIZ_QUESTIONS.length - 1;
  const progress = results ? 100 : Math.round(((step + 1) / QUIZ_QUESTIONS.length) * 100);

  const handleSingleSelect = (value: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const handleMultiToggle = (value: string) => {
    setAnswers((prev) => {
      const current = (prev[currentQuestion.id] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [currentQuestion.id]: updated };
    });
  };

  const handleNext = () => {
    if (isLastQuestion) {
      const matches = scoreDestinations(answers);
      setResults(matches);
      trackEvent('tool_resort_quiz_completed', {
        climate: answers.climate,
        activities: answers.activities,
        budget: answers.budget,
        party_size: answers.partySize,
        top_match: matches[0]?.destination.name,
      });
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleRestart = () => {
    setStep(0);
    setAnswers({ ...DEFAULT_ANSWERS });
    setResults(null);
  };

  const currentValue = answers[currentQuestion?.id];
  const canProceed = currentQuestion?.type === 'single'
    ? !!currentValue
    : Array.isArray(currentValue) && currentValue.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16 md:pt-20">
        <div className="max-w-3xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Compass className="h-4 w-4" />
              Resort Finder Quiz
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              {results ? 'Your Perfect Destinations' : 'Find Your Perfect Resort'}
            </h1>
            <p className="text-muted-foreground text-lg">
              {results
                ? 'Based on your preferences, here are your top matches'
                : '5 quick questions to match you with your ideal vacation spot'}
            </p>
          </div>

          <Progress value={progress} className="mb-8" />

          {/* Quiz Questions */}
          {!results && currentQuestion && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  {step + 1}. {currentQuestion.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {currentQuestion.options.map((opt) => {
                    const isSelected = currentQuestion.type === 'single'
                      ? currentValue === opt.value
                      : Array.isArray(currentValue) && currentValue.includes(opt.value);

                    return (
                      <button
                        key={opt.value}
                        onClick={() =>
                          currentQuestion.type === 'single'
                            ? handleSingleSelect(opt.value)
                            : handleMultiToggle(opt.value)
                        }
                        className={`p-4 rounded-lg border-2 text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 text-foreground'
                            : 'border-muted hover:border-primary/40 text-muted-foreground'
                        }`}
                      >
                        <span className="text-sm font-medium">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep((s) => Math.max(0, s - 1))}
                    disabled={step === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button onClick={handleNext} disabled={!canProceed}>
                    {isLastQuestion ? 'See Results' : 'Next'}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {results && (
            <>
              <div className="space-y-4 mb-8">
                {results.slice(0, 5).map((match, index) => (
                  <Card key={match.destination.slug} className={index === 0 ? 'ring-2 ring-primary' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {index === 0 && <Badge className="bg-primary text-primary-foreground">#1 Match</Badge>}
                            {index > 0 && <Badge variant="secondary">#{index + 1}</Badge>}
                            <h3 className="font-display text-xl font-semibold">{match.destination.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">{match.destination.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">{match.score}%</p>
                          <p className="text-xs text-muted-foreground">match</p>
                        </div>
                      </div>

                      {match.matchReasons.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {match.matchReasons.map((reason) => (
                            <Badge key={reason} variant="outline" className="text-xs">{reason}</Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>
                          Top cities: {match.topCities.map((c) => c.name).join(', ')}
                        </span>
                      </div>

                      <div className="mt-4">
                        <Link to={`/destinations/${match.destination.slug}`}>
                          <Button variant="outline" size="sm">
                            Explore {match.destination.name}
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center">
                <Button variant="outline" onClick={handleRestart}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Take Quiz Again
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
