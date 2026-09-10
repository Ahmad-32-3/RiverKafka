import numpy as np
import pytest

from river_kafka import const
from river_kafka.ablate import ablation
from river_kafka.eval import evaluate
from river_kafka.stream import assert_batch_pre_drift_only, assert_no_future_labels, generate


def test_leak_injection_fails():
    with pytest.raises(ValueError, match="leak"):
        assert_no_future_labels([0, 1, 50], predict_t=10)


def test_batch_post_drift_labels_fail():
    with pytest.raises(ValueError, match="leak"):
        assert_batch_pre_drift_only([0, 1, const.DRIFT_T], drift_t=const.DRIFT_T)


def test_stream_respects_cap_and_seed():
    s = generate()
    assert len(s.t) <= 100_000
    assert len(s.t) == const.N_EVENTS
    assert s.drift_t == const.DRIFT_T
    s2 = generate()
    np.testing.assert_array_equal(s.y, s2.y)


def test_evaluate_online_beats_batch_and_clears_floor():
    m = evaluate()
    assert m["n_events"] <= 100_000
    assert m["n_features"] == const.N_FEATURES
    assert m["success_pct_online"] >= 85.0
    assert m["success_pct_online"] > m["success_pct_batch"]


def test_ablation_has_detector_and_learn_rate():
    rows = ablation()
    keys = {(r["detect"], r["eta0"]) for r in rows}
    assert (True, const.ETA0) in keys
    assert (False, const.ETA0) in keys
    assert any(r["eta0"] != const.ETA0 for r in rows)
    assert all("success_pct_online" in r and "success_pct_batch" in r for r in rows)


def test_online_path_rejects_future_label_during_learn():
    from river_kafka.learn import OnlineSGD

    clf = OnlineSGD(detect=False)
    x = np.zeros(const.N_FEATURES)
    clf.learn_one(0, x, 1)
    with pytest.raises(ValueError, match="leak"):
        clf.learn_one(5, x, 0, predict_t=2)
