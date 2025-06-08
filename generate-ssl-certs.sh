#!/bin/bash

# Create SSL directory if it doesn't exist
mkdir -p ssl

# Generate self-signed SSL certificate for development
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl/key.pem -out ssl/cert.pem -subj "/CN=localhost"

echo "Self-signed SSL certificates generated successfully!"
echo "Note: These certificates are for development only. Use proper certificates in production."
