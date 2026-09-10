"""Generate planted-drift stream -> online vs frozen batch -> metrics.json.

CLI: python scripts/run.py
Prints online vs batch success_pct on the post-drift window.
"""

import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from river_kafka.ablate import ablation, print_table
from river_kafka.eval import evaluate, print_report

METRICS = "metrics.json"


def main():
    m = evaluate()
    if m["n_events"] > 100_000:
        sys.exit(f"HARD FAIL: {m['n_events']} events over cap 100000")
    rows = ablation()
    m["ablation"] = rows
    with open(METRICS, "w") as f:
        json.dump(m, f, indent=2)
    print_report(m)
    print_table(rows)


if __name__ == "__main__":
    main()
