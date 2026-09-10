import { DriftViz } from './components/story/DriftViz'
import { LineChart } from './components/story/LineChart'
import { ResultBento } from './components/story/ResultBento'
import { StackGrid } from './components/story/StackGrid'
import { StoryBeat } from './components/story/StoryBeat'
import { ABLATION, COMPARISON, DECISIONS, META, METRICS, NEXT, ROLLING, SECTORS } from './data'

const TOC = [
  { href: '#problem', label: 'The problem' },
  { href: '#answer', label: 'The approach' },
  { href: '#result', label: 'The result' },
  { href: '#stack', label: 'How it works' },
  { href: '#decisions', label: 'Design choices' },
  { href: '#use', label: 'Running it' },
  { href: '#next', label: 'What is next' },
]

export function App() {
  return (
    <>
      <a className="skip-link" href="#problem">
        Skip to the walkthrough
      </a>

      <div className="masthead">
        <div className="masthead__inner">
          <div className="masthead__mark">
            <b>RiverKafka</b> · a live scorer that has to keep up when the stream changes
          </div>
          <ul className="masthead__nav">
            <li><a href="#problem">problem</a></li>
            <li><a href="#answer">approach</a></li>
            <li><a href="#result">result</a></li>
            <li><a href="#stack">how</a></li>
          </ul>
        </div>
      </div>

      <main className="page">
        <header className="page-hero">
          <p className="meta">A walkthrough · online learning versus a frozen model after a planted change</p>
          <h1>RiverKafka</h1>
          <p className="lead">
            Companies score events as they arrive on a message bus: a card swipe, a click, a sensor
            reading. The world moves. Fraud tells change. Click habits change. A model fit last month
            keeps answering with last month&apos;s habits, and the stream has already left it behind.
            I plant a change in a labeled stream, let one model update as events arrive, freeze another
            on the old window, and score both after the change.
          </p>
          <p className="intro-detail">
            The number I care about is how often each model is right on the window after the change,
            as a percentage. {METRICS.nEvents.toLocaleString()} events, change planted at event{' '}
            {META.driftT.toLocaleString()}, seed {META.seed}. The frozen model lagged. The updating
            one recovered.
          </p>
          <nav aria-label="On this page">
            <ul className="toc">
              {TOC.map((item) => (
                <li key={item.href}>
                  <a href={item.href}>{item.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </header>

        <StoryBeat
          id="problem"
          kicker="The problem"
          title="The stream changed. The frozen model did not."
          caption="After the planted change, a model that never updates stays wrong. The updating path dips, then climbs. Each point is 1,000 events."
          visual={
            <LineChart
              hours={ROLLING.bins}
              yMax={100}
              series={[
                { label: 'updating model', color: 'var(--chart-online)', values: ROLLING.online, width: 2.6 },
                { label: 'frozen model', color: 'var(--chart-batch)', values: ROLLING.batch, dash: '7 4' },
              ]}
            />
          }
        >
          <p>
            Picture a fraud scorer sitting on a live event bus. Each swipe is labeled later as fraud or
            not, and the scorer has to answer before that label exists. Last month&apos;s fit was fine
            until attackers changed their pattern. From that moment the old rule is answering a
            question the world is no longer asking.
          </p>
          <p>
            Waiting for a nightly retrain leaves a gap of hours. Updating on every event can close the
            gap, but two things go wrong easily. One: the updater peeks at labels from events that have
            not arrived yet, which is cheating. Two: nobody notices the stream has changed, so the
            updater keeps a foot in the old world and the new one.
          </p>
          <p>
            I want a fair comparison after a change I planted on purpose. Same features both paths.
            No future labels in training.
          </p>
        </StoryBeat>

        <StoryBeat
          id="answer"
          kicker="The approach"
          title="Update on arrival. Freeze the old fit. Score after the change."
          caption={`Events 0 to ${META.driftT - 1} follow one rule. At t* the first three features flip sign. The frozen model never sees the new rule. The updating model scores each later event, then learns from it.`}
          visual={<DriftViz />}
        >
          <p>
            I generate {METRICS.nEvents.toLocaleString()} labeled events. Halfway through, the rule
            that makes the label flips. That timestamp is t*, and I know it because I planted it.
          </p>
          <p>
            One path fits a logistic model on everything before t* and then freezes. The other path
            updates after every event: it scores first, then takes one gradient step on that event&apos;s
            label. If recent misses pile up, it drops the old weights and starts the new window clean.
            A small key records which version is live for serving.
          </p>
          <p>
            Both paths see the same eight numbers per event. The leak test fails if training uses a
            timestamp later than the event being scored. The number I report is the share of post-change
            events each path gets right.
          </p>
        </StoryBeat>

        <StoryBeat
          id="result"
          kicker="The result"
          title="After the change, the updating path is right most of the time"
          caption="Same post-change window, 20,000 events. The frozen fit, trained only on the old rule, stays near chance-reversed. The updating path recovers after one reset."
          visual={
            <LineChart
              hours={ROLLING.bins}
              yMax={100}
              series={[
                { label: 'updating model', color: 'var(--chart-online)', values: ROLLING.online, width: 2.6 },
                { label: 'frozen model', color: 'var(--chart-batch)', values: ROLLING.batch, dash: '7 4' },
              ]}
            />
          }
        >
          <p>
            Here is the score on the window after the change. Higher is better: it is the percent of
            events whose label the model got right.
          </p>
          <ResultBento />
          <p style={{ marginTop: 'var(--space-5)' }}>
            The frozen model was fit on the old rule, so after the flip it is systematically wrong. The
            updating path takes a hit in the first thousand events, resets once when misses pile up,
            and then sits around ninety percent for the rest of the window. Five percent of labels are
            noise, so the ceiling is not 100.
          </p>
          <div className="result-charts">
            <table className="choice-table">
              <caption className="sr-only">Updating path versus frozen path on the same post-change window</caption>
              <thead>
                <tr>
                  <th scope="col">On the post-change window</th>
                  <th scope="col">Updating</th>
                  <th scope="col">Frozen</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((r) => (
                  <tr key={r.metric}>
                    <td>{r.metric}</td>
                    <td style={{ color: r.best === 'online' ? 'var(--good)' : 'var(--fg)' }}>{r.online}</td>
                    <td>{r.batch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="choice-table">
              <caption className="sr-only">Ablation of drift detector and step size</caption>
              <thead>
                <tr>
                  <th scope="col">Detector</th>
                  <th scope="col">Step size</th>
                  <th scope="col">Updating %</th>
                  <th scope="col">Frozen %</th>
                </tr>
              </thead>
              <tbody>
                {ABLATION.map((r) => (
                  <tr key={`${r.detect}-${r.eta0}`}>
                    <td>{r.detect}</td>
                    <td>{r.eta0}</td>
                    <td>{r.online}</td>
                    <td>{r.batch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </StoryBeat>

        <section className="story-beat" id="stack">
          <p className="story-kicker">How it works</p>
          <h2>The tools, in plain terms</h2>
          <p className="stack-intro">
            Each card is one piece: what it does, then how. Standard tools so you can clone the repo
            and rerun the number.
          </p>
          <StackGrid />
        </section>

        <StoryBeat
          id="decisions"
          kicker="Design choices"
          title="The calls I made"
          caption="What I first reached for, and what I built instead."
          visual={
            <div className="teach-card">
              <h3 className="teach-card__title">First idea, and what I built</h3>
              <table className="choice-table">
                <caption className="sr-only">Design choices</caption>
                <thead>
                  <tr>
                    <th scope="col">First idea</th>
                    <th scope="col">What I built</th>
                  </tr>
                </thead>
                <tbody>
                  {DECISIONS.map((d) => (
                    <tr key={d.first}>
                      <td>{d.first}</td>
                      <td>{d.built}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          }
        >
          <p>
            <strong>I scored after the change, not on the whole stream.</strong> Mixing the easy
            pre-change hours into the headline would hide whether adaptation mattered.
          </p>
          <p>
            <strong>I kept a frozen column.</strong> An updating model that looks strong in isolation
            is not news. Beating a model that saw the same features and never updated is.
          </p>
          <p>
            <strong>I did not wait on a broker.</strong> The thesis is the split and the leak test. A
            Kafka topic and a Redis key are the production shape; this run uses an in-process queue
            and a dict so the number exists without Docker.
          </p>
        </StoryBeat>

        <section className="story-beat" id="use">
          <p className="story-kicker">Running it</p>
          <h2>Clone it and rerun the number</h2>
          <p style={{ maxWidth: 'var(--measure)' }}>
            No download keys. The stream is generated. Compose is optional; the reported run does not
            use it.
          </p>
          <ol className="stack-list" style={{ maxWidth: 'var(--measure)' }}>
            <li>Run <code>python -m pytest tests/test_eval.py -q</code>. The leak injection inside that file must fail.</li>
            <li>Run <code>python scripts/run.py</code>. It prints online success percent next to frozen batch and writes <code>metrics.json</code>.</li>
            <li>Run <code>npm --prefix web run dev</code> to read this page. Numbers come from <code>web/src/data.ts</code>.</li>
          </ol>
        </section>

        <section className="story-beat" id="next">
          <p className="story-kicker">What is next</p>
          <h2>Where I would take it</h2>
          <ul className="stack-list" style={{ maxWidth: 'var(--measure)' }}>
            {NEXT.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <h3 style={{ marginTop: 'var(--space-5)' }}>Who this number is for</h3>
          <ul className="stack-list" style={{ maxWidth: 'var(--measure)' }}>
            {SECTORS.map((s) => (
              <li key={s.name}>
                <strong>{s.name}.</strong> {s.job}
              </li>
            ))}
          </ul>
        </section>

        <footer
          id="close"
          style={{
            borderTop: '1px solid var(--line-rule)',
            paddingTop: 'var(--space-6)',
            marginTop: 'var(--space-6)',
            color: 'var(--fg-low)',
            fontSize: 'var(--fs-sm)',
          }}
        >
          <p style={{ maxWidth: 'var(--measure)' }}>
            I adapt on the bus with a leak test. A weekly notebook retrain is not the comparison I
            care about here. The stream is synthetic with a planted flip, {METRICS.nEvents.toLocaleString()}{' '}
            events, seed {META.seed}. It is a portfolio split, not a production fraud system.
          </p>
        </footer>
      </main>
    </>
  )
}
