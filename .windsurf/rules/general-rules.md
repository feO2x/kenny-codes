---
trigger: always_on
---

- static website built with docusaurus 3.9
- docusaurus blog plugin runs twice: one instance regularly, one instance for events
- many blog plugin components are swizzled to customize the look for events - see ./src/theme