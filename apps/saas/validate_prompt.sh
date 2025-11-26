#!/bin/bash
# Run this to verify prompt compliance

echo "Checking system prompt configuration..."

# Check date context
if grep -q "202[0-4]" app/api/openai/chat/route.ts; then
  echo "❌ FAIL: Outdated date in prompt"
else
  echo "✅ PASS: Date context current"
fi

# Check manual prohibition
if grep -q "NEVER.*manual\|prohibited.*manual" Refinar_prompt.md; then
  echo "✅ PASS: Manual prohibition enforced"
else
  echo "❌ FAIL: Manual policy not explicit"
fi

# Check pt-BR enforcement
if grep -q "pt-BR\|Portuguese BR" app/api/openai/chat/route.ts; then
  echo "✅ PASS: Language locked to pt-BR"
else
  echo "❌ FAIL: Language not enforced"
fi
