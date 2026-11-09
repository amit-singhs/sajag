import { useQuery } from '@tanstack/react-query';
import type { CampaignSummary } from '@sajag/shared';
import { HashLink } from '../../components/navigation/HashLink';
import { ButtonLink } from '../../components/ui/Button';
import { EmptyState, ErrorNotice, Loading } from '../../components/ui/Feedback';
import { publicApi, queryKeys } from '../../lib/api/endpoints';
import { pad2 } from '../../lib/labels';

const STEPS = [
  { title: 'अपनी जानकारी दें', body: 'मोबाइल नंबर, नाम, तहसील और ज़िला। हर व्यक्ति की एक ही प्रविष्टि दर्ज होती है।' },
  { title: 'एक-एक करके प्रश्न', body: 'मोबाइल पर आराम से, एक स्क्रीन पर एक प्रश्न। कुछ प्रश्नों में एक से अधिक उत्तर सही हो सकते हैं।' },
  { title: 'सही उत्तर और व्याख्या', body: 'जमा करते ही आपका स्कोर और हर प्रश्न का सही उत्तर, संबंधित धारा के साथ सरल भाषा में।' },
] as const;

const LAWS = [
  { year: '2012', name: 'POCSO अधिनियम', body: 'बच्चों को यौन अपराधों से संरक्षण, रिपोर्टिंग का दायित्व, विशेष अदालतें' },
  { year: '2023', name: 'भारतीय न्याय संहिता (BNS)', body: 'अपहरण, दुष्प्रेरण और गंभीर अपराधों के दंड' },
  { year: '2023', name: 'नागरिक सुरक्षा संहिता (BNSS)', body: 'FIR, पीड़िता का बयान और जमानत की प्रक्रिया' },
  { year: '2015', name: 'किशोर न्याय (JJ) अधिनियम', body: 'जब आरोपी स्वयं नाबालिग हो — किशोर न्याय बोर्ड की भूमिका' },
] as const;

const HELPLINES = [
  { number: '112', label: 'आपातकालीन सेवा' },
  { number: '1098', label: 'चाइल्डलाइन — बच्चों के लिए', accent: true },
  { number: '181', label: 'महिला हेल्पलाइन' },
] as const;

