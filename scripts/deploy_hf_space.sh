#!/usr/bin/env bash
#
# Sync demo/backend/ to a Hugging Face Space using the HF CLI (xet-aware).
#
# Prerequisites:
#   - huggingface-cli login  (or export HF_TOKEN)
#   - the Space exists (create it via https://huggingface.co/new-space)
#
# Usage:
#   bash scripts/deploy_hf_space.sh https://huggingface.co/spaces/<user>/<name>
#
set -euo pipefail

SPACE_URL="${1:?usage: $0 https://huggingface.co/spaces/<user>/<name>}"
BACKEND_DIR="$(git rev-parse --show-toplevel)/demo/backend"

REPO_ID="${SPACE_URL#https://huggingface.co/spaces/}"
REPO_ID="${REPO_ID%/}"

if [ ! -d "$BACKEND_DIR" ]; then
  echo "error: $BACKEND_DIR not found" >&2
  exit 1
fi

if [ ! -f "$BACKEND_DIR/models/rural_gb_pipeline.joblib" ]; then
  echo "error: model artifact missing — run 'uv run python scripts/export_model.py' first" >&2
  exit 1
fi

echo "→ Uploading $BACKEND_DIR → space $REPO_ID"
uv run huggingface-cli upload "$REPO_ID" "$BACKEND_DIR" . \
  --repo-type=space \
  --commit-message="deploy: sync from WinterProject/demo/backend" \
  --exclude ".venv/*" "**/__pycache__/*" "*.pyc" ".python-version" \
            "postman_collection.json" ".dockerignore" ".next/*" "node_modules/*" \
  --delete "*"

echo "✓ Deployed to $SPACE_URL"
