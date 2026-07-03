---
name: tf-apply
description: Run terraform apply to apply infrastructure changes. Use after running tf-plan and reviewing the output
allowed-tools: Bash, Read, Grep
#disable-model-inovaction: true
---

Run 'cd terraform && terraform apply' to apply infrastructure changes

Steps:
1. `cd terraform`
2. If no `.terraform/` directory is present yet, run `terraform init` first
3. Run `terraform validate` to catch syntax/config errors before applying.
4. Run `terraform apply`. If the user hasn't specified variable overrides (region, instance_type, key_name, app_port), use the defaults in `variables.tf`.
5. Summarize the apply output concisely: how many resources were added/changed/destroyed, and call out anything that looks like a change to an existing resource or a destroy (these deserve the user's attention before they run `apply`). 