function CampaignCard({ campaign, index }: { campaign: CampaignSummary; index: number }) {
  return (
    <article className="campaign-card">
      <div className="campaign-card__body stack-md">
        <div className="row-between">
          <span className="campaign-card__num">{pad2(index + 1)}</span>
          <span className="pill pill--dark">जारी है</span>
        </div>
        <h3 className="display-3">{campaign.title}</h3>
        <p className="lead">{campaign.summary}</p>
        <div className="tags">
          {campaign.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
          <span className="tag">{campaign.questionCount} प्रश्न</span>
        </div>
        <div className="row-wrap">
          <ButtonLink to={`/c/${campaign.slug}`} iconAfter="arrowRight">
            प्रश्नावली शुरू करें
          </ButtonLink>
          {campaign.organizer && (
            <span className="credit">
              <span className="credit__label">अभियान संचालक :</span> <span className="credit__name">{campaign.organizer}</span>
            </span>
          )}
        </div>
      </div>
      <div className="campaign-card__aside stack-sm">
        <span className="eyebrow eyebrow--light">शुरू करने से पहले</span>
        <ul className="aside-list">
          <li>मोबाइल नंबर</li>
          <li>नाम, तहसील और ज़िला</li>
          <li>18 से कम आयु पर अभिभावक की सहमति</li>
        </ul>
        <p>एक मोबाइल नंबर से एक प्रविष्टि। आपकी जानकारी कभी बेची या विज्ञापन के लिए उपयोग नहीं की जाती।</p>
      </div>
    </article>
  );
}

export function LandingPage() {
  const campaigns = useQuery({ queryKey: queryKeys.liveCampaigns, queryFn: publicApi.campaigns });
  const first = campaigns.data?.[0];

  return (
    <>
      <section className="hero ruled">
        <div className="container hero__grid">
          <div className="stack-lg">
            <span className="eyebrow">कानूनी जागरूकता अभियान</span>
            <h1 className="display-1">
              कानून की जानकारी ही <em>पहली सुरक्षा</em> है।
            </h1>
            <p className="lead">
              सजग एक स्वतंत्र नागरिक पहल है जो रोज़मर्रा के कानूनों को सरल प्रश्नों के ज़रिये आम लोगों तक पहुँचाती है — ताकि हर परिवार जाने कि बच्चों की सुरक्षा के
              लिए कानून क्या कहता है।
            </p>
            <div className="row-wrap">
              {first && (
                <ButtonLink to={`/c/${first.slug}`} iconAfter="arrowRight">
                  प्रश्नावली शुरू करें
                </ButtonLink>
              )}
              <HashLink to="#abhiyan" className="btn btn--ghost btn--md">
                अभियान देखें
              </HashLink>
            </div>
          </div>
          <div className="hero__card" aria-hidden="true">
            <div className="docket">
              <div className="docket__head">
                <span>उदाहरण प्रश्न</span>
                <span>साइबर सुरक्षा</span>
              </div>
              <p className="docket__q">बच्चों के साथ ऑनलाइन धोखाधड़ी या उत्पीड़न के संदर्भ में कौन सा कथन गलत है?</p>
              <div className="docket__opt">A · शिकायत cybercrime.gov.in या हेल्पलाइन 1930 पर की जा सकती है।</div>
              <div className="docket__opt is-picked">
                C · शिकायत के लिए संदेश और स्क्रीनशॉट मिटा देना चाहिए।
                <span className="stamp">असत्य</span>
              </div>
              <p className="muted">यह केवल एक उदाहरण है — अभियान के प्रश्न इससे अलग हैं।</p>
            </div>
          </div>
        </div>
      </section>

      <section id="abhiyan" className="container section stack-lg">
        <div className="section-head">
          <span className="eyebrow">अभियान</span>
          <h2 className="display-2">सक्रिय प्रश्नावलियाँ</h2>
        </div>
        {campaigns.isLoading && <Loading />}
        {campaigns.error && <ErrorNotice error={campaigns.error} />}
        {campaigns.data?.length === 0 && <EmptyState title="अभी कोई अभियान जारी नहीं है">जल्द ही नया अभियान शुरू होगा।</EmptyState>}
        <div className="stack-md">
          {campaigns.data?.map((c, i) => <CampaignCard key={c.id} campaign={c} index={i} />)}
        </div>
      </section>

      <section className="container section stack-lg">
        <div className="section-head">
          <span className="eyebrow">कैसे काम करता है</span>
          <h2 className="display-2">तीन कदम, कुछ मिनट</h2>
        </div>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="steps__item">
              <span className="steps__num">{pad2(i + 1)}</span>
              <h3 className="title-3">{s.title}</h3>
              <p className="muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="band">
        <div className="container section split">
          <div className="stack-md">
            <span className="eyebrow">आप क्या जानेंगे</span>
            <h2 className="display-2">चार कानून जो हर परिवार को पता होने चाहिए</h2>
            <p className="lead">प्रश्न किसी को परखने के लिए नहीं, बल्कि आम भ्रांतियों को दूर करने के लिए बनाए गए हैं।</p>
          </div>
          <div className="law-list">
            {LAWS.map((l) => (
              <div key={l.name} className="law-list__row">
                <span className="mono muted">{l.year}</span>
                <div className="stack-xs">
                  <strong className="title-3">{l.name}</strong>
                  <span className="muted">{l.body}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="help" className="ink-band">
        <div className="container section stack-lg">
          <div className="row-between">
            <h2 className="display-2">
              मदद बस <em>एक कॉल</em> दूर है।
            </h2>
            <p className="lead lead--light">किसी बच्चे के साथ अपराध की आशंका हो तो चुप न रहें। सूचना देना हर नागरिक का कानूनी दायित्व है।</p>
          </div>
          <div className="helplines">
            {HELPLINES.map((h) => (
              <a key={h.number} href={`tel:${h.number}`} className="helpline">
                <span className={`helpline__num${'accent' in h ? ' is-accent' : ''}`}>{h.number}</span>
                <span>{h.label}</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
