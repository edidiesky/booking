# Runbook: shell script fails with `invalid option` / stray `EOSQL` error in Alpine

## Symptom

A `docker-entrypoint-initdb.d` script (or any shell script mounted into
an Alpine-based container) fails on first run with errors like:

```
: invalid optionnt-initdb.d/10-replication.sh: line 1: set: -
here-document at line 2 delimited by end-of-file (wanted `EOSQL'
...
ERROR:  syntax error at or near "EOSQL"
```

## Root cause

The script has Windows-style CRLF (`\r\n`) line endings, typically from
being authored or edited on Windows. Alpine's default shell (`ash`/
`dash`) does not strip the trailing `\r`, so:

- `set -e\r` gets parsed as `set` with an invalid option (`-e` followed
  by a stray character).
- A heredoc closed with `EOSQL\r` never matches the literal `EOSQL`
  Postgres or the shell is looking for, so the heredoc swallows
  everything until EOF, and the leftover `EOSQL` line gets executed on
  its own afterward, producing a syntax error.

## Fix

Strip the `\r` from the file:

```bash
sed -i 's/\r$//' booking-infra/postgres/init-replication.sh
```

## Verification

Confirm no `^M` (displayed as literal `\r`) remains before each line
ending:

```bash
cat -A booking-infra/postgres/init-replication.sh | head -3
```

Every line should end in `$` with nothing between the visible text and
the `$`. Then re-trigger the script (e.g. a fresh `docker compose up -d`
against an empty data volume for `docker-entrypoint-initdb.d` scripts)
and confirm it completes without syntax errors in `docker logs`.

## Prevention

Configure the editor/IDE and `git config core.autocrlf` to keep shell
scripts LF-only, especially for any file under
`docker-entrypoint-initdb.d/` or otherwise executed directly inside a
Linux container. Consider a `.gitattributes` rule forcing LF for `*.sh`
files in this repo.