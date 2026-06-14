#!/bin/sh
set -eu

# Drop-in hook for the official nginx image: every *.sh in /docker-entrypoint.d/
# runs before nginx starts. This script ONLY generates config — it must NOT
# start nginx (the base image's entrypoint does that afterwards).
#
# This is what makes ONE image deployable to many environments:
#   docker run -e API_BASE_URL=https://api.prod.example.com ...
# The default keeps a plain `docker run` working without extra flags.
: "${API_BASE_URL:=https://localhost:7041}"
export API_BASE_URL

envsubst '${API_BASE_URL}' \
  < /usr/share/nginx/html/config.template.json \
  > /usr/share/nginx/html/config.json

echo "Runtime config written: apiBaseUrl=${API_BASE_URL}"
