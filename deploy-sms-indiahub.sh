#!/bin/bash
# ============================================================
# FoodSaathi — Deploy SMS India Hub OTP Integration
# Run this script from your local terminal to commit + deploy
# ============================================================

set -e

PROJECT_DIR="/Users/harshitabade/Documents/GitHub/FoodSaathi"
SERVER="root@200.141.1.47"
SERVER_PASS="I8r4IC,yr)C7X')M"
SERVER_ENV_FILE="/root/foodsaathi-backend/.env"   # adjust if different
SERVER_OTP_SERVICE="/root/foodsaathi-backend/src/core/otp/otp.service.js"
SERVER_ENV_CONFIG="/root/foodsaathi-backend/src/config/env.js"

echo "================================================"
echo "  FoodSaathi SMS India Hub Deployment"
echo "================================================"

# ---- STEP 1: Git commit locally ----
cd "$PROJECT_DIR"
echo ""
echo "[1/4] Committing changes locally..."
git add Backend/src/config/env.js Backend/src/core/otp/otp.service.js
git commit -m "feat(otp): integrate SMS India Hub for OTP delivery; disable default OTP mode"
git push origin main
echo "    ✅ Git push done"

# ---- STEP 2: SSH to server and update .env ----
echo ""
echo "[2/4] Updating .env on server..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no "$SERVER" "
  # Find .env file
  ENV_PATH=\$(find /root -name '.env' -path '*/backend*' 2>/dev/null | head -1)
  if [ -z \"\$ENV_PATH\" ]; then
    ENV_PATH=\$(find /var/www -name '.env' 2>/dev/null | head -1)
  fi
  echo \"Found .env at: \$ENV_PATH\"

  # Backup existing .env
  cp \"\$ENV_PATH\" \"\$ENV_PATH.bak-\$(date +%Y%m%d%H%M%S)\"

  # Update USE_DEFAULT_OTP to false
  sed -i 's/^USE_DEFAULT_OTP=true/USE_DEFAULT_OTP=false/' \"\$ENV_PATH\"

  # Remove old SMS India Hub lines if any
  sed -i '/^SMS_INDIA_HUB/d' \"\$ENV_PATH\"

  # Append SMS India Hub config
  echo '' >> \"\$ENV_PATH\"
  echo '# SMS India Hub (Active Provider)' >> \"\$ENV_PATH\"
  echo 'SMS_INDIA_HUB_API_KEY=jLTutzhSlUK667Ma1eHZlg' >> \"\$ENV_PATH\"
  echo 'SMS_INDIA_HUB_SENDER_ID=FOODST' >> \"\$ENV_PATH\"
  echo 'SMS_INDIA_HUB_CHANNEL=OTP' >> \"\$ENV_PATH\"
  echo 'SMS_INDIA_HUB_DCS=0' >> \"\$ENV_PATH\"
  echo 'SMS_INDIA_HUB_FLASH_SMS=0' >> \"\$ENV_PATH\"
  echo 'SMS_INDIA_HUB_ENTITY_ID=' >> \"\$ENV_PATH\"
  echo 'SMS_INDIA_HUB_TEMPLATE_ID=' >> \"\$ENV_PATH\"

  echo '.env updated successfully'
  grep 'USE_DEFAULT_OTP\|SMS_INDIA_HUB_API_KEY' \"\$ENV_PATH\"
"
echo "    ✅ Server .env updated"

# ---- STEP 3: Pull latest code on server ----
echo ""
echo "[3/4] Running deploy.sh on server..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no "$SERVER" "bash /root/deploy.sh"
echo "    ✅ Deploy complete"

# ---- STEP 4: Verify ----
echo ""
echo "[4/4] Checking PM2 status..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no "$SERVER" "pm2 status"

echo ""
echo "================================================"
echo "  ✅ SMS India Hub integration deployed!"
echo ""
echo "  Test phones (use OTP 123456):"
echo "    9755633147  8624862400"
echo ""
echo "  Other phones → real SMS via SMS India Hub"
echo "================================================"

