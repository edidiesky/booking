# Runbook: AWS CLI v2 pager fails on Git Bash / MINGW64

## Symptom
Any AWS CLI v2 command that produces output fails with:
'more' is not recognized as an internal or external command,
operable program or batch file.
The command's actual result never displays. Looks like an auth or
network failure, it is not, the real result is hidden behind this.

## Root cause
AWS CLI v2 pipes output through a pager by default (`more` on Windows).
Git Bash / MINGW64's PATH resolution for `more` doesn't work the way
CLI v2 expects, so the pager fails to launch before real output shows.

## Fix (pick one)
export AWS_PAGER=""                        # session only
aws configure set cli_pager ""              # permanent, writes ~/.aws/config
aws sts get-caller-identity --no-cli-pager  # per-command, no config change

## Verification
export AWS_PAGER=""
aws sts get-caller-identity
# expect real JSON: UserId, Account, Arn
# if it still errors, that's now the real error, diagnose separately

## Prevention
Apply the permanent fix once per machine as part of AWS CLI setup.

