#! /usr/bin/env bash

set -euo pipefail
set -x

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_OPENAPI="${ROOT_DIR}/openapi.json.tmp"

export_openapi_with_uv() {
	(cd "${ROOT_DIR}/backend" && uv run python -c "import app.main; import json; print(json.dumps(app.main.app.openapi()))") > "${TMP_OPENAPI}"
}

export_openapi_from_running_backend() {
	python3 - <<'PY' > "${TMP_OPENAPI}"
import json
import urllib.request

with urllib.request.urlopen("http://localhost:8000/api/v1/openapi.json", timeout=20) as response:
		payload = json.loads(response.read().decode("utf-8"))

print(json.dumps(payload))
PY
}

if command -v uv >/dev/null 2>&1; then
	export_openapi_with_uv
else
	export_openapi_from_running_backend
fi

python3 - <<'PY' "${TMP_OPENAPI}" "${ROOT_DIR}/openapi.json" "${ROOT_DIR}/frontend/openapi.json"
import json
import pathlib
import sys

tmp_path = pathlib.Path(sys.argv[1])
root_spec = pathlib.Path(sys.argv[2])
frontend_spec = pathlib.Path(sys.argv[3])

content = tmp_path.read_text(encoding="utf-8").strip()
if not content:
		raise RuntimeError("OpenAPI export returned empty content")

spec = json.loads(content)
pretty = json.dumps(spec, ensure_ascii=False, indent=2)

root_spec.write_text(pretty, encoding="utf-8")
frontend_spec.write_text(pretty, encoding="utf-8")
PY

npm run generate-client --workspace=frontend
npm run lint --workspace=frontend
