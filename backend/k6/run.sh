#!/usr/bin/env bash
# Запускает нагрузочные тесты k6.
# Использование:
#   ./k6/run.sh [test] [scenario]
#
# test     : auth | decks | wordsets | schedules | full (по умолчанию: full)
# scenario : smoke | load | stress | spike | soak   (по умолчанию: smoke)
#
# Примеры:
#   ./k6/run.sh                          # full_scenario + smoke
#   ./k6/run.sh auth load                # auth.js + load
#   ./k6/run.sh full stress              # full_scenario + stress
#   BASE_URL=http://prod:8080 ./k6/run.sh full load

set -euo pipefail

TEST="${1:-full}"
SCENARIO="${2:-smoke}"
BASE_URL="${BASE_URL:-http://localhost:8080}"
RESULTS_DIR="$(dirname "$0")/results"

mkdir -p "$RESULTS_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
JSON_OUT="$RESULTS_DIR/${TEST}_${SCENARIO}_${TIMESTAMP}.json"

case "$TEST" in
  auth)      SCRIPT="k6/auth.js"          ;;
  decks)     SCRIPT="k6/decks.js"         ;;
  wordsets)  SCRIPT="k6/wordsets.js"      ;;
  schedules) SCRIPT="k6/schedules.js"     ;;
  full)      SCRIPT="k6/full_scenario.js" ;;
  *)
    echo "Неизвестный тест: $TEST"
    echo "Доступные тесты: auth | decks | wordsets | schedules | full"
    exit 1
    ;;
esac

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " k6 нагрузочный тест"
echo " Скрипт    : $SCRIPT"
echo " Сценарий  : $SCENARIO"
echo " BASE_URL  : $BASE_URL"
echo " Результат : $JSON_OUT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

k6 run \
  --env SCENARIO="$SCENARIO" \
  --env BASE_URL="$BASE_URL" \
  --out "json=$JSON_OUT" \
  "$SCRIPT"
