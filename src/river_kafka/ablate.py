# Detector on/off and learn-rate columns. Same stream as eval. Keep the worse rows.

from . import const
from .eval import evaluate
from .stream import generate


def ablation(stream=None):
    stream = stream or generate()
    rows = []
    for detect, eta0 in (
        (True, const.ETA0),
        (False, const.ETA0),
        (True, 0.02),
        (True, 0.20),
    ):
        m = evaluate(stream, detect=detect, eta0=eta0)
        rows.append(
            {
                "detect": detect,
                "eta0": eta0,
                "success_pct_online": m["success_pct_online"],
                "success_pct_batch": m["success_pct_batch"],
                "n_resets": m["n_resets"],
            }
        )
    return rows


def print_table(rows):
    print(f"{'detect':<8}{'eta0':>8}{'online%':>10}{'batch%':>10}{'resets':>8}")
    for r in rows:
        print(
            f"{str(r['detect']):<8}{r['eta0']:>8.2f}"
            f"{r['success_pct_online']:>10.1f}{r['success_pct_batch']:>10.1f}{r['n_resets']:>8d}"
        )
