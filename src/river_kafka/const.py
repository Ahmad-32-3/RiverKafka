# DESIGN defaults. Change a knob with one ADR line in DESIGN.md.

SEED = 7
N_EVENTS = 40_000  # strong stream, under the 100k cap
N_FEATURES = 8
DRIFT_T = 20_000
NOISE = 0.05
ETA0 = 0.08
DETECT_WINDOW = 400
DETECT_ERR = 0.30
FLOOR = 0.85
SERVE_KEY = "river-kafka:model"
