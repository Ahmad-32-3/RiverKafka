// Every number the page shows lives here.
// Measured by scripts/run.py on a 40,000-event planted-drift stream (seed 7).

export const ILLUSTRATIVE = false

export const META = {
  nEvents: 40000,
  nPost: 20000,
  driftT: 20000,
  nFeatures: 8,
  seed: 7,
  eta0: 0.08,
  nResets: 1,
}

export const METRICS = {
  onlinePct: 90.6,
  batchPct: 5.4,
  nEvents: 40000,
  driftT: 20000,
  nResets: 1,
}

// Post-drift window, 1,000-event bins. Fraction right, stored as percent.
export const ROLLING = {
  bins: 20,
  binSize: 1000,
  online: [80.1, 90.5, 91.9, 93.2, 93.0, 90.7, 90.6, 90.9, 90.4, 91.8, 91.6, 92.6, 89.9, 91.3, 91.2, 90.5, 89.4, 91.9, 90.4, 90.4],
  batch: [5.3, 5.7, 4.5, 4.0, 4.4, 6.1, 5.8, 6.3, 6.0, 5.4, 4.9, 4.5, 6.6, 5.2, 5.0, 5.6, 6.0, 4.9, 5.6, 6.4],
}

export type Counter = { key: string; label: string; value: number; unit: string; note: string }
export const COUNTERS: Counter[] = [
  { key: 'online', label: 'Online model, after the change', value: METRICS.onlinePct, unit: '%', note: 'updates on each event, then I score it' },
  { key: 'batch', label: 'Frozen model, after the change', value: METRICS.batchPct, unit: '%', note: 'fit only on the window before the change' },
  { key: 'n', label: 'Events in the stream', value: METRICS.nEvents, unit: '', note: 'half before the planted change, half after' },
  { key: 'resets', label: 'Times the online model reset', value: METRICS.nResets, unit: '', note: 'error window crossed the drift threshold once' },
]

export const ABLATION = [
  { detect: 'on', eta0: '0.08', online: '90.6', batch: '5.4', note: 'headline run' },
  { detect: 'off', eta0: '0.08', online: '90.7', batch: '5.4', note: 'no reset' },
  { detect: 'on', eta0: '0.02', online: '92.3', batch: '5.4', note: 'slower step size' },
  { detect: 'on', eta0: '0.20', online: '88.7', batch: '5.4', note: 'faster step size' },
]

export const COMPARISON = [
  { metric: 'Share of post-change events scored right', online: '90.6%', batch: '5.4%', best: 'online' },
  { metric: 'Trained on labels after the event it scores', online: 'no', batch: 'no', best: 'tie' },
  { metric: 'Fit on the post-change window', online: 'updates as it goes', batch: 'never', best: 'online' },
  { metric: 'Same features both paths', online: '8 numbers per event', batch: '8 numbers per event', best: 'tie' },
] as const

export const DECISIONS = [
  {
    first: 'Wait for a nightly retrain',
    built: 'Update on each event as it arrives, after I score it',
  },
  {
    first: 'Report one accuracy number on the whole stream',
    built: 'Score only after the planted change, online next to frozen',
  },
  {
    first: 'Let the online path see future labels',
    built: 'A test that fails if training uses a later timestamp',
  },
  {
    first: 'Stand up Kafka and Redis before the number exists',
    built: 'An in-process stream and a dict for the live version pointer',
  },
] as const

export type Tool = { name: string; tag: string; plain: string; tech: string }
export const STACK: Tool[] = [
  {
    name: 'planted stream',
    tag: 'data',
    plain: 'Forty thousand labeled events with one known change in the middle.',
    tech: 'Eight features. The first three flip sign at event 20,000. Five percent of labels are noise. Seed 7, under the 100,000-event cap.',
  },
  {
    name: 'in-process bus',
    tag: 'stream',
    plain: 'Events arrive one after another, the way they would on a message bus.',
    tech: 'A Python iterator of (features, label, time). Kafka is the production shape; this run does not need a broker to get the number.',
  },
  {
    name: 'numpy logistic SGD',
    tag: 'online',
    plain: 'The model that updates after each event.',
    tech: 'One gradient step per event. A 400-event error window resets the weights when the miss rate crosses 30 percent.',
  },
  {
    name: 'sklearn logistic',
    tag: 'batch',
    plain: 'The model that trains once on the first half and then stays frozen.',
    tech: 'LogisticRegression fit only on t < 20,000. Same eight features as the online path.',
  },
  {
    name: 'version pointer',
    tag: 'serve',
    plain: 'A key that says which model is live for serving.',
    tech: 'A dict standing in for a Redis key. It flips from batch-v0 to online-v0 after the pre-change warmup.',
  },
  {
    name: 'Vite, React, motion',
    tag: 'page',
    plain: 'Builds this page and draws the charts.',
    tech: 'React and Tailwind on Vite. The charts are hand-drawn SVG from the numbers above. The page makes no network calls.',
  },
]

export const NEXT = [
  'Put the same learner on a real Kafka topic and store the live version in Redis.',
  'Swap the windowed-error reset for River ADWIN on a stream whose change is slower than a hard flip.',
  'Click fraud, IoT anomaly, and live pricing all have this shape: a live scorer, a world that moves, and a frozen model that does not.',
]

export const SECTORS = [
  {
    name: 'Click fraud',
    job: 'A bot farm changes its click pattern at noon. The frozen scorer keeps yesterday’s rule. The online path has to catch up without training on clicks that have not happened yet.',
  },
  {
    name: 'IoT anomaly',
    job: 'A sensor drift is a planted change with a timestamp. Scoring after that timestamp, not on the whole log, is the number a plant engineer would trust.',
  },
  {
    name: 'Live pricing',
    job: 'Demand shifts. A price model fit last week will keep quoting last week. Updating on each sale, then measuring after the shift, is the same split I use here.',
  },
]
