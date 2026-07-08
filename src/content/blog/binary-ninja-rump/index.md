---
title: "Binary Ninja: How to Reverse with Style"
description: "Slides and annotations from a lightning talk given at an HackTheBox meetup in Paris on why Binary Ninja is a solid choice for reverse engineering."
date: 2024-01-16
authors:
  - zerotistic
tags:
  - binary-ninja
  - reverse-engineering
image: ./assets/slide-1.png
---

I got the occasion to give a small talk at an HackTheBox meetup in Paris on January 16th, 2024. The following are my slides.

The talk is mostly about why Binary Ninja is a viable option and what you could do with it. Sadly it was in Paris and thus in French. You'll find annotations under each slide.

![Binja opening](./assets/slide-1.png)
My objective is not to make you buy Binja at the end of the talk (but you should still do it ;) ) but more so you know it is a solid choice/option.

![Why binja](./assets/slide-2.png)
Price is more than affordable, API is **great**, partially open-source, active Slack and much more.

![API](./assets/slide-3.png)
The API can be used in multiple languages, you can access all of Binja's IL, there is access to SSA/DFA/..., documentation is **great**, workflows (I'll talk about them later).

![Concretely](./assets/slide-4.png)
You could recreate C++ VTables, jump tables, structures, modify the IL or look for patterns.

![VTables](./assets/slide-5.png)
Showcase example of C++ vtables recovery.

![Jump Table](./assets/slide-6.png)
Showcase example of jump table.

![Structure](./assets/slide-7.png)
Showcase example of structure/fields recovery.

![IL modification](./assets/slide-8.png)
You can modify the decompilation analysis to clean up some code.

![Patterns](./assets/slide-9.png)
You can create models to find bugs.

![Notable examples](./assets/slide-10.png)
Some other cool works.

![Closing](./assets/slide-11.png)
Thank you very much for listening.
