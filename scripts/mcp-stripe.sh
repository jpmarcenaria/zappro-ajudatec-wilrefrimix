#!/usr/bin/env bash
set -a
source "$(dirname "$0")/../.env"
set +a

npx -y @stripe/mcp --tools=all --api-key "$STRIPE_SECRET_KEY"
