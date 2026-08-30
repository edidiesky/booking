# Runbook: secrets committed to git history, GitHub push protection blocked

## Symptom
remote: error: GH013: Repository rule violations found for refs/heads/main.
remote: - GITHUB PUSH PROTECTION
remote:     - Push cannot contain secrets
remote:       —— Google OAuth Client ID ————————————————————————————
remote:        locations:
remote:          - commit: <sha>
remote:            path: <file>:<line>

`git push` rejected outright, the commit never leaves your machine.

## Real priority order, get this right before anything else

1. **Rotate the exposed credentials first.** This is the actual fix.
   Once rotated, whatever's sitting in git history is dead, unusable,
   no longer a live risk, regardless of how messy the history cleanup
   turns out to be.
2. **Clean the git history second.** This is hygiene, not the
   emergency response. Doing it first, while the real credentials are
   still active, has the priority backwards.

Confirmed real, worth checking rather than assuming: whether the
secret ever reached the actual remote (origin), not just your local
history:

git show <suspect-commit-sha> -- <path/to/secret/file>

If run against the commit hash shown as (origin/main, origin/HEAD)
in `git log --oneline`, an empty result means the remote's history is
clean, the exposure was confined to local, never-pushed commits, real,
meaningful difference in urgency, don't skip this check and assume the
worse case by default.

## Root cause

Deleting a secret file in a new commit does not remove it from
history. The file still exists, in full, in the older commit object
that created it. git log/git show against that specific commit
still returns it, and any tool (including GitHub's push protection)
that scans full history, not just the current tree, still finds it.
This is why a git rm + new commit alone does not resolve a push
protection block, confirmed directly: the push was rejected again,
identical error, identical commit cited, after exactly that attempt.

## Fix: remove the commit from history, not just its effect

First, know exactly which commit(s) actually touch the file, don't
guess from commit messages alone, they can be misleading (a repo can
have multiple commits with near-identical messages that don't all
touch the same file):

git log --all --oneline -- <path/to/secret/file>

If the offending commit is at HEAD: a plain git reset is enough, no
rebase needed.

If other commits sit on top of it (the common case once someone's
already tried to "fix" it with a delete-and-commit): a rebase is
required. Two ways to do this, prefer the second if available:

Interactive rebase (opens an editor, real risk of it getting stuck
or exited without the change actually being applied, if unfamiliar
with the editor GitHub Actions/Git Bash defaults to):

git rebase -i <bad-commit>^
# change "pick" to "drop" on the bad commit's line, save, close

Non-interactive equivalent, no editor, no way to silently fail to
apply the change (confirmed to work cleanly in practice, including
resolving a "delete a file that no longer exists" step on its own with
no manual conflict resolution needed):

git rebase --onto <bad-commit>^ <bad-commit>

This replays every commit after <bad-commit> directly onto its
parent, skipping the bad commit entirely.

If the rebase does pause on a conflict (most likely on a later
commit that deletes the now-already-absent file):

git status
git rm -f <path/to/secret/file> 2>/dev/null
git rebase --continue

## Verification, both real, both required, don't push on assumption

# must return completely empty, if it shows the bad commit's hash at
# all, the rebase didn't actually run, or ran against the wrong range
git log --all --oneline -- <path/to/secret/file>

# commit count should be one fewer than before, and every hash after
# the drop point should be DIFFERENT from before (rebase rewrites them),
# identical hashes to a prior check mean nothing actually happened
git log --oneline -5

Only once both come back exactly as expected:

git push origin main

## Prevention

echo "path/to/env-file-pattern.*" >> .gitignore
git rm --cached <already-tracked-secret-file> 2>/dev/null
git add .gitignore
git commit -m "chore: gitignore secret files, prevent future commits"

Real gap this doesn't cover: a .gitignore entry only stops future
accidental commits of a file, it does nothing for a file already
tracked and committed, that still needs the history-rewrite procedure
above if it ever happened before the ignore rule was added.

Consider enabling GitHub's Secret Scanning for the repository directly
(Settings → Security → Secret scanning), push protection caught this
one, but proactive scanning of existing history catches things that
were pushed before protection was ever configured.

## Notes on tooling

bfg (BFG Repo-Cleaner) is a real, commonly recommended tool for this
exact problem, but ships as a .jar file, invoking a bare bfg
command fails with "command not found" unless a wrapper script was
separately installed (e.g. via Homebrew). On a machine without that,
either install Java and run java -jar bfg.jar --delete-files <file>,
or use the git-native git rebase --onto approach above, which
requires no additional installation at all and was confirmed to work
cleanly for a small number of commits in this incident.