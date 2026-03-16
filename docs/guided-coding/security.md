---
sidebar_position: 4
title: "Security: Be Vigilant"
---

# Security: Be Vigilant

AI agents can easily be attacked. If a malicious instruction slips into the context — through an HTML comment in a markdown file, a compromised MCP server response, a manipulated CLI output, or a poisoned skills file — the agent may execute it. This is social engineering for AI agents, and it's unsafe by design: current architectures can't distinguish between trusted instructions and injected data.

My advice:

- **Review everything.** Look at the raw files, not rendered markdown (HTML comments are invisible in renderers but visible to agents).
- **Disable MCP servers you don't need.** Saves context window space and reduces attack surface.
- **Be aware of supply chain attacks.** There have been cases where hyped tools referenced nonexistent npm packages, and attackers simply created those packages with malicious code.
- **Consider sandboxing.** Running your coding agent in a VM or container limits the blast radius of any malicious actions.
