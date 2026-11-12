#!/bin/bash
# Run this DIRECTLY ON THE SERVER (ssh root@200.141.1.47) to update SMS settings
# ------------------------------------------------------------------

# 1. Find the .env file
ENV_PATH=$(find /root /var/www -name '.env' 2>/dev/null | grep -v node_modules | head -1)
echo "Found .env at: $ENV_PATH"

# 2. Backup
cp "$ENV_PATH" "${ENV_PATH}.bak-$(date +%Y%m%d%H%M%S)"
echo "Backed up to: ${ENV_PATH}.bak"

# 3. Disable default OTP mode
sed -i 's/^USE_DEFAULT_OTP=true/USE_DEFAULT_OTP=false/' "$ENV_PATH"

# 4. Remove any old SMS India Hub entries
sed -i '/^SMS_INDIA_HUB/d' "$ENV_PATH"

# 5. Append SMS India Hub settings
cat >> "$ENV_PATH" << 'EOF'

# SMS India Hub (Active SMS Provider)
SMS_INDIA_HUB_API_KEY=jLTutzhSlUK667Ma1eHZlg
SMS_INDIA_HUB_SENDER_ID=FOODST
SMS_INDIA_HUB_CHANNEL=OTP
SMS_INDIA_HUB_DCS=0
SMS_INDIA_HUB_FLASH_SMS=0
SMS_INDIA_HUB_ENTITY_ID=
SMS_INDIA_HUB_TEMPLATE_ID=
EOF

echo ""
echo "Done! Verifying:"
grep -E 'USE_DEFAULT_OTP|SMS_INDIA_HUB_API_KEY|SMS_INDIA_HUB_SENDER' "$ENV_PATH"

# 6. Restart backend PM2 process
pm2 restart foodsaathi-api
echo ""
echo "✅ PM2 restarted. OTP will now send via SMS India Hub."

