#!/bin/sh
# Dependency audit: fail on high/critical advisories in
# production dependencies, or critical ones anywhere. Both checks always run,
# so one failing doesn't hide the other's report.
bun audit --prod --audit-level=high
prod=$?
bun audit --audit-level=critical
all=$?
[ "$prod" -eq 0 ] && [ "$all" -eq 0 ]
