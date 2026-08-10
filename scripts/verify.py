"""Run the complete local verification suite with one cross-platform command."""

from __future__ import annotations

import subprocess
import sys
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def run(*arguments: str) -> None:
    print(f"\n> {' '.join(arguments)}", flush=True)
    subprocess.run(arguments, cwd=ROOT, check=True)


def main() -> None:
    python = sys.executable
    run(python, "scripts/catalog_tool.py", "check")
    run(python, "scripts/build_agent_api.py", "--check")
    run(python, "scripts/check_links.py")
    run(python, "tests/catalog_test.py")
    run(python, "tests/production_test.py")
    run(python, "tests/deployment_test.py")
    run(python, "tests/agent_catalog_test.py")

    handler = partial(SimpleHTTPRequestHandler, directory=ROOT)
    server = ThreadingHTTPServer(("127.0.0.1", 8099), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        run(python, "tests/site.spec.py")
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)

    print("\nDEVLIB verification: PASS")


if __name__ == "__main__":
    main()
