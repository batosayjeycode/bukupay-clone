#!/bin/bash
# docker/nginx/ssl/generate-dev-certs.sh
# Generate self-signed SSL certificates for local development
# DO NOT use in production — use Let's Encrypt or your CA instead

set -e

CERT_DIR="$(dirname "$0")"

echo "🔑 Generating self-signed SSL certificates for development..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -subj "/C=ID/ST=DKI Jakarta/L=Jakarta/O=BukuPay/OU=Dev/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1"

echo "✅ Certificates generated:"
echo "   - $CERT_DIR/fullchain.pem"
echo "   - $CERT_DIR/privkey.pem"
echo ""
echo "⚠️  These are self-signed certificates for LOCAL DEV ONLY."
echo "   Browsers will show a warning — click 'Advanced > Proceed anyway'"
