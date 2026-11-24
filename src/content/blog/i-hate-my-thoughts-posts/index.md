---

title: "I hate \"My thoughts on\u00A0...\" posts so here is mine"
description: "On AI, getting good at things, and missing being obsessed with something."
date: 2026-11-25
authors:

- zerotistic

---

I've always hated posts that start with "My thoughts on [something]". I don't know why that annoys me as much as it does. And yet here I am, writing down my thoughts on ~~your mom~~ what I miss about doing things the hard way.

Finding a bug used to mean I might spend an entire day trying to understand some obscure thing before I even knew if there was a bug there. Now I can ask an LLM to look into it, and finding a bug with its help still feels just as good. So why do I miss the part that took all day?

<p class="lost-line" aria-label="I lost my obsession.">
  <span class="lost-keep" aria-hidden="true">I lost my </span
  ><span class="lost-word" data-word="obsession." aria-hidden="true"
    ><span class="lost-letters"
      ><i><span>o</span></i><i><span>b</span></i><i><span>s</span></i
      ><i><span>e</span></i><i><span>s</span></i><i><span>s</span></i
      ><i><span>i</span></i><i><span>o</span></i><i><span>n</span></i
      ><i><span>.</span></i></span
    ></span
  >
</p>

This isn't a post about LLMs ruining cybersecurity. I've always done dev work on the side because I love automating things (though I'm by no means a good developer), so I like that I can now build stuff I wouldn't have known how to build before.

What's weird about getting all that time back is that until maybe a year or two ago I was OBSESSED with getting better at cybersecurity, to the point where I'd wake up and spend 15 hours trying to figure something out. I'd forget to eat and go to sleep later than I should because I wanted to try one more thing,

<div class="one-more-night">
  <svg
    class="night-clock"
    viewBox="0 0 120 120"
    width="120"
    height="120"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    aria-hidden="true"
  >
    <circle cx="60" cy="60" r="52" />
    <path d="M60 14v6M106 60h-6M60 106v-6M14 60h6" stroke-width="1.2" />
    <path
      d="M83 20l-3 5M100 37l-5 3M100 83l-5-3M83 100l-3-5M37 100l3-5M20 83l5-3M20 37l5 3M37 20l3 5"
      stroke-width="0.8"
      opacity="0.6"
    />
    <g class="clock-hour"><path d="M60 60V34" stroke-width="2.4" /></g>
    <g class="clock-minute"><path d="M60 60V22" stroke-width="1.6" /></g>
    <circle cx="60" cy="60" r="2.2" fill="currentColor" stroke="none" />
  </svg>
  <ol
    class="one-more-list"
    aria-label="and then I'd try one more thing, five times, later and later"
  >
    <li><time>11:40</time><span>and then I'd try one more thing,</span></li>
    <li><time>14:15</time><span>and then I'd try one more thing,</span></li>
    <li><time>19:30</time><span>and then I'd try one more thing,</span></li>
    <li><time>00:50</time><span>and then I'd try one more thing,</span></li>
    <li><time>03:10</time><span>and then I'd try one more thing.</span></li>
  </ol>
</div>

I've spent a good chunk of my life debugging shit that, in retrospect, I couldn't care less about. Sometimes you spend the whole afternoon just trying to get a bug to happen a second time.

<figure class="rabbit-hole" aria-label="A dozen terminal windows scattered over each other, each opened to answer a question raised by the last">
  <div class="hole-win" style="--x: 0%; --y: 0%; --w: 46%; --r: -1.5deg">
    <span class="hole-bar"
      ><i></i><i></i><i></i
      ><span class="hole-title">why does it do that</span></span
    ><span class="hole-body"
      ><span>$ ./target weird.bin</span
      ><span>segfault in a function I've never heard of</span></span
    >
  </div>
  <div class="hole-win" style="--x: 42%; --y: 5%; --w: 44%; --r: 1.2deg">
    <span class="hole-bar"
      ><i></i><i></i><i></i
      ><span class="hole-title">why won't it do that again</span></span
    ><span class="hole-body"
      ><span>$ ./target weird.bin</span><span>exit 0</span
      ><span>$ ./target weird.bin</span><span>exit 0</span></span
    >
  </div>
  <div class="hole-win" style="--x: 10%; --y: 21%; --w: 38%; --r: -0.6deg">
    <span class="hole-bar"
      ><i></i><i></i><i></i
      ><span class="hole-title">what even calls this</span></span
    ><span class="hole-body"
      ><span>grep -rn handle_chunk src/</span
      ><span>14 results, all plausible</span></span
    >
  </div>
  <div class="hole-win" style="--x: 50%; --y: 27%; --w: 46%; --r: 1.8deg">
    <span class="hole-bar"
      ><i></i><i></i><i></i
      ><span class="hole-title"
        >why is this struct three different sizes</span
      ></span
    ><span class="hole-body"
      ><span>sizeof(chunk) = 48</span><span>sizeof(chunk) = 56</span></span
    >
  </div>
  <div class="hole-win" style="--x: 22%; --y: 41%; --w: 34%; --r: -2deg">
    <span class="hole-bar"
      ><i></i><i></i><i></i><span class="hole-title">who wrote this</span></span
    ><span class="hole-body"
      ><span>git blame -L 212,240 src/chunk.c</span></span
    >
  </div>
  <div class="hole-win" style="--x: 60%; --y: 47%; --w: 30%; --r: 0.6deg">
    <span class="hole-bar"
      ><i></i><i></i><i></i><span class="hole-title">ok it's me</span></span
    ><span class="hole-body"><span>2021, 3am, "temp fix"</span></span>
  </div>
  <div class="hole-win" style="--x: 2%; --y: 56%; --w: 46%; --r: 1.4deg">
    <span class="hole-bar"
      ><i></i><i></i><i></i
      ><span class="hole-title">what did I want to know again</span></span
    >
  </div>
  <div class="hole-win" style="--x: 44%; --y: 62%; --w: 40%; --r: -1deg">
    <span class="hole-bar"
      ><i></i><i></i><i></i
      ><span class="hole-title">wait it did it again</span></span
    ><span class="hole-body"
      ><span>$ ./target weird.bin</span><span>segfault</span></span
    >
  </div>
  <div class="hole-win" style="--x: 14%; --y: 73%; --w: 42%; --r: -0.4deg">
    <span class="hole-bar"
      ><i></i><i></i><i></i
      ><span class="hole-title">where did I write that down</span></span
    >
  </div>
  <div class="hole-win" style="--x: 58%; --y: 78%; --w: 36%; --r: 2deg">
    <span class="hole-bar"
      ><i></i><i></i><i></i
      ><span class="hole-title">ok one more run</span></span
    ><span class="hole-body"><span>$ ./target weird.bin</span></span>
  </div>
  <div class="hole-win" style="--x: 32%; --y: 88%; --w: 26%; --r: -1.8deg">
    <span class="hole-bar"
      ><i></i><i></i><i></i><span class="hole-title">it's 3am</span></span
    >
  </div>
  <div class="hole-win" style="--x: 66%; --y: 91%; --w: 26%; --r: 0.8deg">
    <span class="hole-bar"><i></i><i></i><i></i></span
    ><span class="hole-body"><span class="hole-cursor"></span></span>
  </div>
  <div class="hole-win hole-out" style="--vx: 2vw; --vy: 16vh; --k: 0.0">
    <span class="hole-bar"
      ><i></i><i></i><i></i
      ><span class="hole-title">ok reading the whole file</span></span
    ><span class="hole-body"><span>src/chunk.c, 4,112 lines</span></span>
  </div>
  <div class="hole-win hole-out" style="--vx: 78vw; --vy: 10vh; --k: 0.05">
    <span class="hole-bar"
      ><i></i><i></i><i></i
      ><span class="hole-title">is this even the same bug</span></span
    ><span class="hole-body"
      ><span>$ ./target weird.bin</span
      ><span>segfault, different address</span></span
    >
  </div>
  <div class="hole-win hole-out" style="--vx: 1vw; --vy: 38vh; --k: 0.12">
    <span class="hole-bar"
      ><i></i><i></i><i></i><span class="hole-title">no really why</span></span
    >
  </div>
  <div class="hole-win hole-out" style="--vx: 83vw; --vy: 42vh; --k: 0.18">
    <span class="hole-bar"
      ><i></i><i></i><i></i
      ><span class="hole-title">why is there a second allocator</span></span
    >
  </div>
  <div class="hole-win hole-out" style="--vx: 76vw; --vy: 27vh; --k: 0.25">
    <span class="hole-bar"
      ><i></i><i></i><i></i
      ><span class="hole-title">is it the compiler</span></span
    ><span class="hole-body"><span>$ gcc -O0 ...</span><span>same</span></span>
  </div>
  <div class="hole-win hole-out" style="--vx: 4vw; --vy: 62vh; --k: 0.3">
    <span class="hole-bar"
      ><i></i><i></i><i></i
      ><span class="hole-title">what was I doing</span></span
    >
  </div>
  <div class="hole-win hole-out" style="--vx: 88vw; --vy: 58vh; --k: 0.36">
    <span class="hole-bar"
      ><i></i><i></i><i></i
      ><span class="hole-title">it is not the compiler</span></span
    >
  </div>
  <div class="hole-win hole-out" style="--vx: 2vw; --vy: 80vh; --k: 0.42">
    <span class="hole-bar"
      ><i></i><i></i><i></i
      ><span class="hole-title">ok what if I just</span></span
    ><span class="hole-body"><span>nope</span></span>
  </div>
  <div class="hole-win hole-out" style="--vx: 93vw; --vy: 74vh; --k: 0.5">
    <span class="hole-bar"
      ><i></i><i></i><i></i><span class="hole-title">lunch?</span></span
    >
  </div>
  <div class="hole-win hole-out" style="--vx: 85vw; --vy: 88vh; --k: 0.56">
    <span class="hole-bar"
      ><i></i><i></i><i></i
      ><span class="hole-title">3 unread messages</span></span
    >
  </div>
</figure>

A lot of what I know about computers is stuff I only looked up because I was stuck on something else.

If I can write 50 words and get an LLM to do in three hours what would've taken me a day or two, I usually do. And I think I would've loved to have that option on some of those days.

<figure class="prompt-trade" aria-label="A short prompt, then the model working on it for three hours">
  <div class="prompt-box">
    <p class="prompt-text">
      <span class="prompt-you">me</span>here's the crash, here's the binary,
      here's what I tried. figure out why it only happens the second time
      around. take your time, I'm going to go eat something.
    </p>
    <ol class="prompt-log" aria-label="What it did while I was gone">
      <li><time>0:00:04</time><span>reading the crash</span></li>
      <li><time>0:01:30</time><span>running it twice</span></li>
      <li>
        <time>0:09:12</time><span>reading code I didn't ask it to read</span>
      </li>
      <li><time>0:48:55</time><span>reading more code</span></li>
      <li><time>1:52:03</time><span>still going</span></li>
      <li><time>2:58:41</time><span>found it</span></li>
    </ol>
    <div class="prompt-foot">
      <span>50 words</span>
      <span class="prompt-timer" data-hours="3">0:00:00</span>
    </div>
  </div>
</figure>

I can ask it how it found the bug, but by then I know where the bug is and half the explanation can go over my head without it being a problem. Three hours earlier I'd have been looking that shit up.

All the little things I picked up mattered to me because I wanted to be the best. I'd see someone do something I couldn't even begin to understand and want to get to the point where I could do it too, and it felt good to come back to something that used to seem impossible and find out I could actually do it now.

When I find a hard bug with an LLM, I can't always tell what I'd do better the next time around. It's made it harder to know what I want to get good at, even when I see someone else do something that impresses me.

I don't know if I'd feel any differently by now without AI. After years of doing cybersecurity pretty much every day, maybe I'd want to spend a bit more time on something else anyway.

Either way, there's something funny about spending years trying to get faster at this stuff and then using the time I've saved to look for something else to spend an unreasonable amount of time on.

I've been watching anime and reading manga since like seventh grade, but what am I gonna do, become the best at watching anime? I've been into shooting sports for the past two years and I like it, but I don't get that feeling there either.

<div class="hobbies" aria-label="Saber reading, and Saber at the range">
<div class="artoria-slot" data-artoria="reading"></div>
<figure class="range-saber">

![Saber wearing hearing protection and holding a lowered rifle at the range](./assets/saber-range.png)

</figure>
</div>

Piano's a little different because there are songs I want to play, and I'd be pretty happy if I could just do that.

<figure class="piano" aria-label="A one octave piano. Each key plays a note.">
  <div class="piano-keys" role="group" aria-label="Piano keys">
    <button type="button" class="key white" data-note="C4" aria-label="C">
      C
    </button>
    <button
      type="button"
      class="key black"
      data-note="C#4"
      aria-label="C sharp"
    ></button>
    <button type="button" class="key white" data-note="D4" aria-label="D">
      D
    </button>
    <button
      type="button"
      class="key black"
      data-note="D#4"
      aria-label="D sharp"
    ></button>
    <button type="button" class="key white" data-note="E4" aria-label="E">
      E
    </button>
    <button type="button" class="key white" data-note="F4" aria-label="F">
      F
    </button>
    <button
      type="button"
      class="key black"
      data-note="F#4"
      aria-label="F sharp"
    ></button>
    <button type="button" class="key white" data-note="G4" aria-label="G">
      G
    </button>
    <button
      type="button"
      class="key black"
      data-note="G#4"
      aria-label="G sharp"
    ></button>
    <button type="button" class="key white" data-note="A4" aria-label="A">
      A
    </button>
    <button
      type="button"
      class="key black"
      data-note="A#4"
      aria-label="A sharp"
    ></button>
    <button type="button" class="key white" data-note="B4" aria-label="B">
      B
    </button>
    <button type="button" class="key white" data-note="C5" aria-label="high C">
      C
    </button>
  </div>
</figure>

Which doesn't stop me from looking up what the best people in that field are doing, how long it took them to get there, how much time I'd need to put into it every day, etc.

<figure class="search-box" aria-label="A search for how long it takes to get good at piano, with the suggestion to learn one song last">
  <div class="search-field">
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg><span class="search-query">how long does it take to</span
    ><span class="search-caret"></span>
  </div>
  <ol class="search-suggest">
    <li>
      <span class="search-prefix">how long does it take to</span>
      <b>get good at piano</b>
    </li>
    <li>
      <span class="search-prefix">how long does it take to</span>
      <b>become a concert pianist</b>
    </li>
    <li>
      <span class="search-prefix">how long does it take to</span>
      <b>learn piano at 25</b>
    </li>
    <li>
      <span class="search-prefix">how long does it take to</span>
      <b>practice 6 hours a day</b>
    </li>
    <li class="search-skipped">
      <span class="search-prefix">how long does it take to</span>
      <b>learn one song</b>
    </li>
  </ol>
</figure>

Like, dude, you've been playing piano for a few months, can you at least learn a fucking song before worrying about how good you'll be in ten years?

<div class="aside-row">

When I got into cybersecurity I had no idea how much there was to learn, and quite frankly I doubt seeing the whole list would've made me want to start.

<figure class="endless-list" aria-label="A list of things to learn that keeps scrolling with no end">
  <div class="endless-track">
    <ul>
      <li>x86 calling conventions</li>
      <li>ELF relocations</li>
      <li>the dynamic linker</li>
      <li>heap allocator internals</li>
      <li>tcache</li>
      <li>ROP chains</li>
      <li>format strings</li>
      <li>ASLR</li>
      <li>stack canaries</li>
      <li>CFI</li>
      <li>use after free</li>
      <li>double free</li>
      <li>race conditions</li>
      <li>signal handling</li>
      <li>syscall ABI</li>
      <li>page tables</li>
      <li>the Linux scheduler</li>
      <li>namespaces</li>
      <li>seccomp</li>
      <li>eBPF</li>
      <li>gdb scripting</li>
      <li>Binary Ninja's API</li>
      <li>symbolic execution</li>
      <li>SMT solvers</li>
      <li>fuzzing harnesses</li>
      <li>coverage instrumentation</li>
      <li>V8 internals</li>
      <li>JIT spraying</li>
      <li>vtables</li>
      <li>the C++ ABI</li>
      <li>Rust unsafe</li>
      <li>the Go runtime</li>
      <li>Python bytecode</li>
      <li>WebAssembly</li>
      <li>TLS 1.3</li>
      <li>DNS</li>
      <li>HTTP/2 framing</li>
      <li>Bluetooth</li>
      <li>USB descriptors</li>
      <li>UEFI</li>
      <li>ARM TrustZone</li>
      <li>JTAG</li>
      <li>firmware unpacking</li>
      <li>Windows kernel drivers</li>
      <li>ETW</li>
      <li>PE loading</li>
      <li>Frida</li>
      <li>QEMU internals</li>
      <li>side channels</li>
      <li>Spectre</li>
      <li>obfuscation</li>
      <li>control flow flattening</li>
      <li>Siri, apparently</li>
      <li>Minecraft servers, apparently</li>
    </ul>
    <ul aria-hidden="true">
      <li>x86 calling conventions</li>
      <li>ELF relocations</li>
      <li>the dynamic linker</li>
      <li>heap allocator internals</li>
      <li>tcache</li>
      <li>ROP chains</li>
      <li>format strings</li>
      <li>ASLR</li>
      <li>stack canaries</li>
      <li>CFI</li>
      <li>use after free</li>
      <li>double free</li>
      <li>race conditions</li>
      <li>signal handling</li>
      <li>syscall ABI</li>
      <li>page tables</li>
      <li>the Linux scheduler</li>
      <li>namespaces</li>
      <li>seccomp</li>
      <li>eBPF</li>
      <li>gdb scripting</li>
      <li>Binary Ninja's API</li>
      <li>symbolic execution</li>
      <li>SMT solvers</li>
      <li>fuzzing harnesses</li>
      <li>coverage instrumentation</li>
      <li>V8 internals</li>
      <li>JIT spraying</li>
      <li>vtables</li>
      <li>the C++ ABI</li>
      <li>Rust unsafe</li>
      <li>the Go runtime</li>
      <li>Python bytecode</li>
      <li>WebAssembly</li>
      <li>TLS 1.3</li>
      <li>DNS</li>
      <li>HTTP/2 framing</li>
      <li>Bluetooth</li>
      <li>USB descriptors</li>
      <li>UEFI</li>
      <li>ARM TrustZone</li>
      <li>JTAG</li>
      <li>firmware unpacking</li>
      <li>Windows kernel drivers</li>
      <li>ETW</li>
      <li>PE loading</li>
      <li>Frida</li>
      <li>QEMU internals</li>
      <li>side channels</li>
      <li>Spectre</li>
      <li>obfuscation</li>
      <li>control flow flattening</li>
      <li>Siri, apparently</li>
      <li>Minecraft servers, apparently</li>
    </ul>
  </div>
</figure>

</div>

Picking something just because AI sucks at it seems like a stupid thing as well when I'm rooting for it to get better as fast as it can.

Besides, I've spent hours on parts of this blog that probably not a single person reading this will ever <span class="unnoticed" data-reveal="you did.">notice</span>. I could've asked an LLM to make it look good enough and been done with it, but I had a pretty specific idea of what I wanted it to look like and I had fun getting there, even though AI wrote most of the code.

Maybe there's room for that in cybersecurity too. There are things I wouldn't even have considered looking into a couple of years ago because of how long it'd take to get anywhere interesting, and now I can afford to give them a look just because I'm curious.

Even if I do get sucked into cybersecurity again, I don't think I'd want to go back to how I was. There's a lot I used to skip because I'd rather have been at my computer, and I'm glad I do more of those things now... even if I miss being that incapable of putting something down.

Maybe I'll spend the next few years being mediocre at a bunch of things I really like doing which honestly sounds fine.

Anyway, I started writing this because I wanted to figure out how I felt about doing cybersecurity with AI and I ended up thinking about how I spend my entire life.

I guess that's why people write these fucking posts.

<div class="artoria-slot artoria-solo" data-artoria="waving"></div>
