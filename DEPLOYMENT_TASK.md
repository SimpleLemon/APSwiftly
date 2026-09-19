# APSwiftly Deployment Task

Use this runbook to deploy local APSwiftly changes to the production VPS.

## Production Targets

| Item | Value |
|------|-------|
| VPS | `root@82.38.134.175` |
| SSH key | `~/.ssh/nest-dvvps` |
| APSwiftly directory | `/var/www/apswiftly/` |
| systemd service | `apswiftly.service` |
| Runtime user | `deployer` |

Do not deploy APSwiftly files to `/var/www/nest.apstudy.org/`. That directory belongs to the separate Nest application.

## Before Deploying

1. Review the local changes:

   ```bash
   git status --short
   git diff --check
   git diff -- <changed-files>
   ```

2. Run the checks appropriate to the changed files. At minimum, check modified JavaScript files:

   ```bash
   node --check "path/to/changed-file.js"
   ```

3. Never deploy `config.json`, `.env`, `database/`, credentials, or local database files from the repository.

## Deploy Selected Files

Use this method for isolated command or documentation changes that do not alter dependencies.

1. Copy each file to its matching path under `/var/www/apswiftly/`:

   ```bash
   scp -i ~/.ssh/nest-dvvps \
     "commands/zAPStudy Specific/archive.js" \
     root@82.38.134.175:"/var/www/apswiftly/commands/zAPStudy Specific/archive.js"
   ```

2. Restore production ownership and permissions, restart the bot, and verify it:

   ```bash
   ssh -i ~/.ssh/nest-dvvps root@82.38.134.175 \
     "chown deployer:deployer '/var/www/apswiftly/commands/zAPStudy Specific/archive.js' && \
      chmod 644 '/var/www/apswiftly/commands/zAPStudy Specific/archive.js' && \
      node --check '/var/www/apswiftly/commands/zAPStudy Specific/archive.js' && \
      systemctl restart apswiftly && \
      systemctl is-active apswiftly"
   ```

Replace both example paths with the actual local and production paths. Preserve the repository-relative directory structure.

## Deploy a Full Release

Use this method when multiple tracked files changed, dependencies changed, or a complete Git-tracked release is needed.

1. Commit and push the intended changes:

   ```bash
   git add <changed-files>
   git commit -m "Describe the production change"
   git push -u origin <release-branch>
   ```

2. Run the production update script from the Mac without opening an interactive shell:

   ```bash
   ssh -i ~/.ssh/nest-dvvps root@82.38.134.175 \
     "bash /var/www/apswiftly/deploy/update.sh"
   ```

The update script fast-forwards the current branch from its upstream, installs locked production dependencies, and restarts `apswiftly.service`.

Important: the server worktree must not contain uncommitted changes that conflict with the pull. Inspect and preserve unexpected production changes instead of resetting them.

### SQLite cutover (separate, deliberate step)

The runtime no longer reads aoi.db. Production continues on the legacy aoi.db
until the migrated SQLite database is deployed on purpose:

```bash
# On the VPS, with the production aoi.db snapshot as the read-only source:
node migration/migrate-aoi-to-sqlite.js \
  --source /var/www/nest.apstudy.org/instance/apswiftly \
  --dest   /var/www/nest.apstudy.org/instance/apswiftly/apswiftly.sqlite \
  --report /var/www/apswiftly/migration-report.json
```

Then set `SQLITE_PATH=/var/www/nest.apstudy.org/instance/apswiftly/apswiftly.sqlite`
in `/var/www/apswiftly/.env` and restart the service. Do not point the SQLite
runtime at the legacy aoi.db directory.


## Verify Production

Check the service and recent logs after every deployment:

```bash
ssh -i ~/.ssh/nest-dvvps root@82.38.134.175 \
  "systemctl is-active apswiftly && \
   systemctl status apswiftly --no-pager && \
   journalctl -u apswiftly --no-pager -n 50"
```

For a deployed JavaScript file, also run:

```bash
ssh -i ~/.ssh/nest-dvvps root@82.38.134.175 \
  "node --check '/var/www/apswiftly/path/to/file.js'"
```

Finally, test the affected Discord command or workflow in the intended guild. Slash-command definition changes may require running the owner `refreshslash` command or restarting the bot so Discord registrations are refreshed.

## Failure Handling

If the service is not active, inspect logs before making another change:

```bash
ssh -i ~/.ssh/nest-dvvps root@82.38.134.175 \
  "journalctl -u apswiftly --no-pager -n 100"
```

Correct the local source, validate it, redeploy it, and restart the service. Do not use `git reset --hard`, delete the production database, or overwrite production secrets as a recovery shortcut.

## Future Automatic Deployment

APSwiftly does not currently contain a GitHub Actions deployment workflow. The Nest self-hosted runner documented in `VPS_CONTEXT.md` belongs to the separate Nest deployment.

After an APSwiftly-specific runner and workflow are configured, the normal release process should become:

```bash
git add <changed-files>
git commit -m "Describe the production change"
git push -u origin <release-branch>
```

The workflow should run `/var/www/apswiftly/deploy/update.sh` and report whether the service restart succeeded. Until that workflow exists, use one of the explicit deployment procedures above.
