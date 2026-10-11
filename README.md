# RelayDesk — WhatsApp Agent Workflow Concept

An interactive, browser-based **concept demo** for B2B prospect qualification and service-provider onboarding.

## Try it

Open `index.html` in a browser or visit the deployed GitHub Pages URL.

- Switch between **Sales enquiry** and **Partner onboarding**.
- Run a sample enquiry or enter your own test messages.
- Review the extracted lead data and the simulated activity trail.
- Use **Human takeover** to pause automation and see how handoff behaves.
- Export a sample lead JSON payload for evaluating later CRM integration.

## Scope and limitations

This repository contains a **front-end demonstration with rule-based responses**. It is **not** connected to WhatsApp, Meta, GoHighLevel, a live LLM, or a backend service. It does not send messages or lead data to a remote system. No API keys or credentials are required.

A production implementation would require official WhatsApp Business Platform access, a secure backend, an AI orchestration layer, GoHighLevel CRM integration, state tracking, authentication, human-handoff controls, monitoring, and agreed data-handling safeguards.

## GitHub Pages deployment

1. Create a **public** GitHub repository for this project.
2. Upload `index.html` and `README.md` to the repository's default branch.
3. Go to **Settings → Pages → Build and deployment**, select **Deploy from a branch**, choose the `main` branch and `/ (root)`, then **Save**.
4. Wait for GitHub to display the published Pages link, and test it from your phone before sharing with a prospect.

Use only dummy/test data when demonstrating this UI.