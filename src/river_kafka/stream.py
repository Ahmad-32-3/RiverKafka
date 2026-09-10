# Planted-drift labeled events. t* is known. Labels after t* are a different
# rule. Training on a later t than the event you are scoring is a leak.

from dataclasses import dataclass

import numpy as np

from . import const


@dataclass(frozen=True)
class Stream:
    t: np.ndarray
    X: np.ndarray
    y: np.ndarray
    drift_t: int


def generate(n=const.N_EVENTS, drift_t=const.DRIFT_T, seed=const.SEED, noise=const.NOISE):
    if n > 100_000:
        raise ValueError(f"HARD FAIL: {n} events over cap 100000")
    rng = np.random.default_rng(seed)
    X = rng.normal(0, 1, size=(n, const.N_FEATURES))
    t = np.arange(n, dtype=np.int64)
    w_pre = np.zeros(const.N_FEATURES)
    w_pre[:3] = 1.0
    w_post = -w_pre
    w = np.where(t[:, None] < drift_t, w_pre, w_post)
    logits = np.sum(w * X, axis=1)
    flip = rng.random(n) < noise
    y = (logits > 0).astype(np.int32)
    y = np.where(flip, 1 - y, y)
    return Stream(t=t, X=X, y=y, drift_t=drift_t)


def assert_no_future_labels(train_times, predict_t):
    """Fail if any label used for training arrived after the event we score."""
    times = np.asarray(train_times)
    if times.size and np.any(times > predict_t):
        raise ValueError("leak: training used future labels")


def assert_batch_pre_drift_only(train_times, drift_t):
    times = np.asarray(train_times)
    if times.size and np.any(times >= drift_t):
        raise ValueError("leak: batch trained on post-drift labels")
