---
sidebar_position: 3
title: Guiding Phase
---

# 3. Guiding Phase (1–6 hours)

This is the most important and time-consuming phase. You review all the generated code:

- **Read the code yourself.** You are responsible for the code the LLM produces. You need to understand it.
- **Also let another agent review.** I open a new chat session and have a different agent review the code independently.
- **Learn what you don't know.** If the agent wrote something you don't understand, learn that concept before judging it. Ask the model to explain it.
- **Decide on the appropriate response:**
  - If everything looks good → success, create a PR.
  - If there's a small issue → iterate back to the implementation phase with a targeted prompt.
  - If there's a large issue (wrong data structures, framework mechanisms misused, design flaws) → go back and create a new plan.
- **Write a plan deviations document** at the end, especially if you made significant changes. Have the agent compare the original plan to the final implementation and note all differences. This serves as an architectural decision record.

Large issues in the guiding phase usually mean your plan was too big to begin with. This happened to me with a cloud events serialization feature — I tried to implement reading and writing in one plan. The result had too little code reuse and poor performance optimizations, so I went back and created three smaller, focused plans instead.
