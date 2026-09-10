# Online logistic SGD vs a frozen logistic fit only on t < t*.
# numpy SGD is the online path (one event, no sklearn per-call tax).
# Windowed-error reset stands in for ADWIN (DESIGN ADR).

from collections import deque

import numpy as np
from sklearn.linear_model import LogisticRegression

from . import const
from .stream import assert_no_future_labels


def _sigmoid(z):
    return 1.0 / (1.0 + np.exp(-np.clip(z, -30, 30)))


class OnlineSGD:
    def __init__(
        self,
        eta0=const.ETA0,
        detect=True,
        window=const.DETECT_WINDOW,
        err=const.DETECT_ERR,
        n_features=const.N_FEATURES,
    ):
        self.eta0 = eta0
        self.detect = detect
        self.n_features = n_features
        self.err_thresh = err
        self.w = np.zeros(n_features)
        self.b = 0.0
        self.max_t = -1
        self.errors = deque(maxlen=window)
        self.n_resets = 0

    def _reset(self):
        self.w = np.zeros(self.n_features)
        self.b = 0.0
        self.errors.clear()
        self.n_resets += 1

    def predict_one(self, x):
        return int(x @ self.w + self.b > 0)

    def learn_one(self, t, x, y, predict_t=None):
        if predict_t is not None:
            assert_no_future_labels([t], predict_t)
        if self.max_t >= 0:
            assert_no_future_labels([self.max_t], t)
        x = np.asarray(x, float)
        pred = int(x @ self.w + self.b > 0)
        self.errors.append(int(pred != y))
        if self.detect and len(self.errors) == self.errors.maxlen:
            if sum(self.errors) / len(self.errors) >= self.err_thresh:
                self._reset()
        p = _sigmoid(x @ self.w + self.b)
        g = p - y
        self.w -= self.eta0 * g * x
        self.b -= self.eta0 * g
        self.max_t = int(t)


def fit_batch(X, y):
    return LogisticRegression(max_iter=200, random_state=const.SEED).fit(X, y)
