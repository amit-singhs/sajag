import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useReducer } from 'react';
import { useParams } from 'react-router-dom';
import { ErrorNotice, Loading } from '../../components/ui/Feedback';
import { ApiError } from '../../lib/api/client';
import { publicApi, queryKeys } from '../../lib/api/endpoints';
import { buildSubmission, initialQuizState, quizReducer, type QuizStep } from './quiz-state';
import { ConsentStep } from './steps/ConsentStep';
import { DetailsStep } from './steps/DetailsStep';
import { GuardianStep } from './steps/GuardianStep';
import { QuestionStep } from './steps/QuestionStep';
import { ResultView } from './steps/ResultView';

export function QuizPage() {
  const { slug = '' } = useParams();
  const campaignQuery = useQuery({
    queryKey: queryKeys.publicCampaign(slug),
    queryFn: () => publicApi.campaign(slug),
    staleTime: Infinity, // keep the shuffled order stable for the whole attempt
    retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
  });
  const [state, dispatch] = useReducer(quizReducer, initialQuizState);

  const submit = useMutation({
    mutationFn: () => {
      if (!campaignQuery.data) throw new Error('Campaign not loaded');
      return publicApi.submit(slug, buildSubmission(state, campaignQuery.data));
    },
    onSuccess: (result) => dispatch({ type: 'finish', result }),
  });

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [state.step, state.index]);

  if (campaignQuery.isLoading) return <Loading />;
  if (campaignQuery.error || !campaignQuery.data) {
    return (
      <div className="container narrow section">
        <ErrorNotice error={campaignQuery.error ?? new Error('अभियान नहीं मिला')} />
      </div>
    );
  }

  const campaign = campaignQuery.data;
  const go = (step: QuizStep) => dispatch({ type: 'go', step });
  const questions = campaign.questions;

  switch (state.step) {
    case 'consent':
      return (
        <ConsentStep
          campaign={campaign}
          language={state.language}
          consented={state.consented}
          onLanguage={(language) => dispatch({ type: 'language', language })}
          onConsent={(value) => dispatch({ type: 'consent', value })}
          onNext={() => go('details')}
        />
      );
    case 'details':
      return (
        <DetailsStep
          campaign={campaign}
          participant={state.participant}
          onChange={(patch) => dispatch({ type: 'participant', patch })}
          onBack={() => go('consent')}
          onNext={() => go(state.participant.ageBand === 'minor' ? 'guardian' : 'questions')}
        />
      );
    case 'guardian':
      return (
        <GuardianStep
          guardian={state.guardian}
          participantMobile={state.participant.mobile}
          onChange={(patch) => dispatch({ type: 'guardian', patch })}
          onBack={() => go('details')}
          onNext={() => go('questions')}
        />
      );
    case 'questions': {
      const question = questions[state.index];
      if (!question) return null;
      const isLast = state.index === questions.length - 1;
      return (
        <QuestionStep
          key={question.id}
          question={question}
          index={state.index}
          total={questions.length}
          answer={state.answers[question.id]}
          submitting={submit.isPending}
          submitError={submit.error}
          onAnswer={(draft) => dispatch({ type: 'answer', questionId: question.id, draft })}
          onPrev={() =>
            state.index === 0
              ? go(state.participant.ageBand === 'minor' ? 'guardian' : 'details')
              : dispatch({ type: 'index', index: state.index - 1 })
          }
          onNext={() => (isLast ? submit.mutate() : dispatch({ type: 'index', index: state.index + 1 }))}
        />
      );
    }
    case 'result':
      return state.result ? <ResultView result={state.result} campaignTitle={campaign.title} /> : null;
  }
}
