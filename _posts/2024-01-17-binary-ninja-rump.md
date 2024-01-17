---
title: "Binary Ninja: how to reverse with style"
date: 2024-01-17 10:00:00 +0200
categories: [Binary Ninja]
tags: [reverse engineering, binja]
comments: false
author: zerotistic
img_path: /assets/img/rump-htb-meetup/
image:
    path: binja-logo.jpg
    alt: Binary Ninja's logo
---

Hi! I got the occasion to make a small talk at an HackTheBox meetup in Paris the 16th january 2024. The following are my slides.

The talk is mostly about why Binary Ninja is a viable option and what you could do with it. Sadly, it was in Paris and thus in french. You will find annotations under them.

![Binja opening](slide-1.png)
My objective is not to make you buy binja at the end of the talk (but you should still do it ;) ) but more so you know it is a solid choice/option.

![Why binja](slide-2.png)
Price is more than afforadable, API is **great**, partially Open-Source, active Slack and much more

![API](slide-3.png)
The API can be used in multiple langages, you can access all of binja's IL, there is access to SSA/DFA/..., documentation is **great**, worflow (talk about them later)

![Concretely](slide-4.png)
You could recreate C++ VTables, Jump Tables, Structures, modify the IL or look for patterns

![VTables](slide-5.png)
Show case example of C++ vtables recovery

![Jump Table](slide-6.png)
Show case example of jump table

![Structure](slide-7.png)
Show case example of structure/fields recovery

![IL modification](slide-8.png)
You can modify the decompilation analysis to clean up some code

![Patterns](slide-9.png)
You can create models to find bugs

![Notable examples](slide-10.png)
Some other cool works

![Closing](slide-11.png)
Tqvm for listening