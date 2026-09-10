# Post-drift success_pct: online (prequential) vs frozen batch. Same features.

import numpy as np

from . import const
from .bus import iter_events
from .learn import OnlineSGD, fit_batch
from .serve import Pointer
from .stream import Stream, assert_batch_pre_drift_only, assert_no_future_labels, generate


def _bin_acc(correct, bin_size=1000):
    out = []
    for i in range(0, len(correct), bin_size):
        chunk = correct[i : i + bin_size]
        out.append(float(np.mean(chunk)))
    return out


def evaluate(stream: Stream | None = None, detect=True, eta0=const.ETA0):
    stream = stream or generate()
    if len(stream.t) > 100_000:
        raise ValueError(f"HARD FAIL: {len(stream.t)} events over cap 100000")

    pre = stream.t < stream.drift_t
    post = ~pre
    assert_batch_pre_drift_only(stream.t[pre], stream.drift_t)
    batch = fit_batch(stream.X[pre], stream.y[pre])

    online = OnlineSGD(eta0=eta0, detect=detect)
    pointer = Pointer()
    pointer.set("batch-v0")

    for t, x, y in iter_events(Stream(stream.t[pre], stream.X[pre], stream.y[pre], stream.drift_t)):
        online.learn_one(t, x, y)

    pointer.set("online-v0")
    online_ok = []
    batch_ok = []
    for t, x, y in iter_events(Stream(stream.t[post], stream.X[post], stream.y[post], stream.drift_t)):
        assert_no_future_labels([online.max_t], t)
        yhat_o = online.predict_one(x)
        yhat_b = int(batch.predict(x.reshape(1, -1))[0])
        online_ok.append(int(yhat_o == y))
        batch_ok.append(int(yhat_b == y))
        online.learn_one(t, x, y, predict_t=t)

    n_post = len(online_ok)
    online_pct = 100.0 * float(np.mean(online_ok))
    batch_pct = 100.0 * float(np.mean(batch_ok))
    return {
        "success_pct_online": online_pct,
        "success_pct_batch": batch_pct,
        "n_events": int(len(stream.t)),
        "n_post": n_post,
        "drift_t": int(stream.drift_t),
        "n_features": int(stream.X.shape[1]),
        "seed": const.SEED,
        "detect": detect,
        "eta0": eta0,
        "n_resets": online.n_resets,
        "serve": pointer.get(),
        "rolling_online": _bin_acc(online_ok),
        "rolling_batch": _bin_acc(batch_ok),
    }


def print_report(m):
    print(
        f"online {m['success_pct_online']:.1f}%  |  batch {m['success_pct_batch']:.1f}%  "
        f"|  n={m['n_events']} drift_t={m['drift_t']} resets={m['n_resets']}"
    )
