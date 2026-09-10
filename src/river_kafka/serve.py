# ponytail: dict pointer. Redis SET when a server answers PING (DESIGN ADR).

from . import const


class Pointer:
    def __init__(self):
        self._store = {const.SERVE_KEY: "batch-v0"}

    def set(self, version: str):
        self._store[const.SERVE_KEY] = version

    def get(self) -> str:
        return self._store[const.SERVE_KEY]
