#!/bin/bash
# ============================================================
# CDN Setup Script for cdn.sanaathrumylens.co.ke
# ============================================================
# 
# Run this script on your cPanel shared hosting after
# creating the cdn.sanaathrumylens.co.ke subdomain.
#
# USAGE:
#   1. SSH into your shared hosting
#   2. cd ~/public_html/cdn.sanaathrumylens.co.ke
#   3. Upload all files from the /cdn directory
#   4. Run: bash setup.sh
# ============================================================

echo "🔧 Setting up CDN for cdn.sanaathrumylens.co.ke..."
echo ""

# Create uploads directory
mkdir -p uploads
echo "✅ Created uploads/ directory"

# Set permissions
chmod 755 uploads/
chmod 755 api/
chmod 644 api/*.php
chmod 644 config.php
chmod 644 .htaccess
chmod 644 uploads/.htaccess
chmod 644 index.php
echo "✅ Set file permissions"

# Generate API key if not set
if grep -q "CHANGE_ME_to_a_strong_random_key" config.php; then
    API_KEY=$(openssl rand -hex 32)
    sed -i "s/CHANGE_ME_to_a_strong_random_key_use_openssl_rand_hex_32/$API_KEY/" config.php
    echo ""
    echo "🔑 Generated API Key:"
    echo "   $API_KEY"
    echo ""
    echo "   ⚠️  SAVE THIS KEY! Add it to your Vercel environment variables as:"
    echo "   CDN_API_KEY=$API_KEY"
    echo ""
else
    echo "⚠️  API key already configured in config.php"
fi

# Test PHP
PHP_VERSION=$(php -v 2>/dev/null | head -1)
if [ -n "$PHP_VERSION" ]; then
    echo "✅ PHP detected: $PHP_VERSION"
else
    echo "⚠️  Could not detect PHP version"
fi

echo ""
echo "📋 SETUP COMPLETE!"
echo ""
echo "Next steps:"
echo "1. Add the CDN_API_KEY to Vercel environment variables"
echo "2. Test upload: curl -X POST https://cdn.sanaathrumylens.co.ke/api/upload.php -H 'X-API-Key: YOUR_KEY' -F 'file=@test.jpg' -F 'folder=posts'"
echo "3. Verify image loads: https://cdn.sanaathrumylens.co.ke/uploads/..."
echo ""
