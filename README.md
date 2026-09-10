# RiverKafka

Many company models score events as they arrive on a bus (Kafka). The world changes. Fraud patterns shift. Click behavior shifts. A model fit once on last month's data can keep answering with last month's habits.

Waiting for a nightly retrain leaves a gap. Updating on every event can help, but only if I do not cheat by using future labels, and only if I notice when the stream has changed enough to reset or adapt.

I stream labeled events with a clear drift point. One path updates an online model (River or `partial_fit`) and may use a drift detector. The other path freezes a batch model trained only on the pre-drift window. Redis stores which version is live for serving. I score both on the post-drift window. The online path should win if adaptation mattered.

## Run

```bash
python -m pytest tests/ -q
python scripts/run.py
npm --prefix web install
npm --prefix web run dev
```

Compose brings up Kafka and Redis when Docker is available. `scripts/run.py` prints online vs frozen-batch success on the post-drift window. Training on future labels must fail in pytest.

## Layout

- `src/` stream, online learner, frozen batch, drift point
- `scripts/run.py`
- `tests/` future-label leak checks
- `web/` case-study page
