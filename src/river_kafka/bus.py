# ponytail: in-process queue. Kafka topic when a broker is on the box (DESIGN ADR).

from .stream import Stream


def iter_events(stream: Stream):
    for i in range(len(stream.t)):
        yield int(stream.t[i]), stream.X[i], int(stream.y[i])
