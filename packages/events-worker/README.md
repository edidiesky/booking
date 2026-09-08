# events-worker

**This package exists on disk and has never run anywhere in this
platform's history.**

## Real, honest status

Not wired into any docker-compose file, dev or workers-specific. Never
part of the in-process worker migration either, since that migration
only moved workers that were already running as standalone containers
at the time, this one wasn't among them.

## What it's presumably for

Given the name and its position alongside the other event-consuming
workers, this was likely intended as a general-purpose event
consumer, but there's no confirmed, current record of what specific
events it was meant to handle or what it currently contains. Not
guessed at further here rather than presented with false confidence.

## Real, honest next step

Before this package is either wired in or removed, it needs an actual
read of its current source to determine whether it contains anything
worth keeping, or whether it's safe to delete outright as unused,
never-run scaffolding.