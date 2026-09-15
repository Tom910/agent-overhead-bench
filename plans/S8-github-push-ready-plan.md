# S8 — GitHub push-ready

The repository is an unpublished measurement instrument. Official `v1` is
not tagged. The only remaining operator action is:

```text
git push -u origin main
```

Do not add `.env`, `scratch/`, or the Activity CSV. Do not tag `v1`.
Do not run `scripts/s7-freeze.sh` as part of this push.

## Verification before that push

```text
git ls-files | grep -E '(^|/)\\.env$|scratch/|__pycache__' && exit 1 || true
node scripts/s8-launch-check.mjs
```
