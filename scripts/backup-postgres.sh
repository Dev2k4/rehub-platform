#!/usr/bin/env sh

set -eu

mkdir -p /backups

while true; do
  timestamp=$(date +"%Y%m%d-%H%M%S")
  backup_file="/backups/${POSTGRES_DB}-${timestamp}.sql.gz"

  echo "[backup] Creating backup: ${backup_file}"
  PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
    -h "${POSTGRES_HOST}" \
    -p "${POSTGRES_PORT}" \
    -U "${POSTGRES_USER}" \
    "${POSTGRES_DB}" | gzip > "${backup_file}"

  echo "[backup] Removing files older than ${BACKUP_RETENTION_DAYS} days"
  find /backups -type f -name "*.sql.gz" -mtime "+${BACKUP_RETENTION_DAYS}" -delete

  echo "[backup] Sleeping ${BACKUP_INTERVAL_HOURS} hour(s)"
  sleep "$((BACKUP_INTERVAL_HOURS * 3600))"
done
