---
title: "Binary Ninja: Zero to Hero 1"
date: 2023-09-25 10:00:00 +0200
categories: [Binary Ninja]
tags: [reverse engineering, exploit, automation, binja]
comments: false
author: zerotistic
img_path: /assets/img/hero-1/
image:
    path: binja-logo.jpg
    alt: Binary Ninja's logo
---

Hi everyone, and welcome to the first post of the serie `Binary Ninja: Zero to Hero`! This post will be an introduction to Binary Ninja and an overview of its different components, more than an tutorial of some kind. It will also be used as a teaser of what I will write about and what competences you'll gain from this serie. So let's get started!

## About Binary Ninja
Binary Ninja - from now on referred to as Binja -  is developped by [Vector35](https://vector35.com/). Binja came to life around 6 years from now (writing this late 2023). It has numerous [Open-Source](https://github.com/Vector35/) components which makes it very adaptable. Binja's adaptability is a key strength, as it allow a diverse range of plugins. This feature empowers users to tailor their analysis workflows according to their requirements. Furthermore, Binja benefits from a thriving open-source community that has actively [contributed numerous plugins](https://github.com/Vector35/community-plugins/).

Regular updates and ongoing development efforts further bolster Binja's reliability. 

## Versions - Commercial / Personal / Enterprise
Binary Ninja comes in three versions: Non-commercial (Personal), Commercial, and Enterprise. The Non-commercial and Commercial versions use individual license files, while the Enterprise version uses a floating license system. This system allows licenses to be checked out from the Enterprise Server by any client for a specified duration.
The disparities between Non-commercial and Commercial licenses are quite limited, encompassing just two distinctions: the ability to utilize them for commercial purposes and access to the headless API.
In contrast, the Enterprise version not only offers these features but also includes Single Sign-On (SSO), Project Management capabilities, Floating licenses, and Access Control features.

You can find more information [here](https://binary.ninja/purchase/).

## Overview
Binja is an extensive and intricate project, resulting in the development of numerous utilities and components. In this section, I'll provide a broad overview of these components, without delving into detailed explanations for each one. In forthcoming posts, I'll delve into specific use cases and provide a more comprehensive understanding of how these components operate and their practical applications.

### Decompiler
Primarily, at the heart of a decompiler's functionality is its ability to do precisely that: decompile code. It's a fundamental expectation, after all. Within Binja, users can traverse binary code interactively, accessing disassembled code while making annotations as required. Binja provides multiple views, including disassembly, LILL, MLIL, HLIL, Pseudo-C, and SSA views. In forthcoming posts, I'll delve deeper into these views, and you'll come to appreciate their practical utility. At this stage, it's not essential to delve into the specifics of what each view offers. Typically, when starting, most users tend to primarily utilize disassembly and Pseudo-C views. These two perspectives provide a solid foundation for initial exploration and analysis.
![Exemple of the decompiler's view](decomp.png)
_Exemple of the decompiler's view_

### Multi-architecture support
Another one of Binja's notable strengths lies in its extensive support for multiple architectures. It provides compatibility with a broad spectrum of architectures, including well-established ones like x86, ARM, MIPS, PowerPC, and many others. What's particularly noteworthy is that Binja goes beyond this list. In subsequent posts, I'll delve deeper into this aspect, but it's worth mentioning that it offers the capability to introduce support for new architectures through workflows and plugins. This feature proves exceptionally valuable for individuals engaged in tasks involving less common or emerging instruction sets, as well as those tackling Capture The Flag (CTF) challenges. A few exemples include [Motorola 68k](https://github.com/galenbwill/binaryninja-m68k), [msp430](https://github.com/joshwatson/binaryninja-msp430), [Renesas M16C](https://github.com/whitequark/binja-m16c) or [Renesas V850](https://github.com/tizmd/binja-v850).

### Control Flow Graph
In the process of analyzing a function, understanding its flow is often crucial. Flow pertains to how the binary executes, depending on whether specific conditions are met or not. Binja offers a graphical representation of this control flow, which greatly facilitates tracking the execution path. This view serves multiple purposes, and a noteworthy example is the [Lighthouse](https://github.com/gaasedelen/lighthouse) plugin. Lighthouse is particularly valuable as it allows users to visualize the code coverage of a fuzzer on a binary.
![Exemple of the CFG's view](graph.png)
_Exemple of the Control Flow Graph's view_

### Debugging
As one might expect, static analysis isn't always straightforward, and there are instances where you may require a debugger. Binary Ninja offers an integrated debugger, which is based on lldb and possesses significant capabilities. In fact, it recently received a substantial update with the implementation of Time-Travel Debugging (TTD), as detailed in the [3.5: Expanded Universe](https://binary.ninja/2023/09/15/3.5-expanded-universe.html#ttd-debugging) release notes. This debugger empowers users to perform a wide range of debugging tasks, essentially covering all the fundamental functions of a debugger and more, all from within the Binary Ninja environment.

### Plugins / Scripting
One of the notable strengths of Binja lies in its API, which is [well-documented](https://api.binary.ninja/) and accessible to users regardless of their license type. However, it's crucial to highlight a key distinction: while the personal license does not permit headless API usage, the commercial license does.

The API offers a wide range of capabilities, enabling users to perform tasks such as creating loaders, implementing support for various new architectures, aiding in pattern recognition, facilitating renaming and highlighting, and essentially accommodating any creative application one can conceive. There have been instances where the API has been employed to effectively to [remove control flow flattening](https://www.lodsb.com/removing-control-flow-flattening-with-binary-ninja) from binaries. 

In the future, I will be sharing numerous posts that delve into the API's utility, particularly regarding its use in uncovering bugs, and assisting in reverse engineering and pattern detection.

### Bonus
- Binja supports custom UI themes, allowing anyone to customize their working environment. 
- Binja supports the use of the [BinSync](https://github.com/binsync/binsync) plugin, a collaborative reversing tool built on the Git versioning system. This plugin allows for fine-grained reverse engineering collaboration across different decompilers.
- [Binary Ninja Cloud](https://cloud.binary.ninja/) is available for free, although there are some functional limitations (API, plugins, etc. are not available).

## Basic usage
In this section, I will showcase all of the major and basic utilities at your disposition, as well as give you their shortcut and tips if I have any. This can be from swiftly moving from one function to another to simply renaming a variable.

First and foremost, when it comes to reverse engineering, one of your initial tasks is renaming a variable, function, or structure. This process is relatively straightforward: simply right-click and choose "Rename Symbol," or you can use the shortcut Ctrl+N, which will prompt you to enter the new name. You can do the same for the types, by selecting "Change Type" or using `Ctrl+Y`. 

<iframe frameborder="0" class="juxtapose" width="100%" height="736" src="https://cdn.knightlab.com/libs/juxtapose/latest/embed/index.html?uid=6906d860-5b93-11ee-b5be-6595d9b17862"></iframe>
_Function view before and after being renamed_

Much improved, wouldn't you agree? You might also observe that I've included a comment describing a variable as a "canary." To add such a comment, simply select one or multiple lines, then right-click and choose "Enter Comment," or utilize the ; notation.

By the way, while I'm here, allow me to introduce you to the [0CD](https://github.com/0xb0bb/0CD) plugin. As stated in the readme, it's "a compilation of small quality-of-life enhancements frequently encountered in CTFs or similar toy problems." As far as my knowledge goes, it currently focuses on renaming canaries and retyping, and it's compatible only with Linux. In an upcoming blog post, I plan to enhance its compatibility to encompass Windows and other architectures. For now, I encourage you to install it as part of our next step: the installation of plugins.

Quickly before though, let me show you how much nicer 0CD makes the canaries:
<iframe frameborder="0" class="juxtapose" width="100%" height="437.00000000000006" src="https://cdn.knightlab.com/libs/juxtapose/latest/embed/index.html?uid=6765b9da-5ba8-11ee-b5be-6595d9b17862"></iframe>
_Canaries before and after using 0CD_

Now, let's discuss how to install plugins. In this step, we'll install 0CD so that you can utilize it throughout this blog series. You have two options: you can either select "Plugins" -> "Manage plugins" or use the shortcut Ctrl+Maj+M. Regardless of your choice, after installation, you'll need to restart Binary Ninja. You can do this by either closing the application and reopening it or using the Ctrl+P shortcut, typing "Restart," and selecting it. The benefit of the second option is that it will restore all your previous work. Voilà! You installed your first Binja plugin.

Now that you've learned how to rename, retype, install plugins, and use shortcuts effectively, let's talk about another important feature: navigating between functions. Since you won't be concentrating solely on one function, you need the ability to move between functions seamlessly.

Binary Ninja offers a convenient way to do this. You can simply scroll up or down, and the view will transition to new functions as you scroll. However, if the function you're looking for is quite far away, you have two options:
- Using the "Symbols" Section: Navigate to the "Symbols" section, where you can either scroll through the list or use the search function to find the specific function you want to jump to.
- Using the `g`` Shortcut: Press the `g`` key, and a prompt will appear. Here, you can enter the name or address of the function you wish to navigate to. This method allows for quick and precise navigation to a specific function, regardless of its location within the binary.

At this stage, you should be comfortable with basic reversing and navigating through functions. However, you may find it beneficial to explore other views, such as the Graph view. Switching between views is straightforward. You can either select the dropdown list (usually located under the "Linear" label) and choose "Graph," or simply press Enter to toggle between views.
<iframe frameborder="0" class="juxtapose" width="100%" height="643" src="https://cdn.knightlab.com/libs/juxtapose/latest/embed/index.html?uid=d649351a-5ba9-11ee-b5be-6595d9b17862"></iframe>
_Exemple of graph view_

With these fundamentals under your belt, you're well-equipped to dive into reverse engineering and pwn challenges using Binary Ninja! In your next post, you can explore additional plugins, delve into different views like IL views and SSA, and unlock the full potential of Binary Ninja with tools like the stack view, tags, and the memory map. Happy reversing and pwning!

See you soon!
