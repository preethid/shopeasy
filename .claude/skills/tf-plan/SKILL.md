---
name: tf-plan
description: Run terraform plan and analyse the output. Use before applying any infrastructure changes.
allowed-tools: Bash, Read, Grep
#disable-model-invocation: true
---

Run 'cd terraform && terraform plan' and anaylse the output

Steps:

1. `cd terraform`
2. If no `.terraform/` directory is present yet, run `terraform init` first.
3. Run `terraform validate` to catch syntax/config errors before planning.
4. Run `terraform plan`. If the user hasn't specified variable overrides (region, instance_type,
   key_name, app_port), use the defaults in `variables.tf`.
5. Summarize the plan output concisely: how many resources will be added/changed/destroyed, and
   call out anything that looks like a change to an existing resource or a destroy (these deserve
   the user's attention before they run `apply`).

If `terraform plan` fails (e.g. missing AWS credentials, invalid key pair name), report the exact
error rather than guessing a fix — credentials and AWS account state aren't something to infer.
