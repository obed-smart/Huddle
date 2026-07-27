#!/bin/bash
# test/seed-users.sh
# Usage: ./test/seed-users.sh   (run from project root)
#     or: ./seed-users.sh        (run from inside test/)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="$SCRIPT_DIR/demo-users.json"

API_URL="http://localhost:8080/api/v1/auth/register"

# username firstName lastName
declare -a users=(
  "alice_wren:Alice:Wren"
  "bob_kade:Bob:Kade"
  "charlie_qu:Charlie:Qu"
  "diana_frost:Diana:Frost"
  "ethan_vale:Ethan:Vale"
  "fiona_reyes:Fiona:Reyes"
  "george_lin:George:Lin"
  "hannah_moss:Hannah:Moss"
  "ivan_cross:Ivan:Cross"
  "julia_park:Julia:Park"
)

echo "[" > "$OUTPUT_FILE"

count=${#users[@]}
i=0

for entry in "${users[@]}"; do
  IFS=":" read -r username firstName lastName <<< "$entry"
  email="${username}@example.com"
  password="TestPass123@"

  response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$username\",\"email\":\"$email\",\"password\":\"$password\",\"firstName\":\"$firstName\",\"lastName\":\"$lastName\"}")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo "✅ Registered: $username"
  else
    echo "❌ Failed: $username (HTTP $http_code) — $body"
  fi

  json_entry="{\"username\":\"$username\",\"email\":\"$email\",\"password\":\"$password\",\"firstName\":\"$firstName\",\"lastName\":\"$lastName\"}"

  i=$((i + 1))
  if [ "$i" -lt "$count" ]; then
    echo "  $json_entry," >> "$OUTPUT_FILE"
  else
    echo "  $json_entry" >> "$OUTPUT_FILE"
  fi
done

echo "]" >> "$OUTPUT_FILE"

echo ""
echo "Done. Credentials saved to $OUTPUT_FILE"