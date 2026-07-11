---
title: "When Linux and Your Decompiler Load Different Programs"
description: "A set of ELF probes where Linux and static tools reconstruct different runtime state, including one relocation-shadowing file that produces the same false imported-call identification in seven decompilers."
date: 2026-07-11
authors:
  - zerotistic
tags:
  - reverse-engineering
  - obfuscation
  - linux
facts:
  category: "reverse engineering"
  target: "Linux ELF loader / glibc ld.so"
  tools:
    - Binary Ninja
    - Ghidra
    - angr
    - gdb
---

Binary Ninja says this program calls `read`:

```c
void _start() __noreturn
{
    read(1, "Hello attacker!\n", 0x10);
    syscall(sys_exit, 0);
}
```

`objdump` shows a call to `read@plt`. `readelf` finds a relocation for `read@GLIBC_2.2.5`. Ghidra and Hex-Rays both decompile the call as `read()` too.

The executable does something else:

```console
$ ./hello-attacker
Hello attacker!
```

Nothing here is self-modifying. There's no custom loader, no late patch. The instruction calls the same PLT stub it always did. At runtime, that call writes sixteen bytes to standard output.

Every static tool here is behaving reasonably. The call instruction, the PLT stub, the on-disk relocation, all exactly what they claim to be. Nothing rewrites anything after the process starts. The process still calls `write`. Something in this file gets read one way by one component and another way by a different one. The question is which.

## Building a convincing false program

That question turned into a project: construct an ELF whose decompilation is complete, internally consistent, and wrong. Not a parser crash, not a corrupted section a tool refuses to touch. A file that produces confident, plausible, agreeing output across several different decompiler backends, none of which matches what the process actually does.

Three attempts got there, each correcting an assumption the previous one still relied on:

- **Attempt one** hides code in the slack space of a mapped page. It works, but the visible jump points at memory the file appears not to contain, which is itself a tell.
- **Attempt two** replaces an entire page using a segment that declares almost nothing. It produces a fully convincing decoy program, but it still needs two `PT_LOAD` entries whose page-rounded ranges collide, a property recoverable by anyone who checks for it, even once the declared sizes and addresses stop looking suspicious on their own.
- **Attempt three** leaves every instruction untouched and shadows a single relocation instead. This is the file at the top of this post: an ordinary-looking call graph with false semantics, and the first attempt where the code, the PLT, and the conventional relocation view all agree with each other and are all wrong.

The rest of this post builds those files in order.

## What normally happens when Linux loads an ELF?

A `PT_LOAD` program header tells Linux where a range begins in the file, where it belongs in memory, and how large it is:

| Field | Meaning |
| --- | --- |
| `p_offset` | first byte in the file |
| `p_vaddr` | address where that byte should appear |
| `p_filesz` | number of bytes supplied by the file |
| `p_memsz` | total declared memory size, including any zero-filled suffix |

:::note[Section vs. segment]
Sections (`.text`, `.rela.plt`, `.dynamic`) organize and describe file contents for linkers and analysis tools. `readelf` and decompiler importers read both: they typically use segments to build the initial memory image, then use sections, symbols, relocations, and entry points to guide analysis. Segments (`PT_LOAD`, `PT_DYNAMIC`, `PT_GNU_RELRO`, described by the program headers) describe the runtime image to the kernel and dynamic linker. Linux does not need the section-header table to execute an ELF file at all, and a binary can drop it entirely and still run. `.rela.plt` and `.dynamic` matter at runtime because their addresses are reachable through dynamic metadata and mapped segments, not because they happen to have section names. Every discrepancy in this post lives in that segment view, the one Linux and `ld.so` actually consult to build and consume the process image.
:::

For an ordinary executable, a static analyzer reconstructs those ranges, Linux maps them, and `ld.so` reads program metadata from the resulting memory. The three interpretations coincide:

```text
Static view
declared ELF ranges reconstructed from the file
        │
        ▼
Kernel mapping view
file pages mapped for each PT_LOAD, in header order
        │
        ▼
Dynamic-linker view
relocations and policy read by ld.so from that memory
```

The distinction usually does not matter because every stage observes equivalent bytes. The rest of this article is about files constructed so that it does matter: files where a segment-level reconstruction of the ELF and the page-granular mapping Linux actually builds from it no longer agree. Every attempt below is a different way of forcing that disagreement on purpose, either by letting undeclared bytes ride into a rounded mapping, or by using a later mapping to replace bytes an earlier one supplied, so that only the replacement is ever executed or read.

Two small algorithms are the entire disagreement. A conventional, segment-precise reconstruction, the one most static tools approximate:

```text
for each PT_LOAD:
    copy p_filesz bytes from file[p_offset .. p_offset + p_filesz)
                        to memory[p_vaddr .. p_vaddr + p_filesz)
    zero-fill memory[p_vaddr + p_filesz .. p_vaddr + p_memsz)
```

The file-backed mapping calculation relevant to these probes is approximately what `elf_map()` runs, in program header order (it omits `p_memsz` zero-fill, anonymous BSS pages, and the rest of the loader's branches, none of which the probes below depend on):

```text
for each PT_LOAD, in program header order:
    off  = page_floor(p_offset - page_offset(p_vaddr))
    addr = page_floor(p_vaddr)
    size = page_ceil(p_filesz + page_offset(p_vaddr))
    map file[off .. off + size) at addr, replacing any earlier mapping there
```

They agree everywhere an ordinary toolchain's output already agrees byte-for-byte with its own page rounding. They can disagree when a segment's page-rounded range overlaps another's, or reaches past its own declared bytes, and a rounded segment almost always reaches beyond its exact declared end by a few bytes. That only becomes meaningful once the additional bytes, permissions, or provenance actually differ and get consumed by something. Every attempt below is a file built to force that on purpose.

## Attempt one: hide code in page slack

A first assumption is that `p_filesz` bounded the file-backed executable bytes. That is a reasonable description of the ELF segment, but not of the mapping Linux creates.

Linux maps memory in pages. In [`elf_map()`](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/fs/binfmt_elf.c?id=dd3210c47e8d3ac6b4e9141fc68acc03b38c0ba3#n367), it moves the address and file offset down to a page boundary, includes the segment's within-page displacement, and rounds the length upward:

```c
size = eppnt->p_filesz + ELF_PAGEOFFSET(eppnt->p_vaddr);
off = eppnt->p_offset - ELF_PAGEOFFSET(eppnt->p_vaddr);
addr = ELF_PAGESTART(addr);
size = ELF_PAGEALIGN(size);
```

The first probe declares one five-byte executable segment at file offset `0x1000` and virtual address `0x401000`. Its only declared instruction is a jump to `0x401180`:

![Diagram showing a five-byte declared segment inside a complete 4 KiB page, with the undeclared remainder mapped read-execute](./assets/page-view-divergence.svg)
*The declared segment and the page Linux maps around it are not the same object.*

The target is outside both `p_filesz` and `p_memsz`, but it lies inside the same file page. Linux maps that complete page executable. The undeclared bytes at `0x401180` issue `write` and print the message.

The real headers and bytes verify the construction:

```console
$ readelf -lW hello-attacker
  Type  Offset   VirtAddr           FileSiz MemSiz  Flg Align
  LOAD  0x001000 0x0000000000401000 0x00005 0x00005 R E 0x1000

$ xxd -g1 -l5 -s0x1000 hello-attacker
00001000: e9 7b 01 00 00                                   .{...

$ xxd -g1 -l48 -s0x1180 hello-attacker
00001180: b8 01 00 00 00 bf 01 00 00 00 48 8d 35 10 00 00  ..........H.5...
00001190: 00 ba 10 00 00 00 0f 05 b8 3c 00 00 00 31 ff 0f  .........<...1..
000011a0: 05 48 65 6c 6c 6f 20 61 74 74 61 63 6b 65 72 21  .Hello attacker!
```

I also replaced the target with a pause loop so the mapping could be inspected before exit. The program header remained unchanged:

```console
$ grep hello-attacker-pause /proc/$pid/maps
00401000-00402000 r-xp 00001000 ... /tmp/hello-attacker-pause

$ gdb -q -batch -p $pid -ex 'x/9bx 0x401180'
0x401180: 0xb8 0x22 0x00 0x00 0x00 0x0f 0x05 0xeb 0xf7
```

This is the first correction to the ordinary model: `p_filesz` describes the segment, while page geometry determines which adjacent file bytes enter the process.

The same three tools that later agree on a coherent, wrong answer for attempt three reject this exact file outright, real and unedited: Binary Ninja returns nothing, Hex-Rays finds zero decompilable functions, Ghidra follows the jump into the undeclared bytes and halts on bad instruction data. The minimal witness gives auto-analysis almost none of the conventional structure it normally relies on: no `main`, no dynamic section, just five declared bytes.

To test whether the page discrepancy itself, rather than the probe's minimalism, was what defeated analysis, I rebuilt the same mechanism inside an ordinary compiled binary. A real `main()`, `is_root()`, and two `announce_*()` functions, dynamically linked against libc exactly the way `gcc` produces by default, with one call inside `main` patched after linking to jump past the executable segment's declared size into page-tail slack that was already sitting there unused:

```c title="Binary Ninja 5.3.9757 — pseudo-C (boilerplate elided)"
uint64_t is_root(char* arg1)
{
    int32_t rax_1;
    rax_1 = !strcmp(arg1, "root");
    return rax_1;
}

ssize_t announce_root()
{
    return write(1, "Hello root!\n", 0xc);
}

ssize_t announce_analyst()
{
    return write(1, "Hello analyst!\n", 0xf);
}

int32_t main(int32_t argc, char** argv, char** envp)
{
    char* rax_1;

    if (argc <= 1)
        rax_1 = "analyst";
    else
        rax_1 = argv[1];

    if (!is_root(rax_1))
        announce_analyst();
    else
        0x401220();

    return 0;
}
```

Hex-Rays and Ghidra reconstruct the exact same functions from the exact same file. Neither can name what the redirected call in `main` actually reaches, either: Hex-Rays renders it as `MEMORY[0x401220]()`, Ghidra as `func_0x00401220()`, matching Binary Ninja's bare `0x401220()` above. That address falls outside every segment each tool parsed from the file, so there's no symbol for it, just one anonymous call sitting inside an otherwise ordinary decompilation, in all three backends.

```console
$ ./greet-attacker
Hello analyst!

$ ./greet-attacker root
Hello attacker!
```

As obfuscation, it's still weak. An anonymous call target is pretty obvious, an analyst who notices it knows exactly where to single-step. The next attempt fixes that.

## Attempt two: replace a whole page with a five-byte declaration

The obvious jump suggested a second question. Could static analysis receive a complete, plausible program while Linux ran different instructions at the same addresses?

Linux processes `PT_LOAD` entries in program-header order. Once it establishes the load address, later segments are mapped with `MAP_FIXED` in [`load_elf_binary()`](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/fs/binfmt_elf.c?id=dd3210c47e8d3ac6b4e9141fc68acc03b38c0ba3#n1064):

```c
if (!first_pt_load) {
    elf_flags |= MAP_FIXED;
} else if (elf_ex->e_type == ET_EXEC) {
    /* ... */
    elf_flags |= MAP_FIXED_NOREPLACE;
} else if (elf_ex->e_type == ET_DYN) {
    /* ... */
```

Only the first `PT_LOAD` gets `MAP_FIXED_NOREPLACE`, which fails if the range is already mapped. Every later one gets plain `MAP_FIXED`, which does not merge byte ranges, it just replaces whatever was already there.

The second probe uses two load segments. The first declares a normal entry point at `0x401000` which prints `Hello analyst!`. The second appears to place only five harmless bytes at `0x401180`:

```console
$ readelf -lW hello-attacker
  Type  Offset   VirtAddr           FileSiz MemSiz  Flg Align
  LOAD  0x001000 0x0000000000401000 0x00030 0x00030 R E 0x1000
  LOAD  0x002180 0x0000000000401180 0x00005 0x00005 R E 0x1000
```

A segment-level reconstruction leaves the first entry point untouched. Linux instead performs this calculation for the later segment:

```text
within-page offset = 0x401180 & 0xfff       = 0x180
file mapping offset = 0x2180 - 0x180        = 0x2000
mapping address     = floor(0x401180, 4096) = 0x401000
mapping size        = ceil(5 + 0x180, 4096) = 0x1000
```

The declaration of five bytes selects a complete replacement page. Its undeclared prefix begins at file offset `0x2000` and contains a second entry point which prints `Hello attacker!`:

![Diagram showing PT_LOAD #2's five-byte declaration selecting a full-page replacement, swapping the analyst program for the attacker program at the same address](./assets/page-shadowing.svg)
*A five-byte declaration is enough to choose which entire page survives at that address.*

The paired file dumps show both programs:

```console
$ xxd -g1 -l48 -s0x1000 hello-attacker
00001000: b8 01 00 00 00 bf 01 00 00 00 48 8d 35 10 00 00  ..........H.5...
00001010: 00 ba 0f 00 00 00 0f 05 b8 3c 00 00 00 31 ff 0f  .........<...1..
00001020: 05 48 65 6c 6c 6f 20 61 6e 61 6c 79 73 74 21 0a  .Hello analyst!.

$ xxd -g1 -l48 -s0x2000 hello-attacker
00002000: b8 01 00 00 00 bf 01 00 00 00 48 8d 35 10 00 00  ..........H.5...
00002010: 00 ba 10 00 00 00 0f 05 b8 3c 00 00 00 31 ff 0f  .........<...1..
00002020: 05 48 65 6c 6c 6f 20 61 74 74 61 63 6b 65 72 21  .Hello attacker!

$ ./hello-attacker
Hello attacker!
```

Binary Ninja, Hex-Rays, and Ghidra reject this exact hand-built file outright too, and it shares the same missing structure as attempt one: no `main`, no dynamic section, just a five-byte declared segment. None of the twelve tested backends recovers the runtime body either way (see Appendix D).

Rebuilt on an ordinary compiled binary, the same page-replacement trick disappears completely into an unremarkable decompilation. Two copies of the same small program, `tool` and `tool_attacker`, compiled identically so their code and rodata pages land at identical addresses and identical sizes, differing only in which string and comparison target each uses. `tool_attacker`'s code page and rodata page are appended to `tool`'s file, then two new `PT_LOAD` entries are added after linking, one per page. Neither declares a suspicious five bytes at an exact page boundary: each declares a moderate, plausible-looking size at a virtual address that falls inside the target page without matching it exactly (`0x401160` and `0x402090`, against target pages at `0x401000` and `0x402000`), with the file offset's low bits kept equal to the vaddr's low bits so `elf_map()`'s rounding still lands on the appended attacker pages and still replaces the full page. Every other program header, including the ones that legitimately share an address in any real binary (`NOTE`/`GNU_PROPERTY`, `GNU_RELRO` against the data segment), is untouched. The result is that no two `LOAD` entries share a raw declared `VirtAddr` at all, `readelf -lW | awk '$1=="LOAD"{print $3}' | sort | uniq -d` finds nothing, the collision only exists once you actually compute each entry's page-rounded range:

```c title="Binary Ninja 5.3.9757 — pseudo-C (boilerplate elided)"
uint64_t is_root(char* arg1)
{
    int32_t rax_1;
    rax_1 = !strcmp(arg1, "root");
    return rax_1;
}

ssize_t announce_root()
{
    return write(1, "Hello root!\n", 0xc);
}

ssize_t announce_analyst()
{
    return write(1, "Hello analyst!\n", 0xf);
}

int32_t main(int32_t argc, char** argv, char** envp)
{
    char* rax_1;

    if (argc <= 1)
        rax_1 = "analyst";
    else
        rax_1 = argv[1];

    if (!is_root(rax_1))
        announce_analyst();
    else
        announce_root();

    return 0;
}
```

Hex-Rays and Ghidra decompile the same file identically: `main`, `is_root`, `announce_root`, and `announce_analyst`, dispatching between them exactly as declared, matching the Binary Ninja output above field for field. Nothing is unresolved or rejected in any of the three. `./tool-shadowed` and `./tool-shadowed root` both print `Hello attacker!` regardless of the argument, because the entire code page and the entire rodata page get replaced at load time, with no hint of that in the decompilation:

```console
$ ./tool-shadowed
Hello attacker!

$ ./tool-shadowed root
Hello attacker!
```

This is the second reversal. The later segment does not add five bytes to the earlier mapping. Its five-byte declaration chooses which entire page survives.

This attempt still has a visible flaw. The minimal witness's two `LOAD` entries collide at page-rounded addresses that are easy to spot even without doing the rounding math (`0x401180` next to a `0x401000` page, five declared bytes). The realistic carrier closes most of that gap: no two declared `VirtAddr` values match, sizes look plausible, and the legitimate overlaps every real binary already has are left alone. What survives is that two `PT_LOAD` entries still round to the same page, which is unusual for any ordinary toolchain to produce and is recoverable by anyone who checks for it, just not by anyone glancing at the raw addresses. Attempt three removes that flaw from the code and relocation view entirely, by not needing a second `PT_LOAD` at all.

## Attempt three: leave the code alone and shadow a relocation

Replacing instructions creates two programs, but it also leaves a clue: overlapping load segments. The next realization was that the replaced page did not have to contain instructions at all. If it contained linker metadata instead, visible control flow could remain completely ordinary while the dynamic linker changed what that flow meant.

:::note[How a PLT/GOT call normally works]
A call through `read@plt` does not encode the address of `read` directly. It jumps into a small PLT stub, which loads a pointer from a fixed slot in the Global Offset Table (GOT) and jumps there. On first use (or at startup, if binding is eager), `ld.so` looks up a relocation entry for that GOT slot, resolves the named dynamic symbol against the loaded libraries, and writes the resolved address into the slot. Every later call through that stub follows whatever address currently sits in the GOT. The call site itself never needs to change.
:::

For the opening executable, the call site and GOT slot never change. Only the relocation that fills that slot does: the on-disk copy names dynamic symbol 2, `read`; the copy in the shadow page names dynamic symbol 1, `write`. Static tools parse `.rela.plt` from its conventional file offset and see symbol 2. Linux maps a shadow page over that address, and `ld.so` reads the relocation from the final memory image and sees symbol 1. So it installs `write` in the slot reached through the visible `read@plt` stub.

![Annotated diagram of two Elf64_Rela entries at the same GOT offset, one naming symbol 2 (read) on disk and the other naming symbol 1 (write) in the mapped copy](./assets/shadow-relocation.svg)
*Same offset, same relocation type, same call site. Only the symbol index differs between what's on disk and what ld.so actually reads.*

:::note[Encoding an Elf64_Rela entry]
Each entry is 24 bytes: an 8-byte `r_offset` (the GOT slot to patch), an 8-byte `r_info` (low 32 bits: relocation type; high 32 bits: symbol table index), and an 8-byte `r_addend`. `R_X86_64_JUMP_SLOT` is type 7. Reading `r_info` as a little-endian `uint64`, symbol index 2 and type 7 pack to `0x0000000200000007`; symbol index 1 and type 7 pack to `0x0000000100000007`. That four-byte difference in the high half of one field is the entire attack.
:::

Only after that semantic explanation do the raw records become useful:

```console
$ xxd -g8 -l24 -s0x340 hello-attacker
00000340: f83f000000000000 0700000002000000  .?..............
00000350: 0000000000000000                   ........

$ xxd -g8 -l24 -s0x4340 hello-attacker
00004340: f83f000000000000 0700000001000000  .?..............
00004350: 0000000000000000                   ........
```

Both records target `0x3ff8` and use relocation type 7, `R_X86_64_JUMP_SLOT`. The only semantic change is symbol index 2 to 1. The ordinary static evidence remains mutually consistent:

```console
$ objdump -d hello-attacker
  1030: bf 01 00 00 00        mov    $0x1,%edi
  1035: 48 8d 35 c4 0f 00 00  lea    0xfc4(%rip),%rsi
  103c: ba 10 00 00 00        mov    $0x10,%edx
  1041: e8 da ff ff ff        call   1020 <read@plt>

$ readelf -rW hello-attacker
Offset             Info             Type                Symbol
0000000000003ff8   0000000200000007 R_X86_64_JUMP_SLOT  read@GLIBC_2.2.5
```

:::note[Does this depend on lazy binding?]
No, but the demonstrated binary does link with `-z now` (`readelf -d` confirms `BIND_NOW`), so the shown relocation is resolved *eagerly*: `ld.so` walks `.rela.plt` and resolves every JUMP_SLOT during startup, before the entry point runs, which is exactly the moment the shadow page needs to already be in place. The mechanism does not require `BIND_NOW` specifically. Under the default lazy-binding path, the first call through the PLT stub triggers `_dl_runtime_resolve` instead, which reads the same relocation entry and would consume the shadow page just as eagerly resolution does. What changes between the two is only *when* the mapped relocation gets read, not whether the shadow page is visible to `ld.so` when it does.
:::

This resolves the opening contradiction: the code has not been hidden, it has been explained correctly under the wrong relocation state.

That distinction matters more than a missed function. A call graph can name the wrong external operation, dependency analysis can omit the library that supplies runtime code, and constructor analysis can miss execution before `main`. Seven of the twelve tested decompilers (see the appendix) produced a coherent call to `read` for this file, agreeing with each other and with the on-disk relocation. Their agreement is exactly what makes the false result persuasive.

These are three of those seven, unedited except for eliding boilerplate headers and helper stubs, straight from the actual Dogbolt run. Pick one:

<div class="dp-widget">
<div class="dp-tabs">
<button type="button" class="dp-tab" data-group="attempt3" data-panel="binja" aria-pressed="true">Binary Ninja 5.3.9757</button>
<button type="button" class="dp-tab" data-group="attempt3" data-panel="hexrays" aria-pressed="false">Hex-Rays 9.3.0.260327</button>
<button type="button" class="dp-tab" data-group="attempt3" data-panel="ghidra" aria-pressed="false">Ghidra 12.1.2</button>
</div>
</div>

<div class="dp-panel" data-group="attempt3" data-panel="binja">

```c title="Binary Ninja 5.3.9757 — pseudo-C"
int64_t sub_401000()
{
    int64_t var_8 = 0;
    /* jump -> nullptr */
}

ssize_t write(int32_t fd, void const* buf, uint64_t nbytes)
{
    /* tailcall */
    return write(fd, buf, nbytes);
}

ssize_t read(int32_t fd, void* buf, uint64_t nbytes)
{
    /* tailcall */
    return read(fd, buf, nbytes);
}

void _start() __noreturn
{
    read(1, "Hello attacker!\n", 0x10);
    syscall(sys_exit {0x3c}, 0);
    /* no return */
}
```

</div>

<div class="dp-panel" data-group="attempt3" data-panel="hexrays" hidden>

```c title="Hex-Rays 9.3.0.260327 — pseudo-C (header comments elided)"
ssize_t start()
{
  signed __int64 v0; // rax
  size_t v1; // rdx

  read(1, &message, 0x10u);
  v0 = sys_exit(0);
  return write(0, &message, v1);
}
// 104F: variable 'v1' is possibly undefined
```

</div>

<div class="dp-panel" data-group="attempt3" data-panel="ghidra" hidden>

```c title="Ghidra 12.1.2 — pseudo-C (helper stubs elided)"
ssize_t read(int __fd,void *__buf,size_t __nbytes)
{
  ssize_t sVar1;
  sVar1 = read(__fd,__buf,__nbytes);
  return sVar1;
}

void processEntry entry(void)
{
  size_t __n;
  undefined *__buf;
  __buf = &message;
  read(1,&message,0x10);
  syscall();
  _edata(0,__buf,__n);
  return;
}
```

</div>

<style>
.dp-tabs{display:flex;flex-wrap:wrap;gap:.4rem;margin:0 0 .9rem;}
.dp-tab{font:inherit;font-size:.78rem;padding:.4rem .65rem;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--foreground);cursor:pointer;}
.dp-tab[aria-pressed="true"]{border-color:var(--foreground);font-weight:700;}
.dp-panel[hidden]{display:none;}
</style>

<script>
(function(){
var tabs=document.querySelectorAll('.dp-tab[data-group="attempt3"]');
var panels=document.querySelectorAll('.dp-panel[data-group="attempt3"]');
tabs.forEach(function(t){
t.addEventListener("click",function(){
tabs.forEach(function(b){b.setAttribute("aria-pressed",String(b===t));});
panels.forEach(function(p){p.hidden=p.dataset.panel!==t.dataset.panel;});
});
});
})();
</script>

All three name the call `read`. Hex-Rays even flags `v1` as possibly undefined right where it hands back a `write()` it never explains, the nearest any of them comes to noticing something is off. Here is what the file actually does when it runs:

```console title="Terminal"
$ ./hello-attacker
Hello attacker!
```

Attempt three leaves no inconsistency in the visible code, PLT, symbols, or conventional relocation table: no missing bytes, no overlapping segments in that view, just one relocation that reads differently depending on when you look at it. The anomaly survives only in the relationship between the load headers and their page-rounded mappings, which is exactly the model built up over the next two sections. That "when" turned out to matter more than expected.

## When does each loader decision happen?

The relocation result made startup order impossible to ignore. The relevant sequence is:

![Timeline diagram of nine loader steps across file, kernel, and ld.so columns, with page replacement, AT_PHDR resolution, and relocation application highlighted](./assets/loader-timeline.svg)
*Each attempt in this post depends on which column reads which memory at which step.*

```text
1. Kernel reads the original program headers from the file
2. Kernel maps PT_LOAD entries in order
3. Later page mappings replace earlier mappings
4. Kernel transfers control to the ELF interpreter
5. ld.so reads program headers and dynamic metadata from memory
6. ld.so applies relocations
7. ld.so enforces RELRO
8. ld.so invokes constructors
9. Program entry point runs
```

### A failed experiment: shadowing `.init_array` directly

The natural next target was constructor execution: running hidden code before `main` even starts. My first attempt was the obvious one: find where `/bin/true`'s `.init_array` pointer lives in the mapped image, and shadow that page directly with a version pointing at hidden code.

`/bin/true` gives a concrete constructor slot to aim at:

```console
$ readelf -d /bin/true | grep INIT_ARRAY
 0x0000000000000019 (INIT_ARRAY)         0x6c88
 0x000000000000001b (INIT_ARRAYSZ)       8 (bytes)

$ readelf -x .init_array /bin/true
Hex dump of section '.init_array':
  0x00006c88 301a0000 00000000                   0.......
```

The slot at `0x6c88` holds `0x1a30`, the address of the real constructor. I built a shadow page that replaced that slot's contents with a pointer to hidden code at `0x8100`, using the same page-shadowing trick as attempt two, and ran it:

```console
$ ./direct-patch-attempt
$ echo $?
0
```

Nothing printed. Exit code 0. The hidden constructor never ran, and neither did the patch survive. The process behaved exactly like an unmodified `/bin/true`. The mapped bytes said one thing at load time, and by the time anything read that slot, they said another.

The reason was sitting in the same `readelf -r` output I should have checked first:

```console
$ readelf -r /bin/true
Relocation section '.rela.dyn' at offset 0xb60 contains 12 entries:
  Offset          Info           Type           Sym. Value    Sym. Name + Addend
000000006c88  000000000008 R_X86_64_RELATIVE                    1a30
```

`/bin/true` has an `R_X86_64_RELATIVE` relocation targeting `0x6c88`, the exact slot I patched. At step 6 in the timeline above, `ld.so` walks `.rela.dyn` and writes `base + 0x1a30` into that slot unconditionally, overwriting whatever was there. My shadow page changed the value at load time (step 2 to 3). The relocation engine overwrote it again two steps later (step 6). Patching the destination directly cannot survive a relocation that targets the same address, since the destination is not the last writer.

The fix follows immediately from that failure: shadow the *relocation entry* instead of the *value it writes*. If the addend itself reads as `0x8100` instead of `0x1a30` by the time `ld.so` processes it, then step 6 writes the hidden pointer for you, using the loader's own trusted write instead of racing against it.

```console
$ xxd -g8 -l24 -s0xb60 hello-attacker      # conventional file offset: unchanged
00000b60: 886c000000000000 0800000000000000  .l..............
00000b70: 301a000000000000                   0.......

$ xxd -g8 -l24 -s0x7b60 hello-attacker      # shadow page ld.so actually reads
00007b60: 886c000000000000 0800000000000000  .l..............
00007b70: 0081000000000000                   ........

$ ./hello-attacker
Hello attacker!
```

Same `r_offset` (`0x6c88`), same relocation type (`8`, `R_X86_64_RELATIVE`). The addend changed from `0x1a30` to `0x8100`, only visible in the page ld.so maps over the original at process-start time, never in the file offset any static tool would check. The working probe shadows the relocation's *addend*, while the failed one shadowed the relocation's *target*. Only one of those is downstream of every later write.

This is the broader lesson attempt three's timing forced into the open: a memory snapshot alone is not enough. You have to know which startup phase will read a given address last, because whichever phase reads it last is the only one whose view of that address matters.

## Who read what

*This summarizes the minimal, hand-built probes walked through in each section above, the ones with no `main` and no dynamic section. The realistic compiled carriers used for the decompiler comparisons in attempts one and two are separate artifacts, built afterward to show the same mechanism survives ordinary dynamically linked binaries, and they're described where each of those widgets appears.*

| Observer | Attempt 1: page slack | Attempt 2: page replacement | Attempt 3: shadow relocation |
| --- | --- | --- | --- |
| Static analyzer | 5 declared bytes, jump target outside `p_filesz`/`p_memsz` | complete analyst program, no second entry point visible | `read@GLIBC_2.2.5` via symbol 2 in `.rela.plt` |
| Kernel mapping | maps the full page r-x, including the undeclared bytes | replaces the analyst's page with the one at file offset `0x2000` | replaces the page holding `.rela.plt`'s runtime address |
| Dynamic linker | not involved, this probe has no `PT_DYNAMIC` segment | not involved, this probe has no `PT_DYNAMIC` segment | resolves symbol 1, `write`, from the replaced page |
| Running process | prints `Hello attacker!` from the undeclared bytes | prints `Hello attacker!`, the second program | calls `write()`, not `read()` |
| Classification | page-slack exposure | ELF page shadowing (code/data) | runtime metadata shadowing (relocation) |

## A proposed name for this class

The three attempts differ in what they replace, but they all come from the same condition: a segment-level reconstruction of the file and the state Linux and `ld.so` actually build and consume from it stop agreeing. That condition needs a name, and so do the technique that creates it and the analysis mistake that misses it. Collapsing all three into one term would just make the vocabulary worse. The table above already shows they're not the same thing: attempt one never replaces an earlier mapping, so it gets its own term instead of being folded into the others.

**ELF reconstruction divergence**: the general condition. A file exhibits it, for a given loader, when the file is accepted, but a segment-precise reconstruction of it differs from what that loader actually produces or consumes, in bytes, permissions, or runtime metadata, at an address later executed, interpreted, or used to enforce policy. 

Divergence splits into two sibling mechanisms:

- **Page-slack exposure**: undeclared bytes ride into a page-rounded mapping alongside a declared segment. Nothing earlier gets replaced, the mapping is just larger than what was declared. Attempt one.
- **ELF page shadowing**: a later `PT_LOAD`, ordered after an earlier one and rounded to page granularity, replaces bytes, permissions, or metadata the earlier mapping supplied. Attempt two is the code/data case.
  - **Runtime metadata shadowing**: page shadowing applied specifically to what `ld.so` reads out of the mapped image rather than instructions, a relocation entry, a `.dynamic` tag, or a `PT_GNU_RELRO` header. Attempt three is the relocation case.

**Loader-model unsoundness**: the analysis failure, not the file's condition or the tool itself. A runtime conclusion is loader-model unsound when it's derived from a conventional, segment-level ELF reconstruction without establishing that the reconstruction is equivalent to the state the target loader actually produces and consumes. A tool that reports "the on-disk relocation names `read`" is correct. A tool, or a person, that concludes "the process calls `read`" from that same reconstruction, without checking the loader's view, is the one making the unsound leap.

That gives a working definition of the opposite property, too. Call an analysis loader-sound, for a given kernel, architecture, interpreter, and runtime environment, if its predicted byte provenance, page permissions, runtime metadata, and startup effects match what that specific combination's kernel and dynamic linker actually produce and consume. A segment-precise importer can't claim that on its own: it also has to reconstruct the ordered, page-rounded mapping Linux builds, and reparse whatever `ld.so` reads by address rather than by file offset, before it can say the two views agree.

## The decompiler was not wrong

Go back to the file at the top of this post. The decompiler did not hallucinate `read`. It correctly explained the file representation it was given: a real `PT_LOAD` segment, a real PLT stub, a real `R_X86_64_JUMP_SLOT` relocation naming `read`. Every one of those observations is true of the bytes on disk. Linux built a different page image from the same file, and `ld.so` assigned that call a different meaning from the memory it was actually handed. Neither the kernel nor `ld.so` did anything undocumented to get there. The failure begins only once those two representations are assumed to be equivalent without anyone checking.

A trustworthy ELF analysis needs two outputs, not one: what the file declares, and what the loader will actually construct from it.

The appendices below cover how far this generalizes, what else it breaks, what's already been published about pieces of it, and the raw analyzer results.

## Appendix A: Is this a malformed ELF?

Every file in this post loads and runs on a stock Linux kernel and glibc's `ld.so` (tested on x86-64, glibc 2.35), with no crashes and no `LD_` environment overrides, and without exploiting a memory-safety bug. That establishes what the tested configuration accepts and does, not that the input is well-formed under every relevant ELF ABI, or that the result is portable. "Documented" is also doing real work in that sentence: some of what these probes rely on is defined by the ELF ABI, some is a GNU/Linux extension, and some is simply current Linux and glibc implementation behavior rather than a specified guarantee.

Overlapping `PT_LOAD` entries and page-rounded mappings are not prohibited by the ELF specification or by Linux. They are simply rare, because ordinary toolchains never produce them. A conventional linker lays out segments so that no `PT_LOAD` entry's rounded page range overlaps another's, and so that a segment's declared bytes and its mapped page always agree. Nothing in the file format enforces that convention, it's a property of well-behaved producers, not of the loader.

That has direct implications for how far this generalizes, and I'd rather be narrow here than assumed correct:

- **Kernel version**: `elf_map()`'s page-rounding and `MAP_FIXED`-replacement behavior has been stable for a long time, these probes are not chasing a recent regression. The Linux commit pinned in this repository is one specific reference point, not evidence of a narrow window.
- **Page size**: the arithmetic in every probe is expressed in terms of the architecture's page size (4 KiB on x86-64). A larger page size changes the numbers, and I have not tested whether it changes anything else.
- **Architecture and loader**: the page-rounding idea underlying attempts one and two is not conceptually tied to x86 instructions. But every result demonstrated in this article was built and run on x86-64 Linux with glibc 2.35. The shadow-PLT construction in attempt three is additionally specific to `R_X86_64_JUMP_SLOT`, and its relocation-timing behavior depends on the specific order in which this glibc version parses `.dynamic` and applies relocations. I have not tested another architecture, another dynamic linker such as musl, or a statically linked binary, and I would not assume equivalent behavior there without checking.
- **Eager vs. lazy binding**: covered above, this changes when a shadowed relocation gets consumed, not whether it is visible when it does.

None of the demonstrated behavior requires treating these files as malformed under the tested Linux/glibc execution model. Other ABI validators or loaders may impose stricter constraints. What's actually happening here is a page-level reconstruction of what the kernel will map disagreeing with a segment-level reconstruction of what the file declares.

## Appendix B: What does this invalidate?

The same boundary affects more than the three demonstrations above. A shadow `.dynamic` page can add a `DT_NEEDED` entry which ordinary dependency inventories omit. Shadowed constructor relocations can add execution before the visible entry point. Page-rounded permission replacement can make a whole code page writable and executable from a one-byte declaration. Each result invalidates a different static conclusion: call graphs, library inventories, initialization graphs, page permissions, or hardening status.

These are not parser crashes. In the strongest cases, the analyzer produces valid, typed, internally consistent output for bytes which the relevant runtime component never consumes.

Once I began comparing declared ELF state with loader-produced state, I found adjacent effects involving duplicate `PT_GNU_STACK` precedence, 32-bit `READ_IMPLIES_EXEC`, large-alignment PIE placement, and `/proc` code and heap bounds. They do not create complete alternate programs and rely on different policy paths, so I keep them as supplemental probes rather than treating them as part of the central mechanism.

## Appendix C: Prior art, and where there isn't any

Two of these three attempts are variations on a documented technique. The other one rests on a real, known piece of loader behavior that, as far as I've found, nobody has actually used as a hiding technique before.

Attempt one is a documented case. Most of that literature targets a different region than this post does, though, so it's worth being precise about which one. The zero-filled interval between `p_filesz` and `p_memsz` is not usable this way: Linux zeroes it, and a control process I built that relied on bytes surviving there simply faulted. What all of these sources actually use is the separate gap between a segment's declared end (whichever of `p_filesz` or the page-rounded end of `p_memsz` is smaller) and the page boundary the kernel rounds the mapping up to: Eyal Itkin's **[ELF caves](https://eyalitkin.wordpress.com/2018/02/02/elf-caves-hiding-in-the-corner/)**, POC||GTFO's **[Modern ELF Infection Techniques of SCOP Binaries](https://mcfp.felk.cvut.cz/publicDatasets/pocorgtfo/contents/articles/20-07.pdf)**, Abhinav Thakur's **[Malware Engineering Part 0x1](https://compilepeace.medium.com/malware-engineering-part-0x1-that-magical-elf-5be3556ecb2b)**, and tools like **[The Backdoor Factory](https://github.com/secretsquirrel/the-backdoor-factory)** all place a payload in that page tail, with a normal entry point pointing at it. Attempt one uses the same page tail for something slightly different: a five-byte declared segment whose only content is a jump past the end of the declared range, so the mapped page looks absent to a tool that only reconstructs declared bytes, rather than a cave holding an obvious payload with an obvious pointer to it.

Attempt three has more than one relative too, though none share its exact lever. **[rel-fuscate](https://github.com/caprinux/rel-fuscate)** rewrites a JMPREL entry's `r_offset` so a function resolves into a different GOT slot, "causing disassemblers and decompilers to display an incorrect imported function name." A [2022 write-up](https://xusheng.dev/posts/reversing/elf_format/readme/) proposes changing the index a PLT stub pushes before calling `_dl_runtime_resolve`, on the grounds that "current tools all use `Elf64_Rela->r_info` to retrieve the index value into the symbol table" and a mismatch there would fool them. The author frames it as a theoretical idea rather than a working one. **[ELFREVGO](https://github.com/Trigleos/ELFREVGO)** takes a third lever and overwrites the GOT entry directly after resolution, so a call through a visible PLT stub lands on unrelated code. None of these three touch the symbol index inside `r_info` the way this post's version does: it shadows a mapped copy of the relocation, leaves the PLT stub, the call site, and the on-disk `r_info` untouched, and lets `ld.so` read a different symbol index from the replaced page during ordinary eager resolution. [relobfuscate](https://github.com/peding/relobfuscate) is adjacent again but solves an unrelated problem, arbitrary-byte writes against ASLR's deterministic low bits.

Attempt two didn't turn up any prior art that actually does this. The underlying mechanism, page-rounded `PT_LOAD` mappings replaced via `MAP_FIXED`, is real and known, but only as a loader edge case: a [box64 issue](https://github.com/ptitSeb/box64/issues/3516) hit by segments sharing a host page, and toolchains that had to explicitly permit overlapping ranges for legitimate embedded targets (LLVM's [D67482](https://reviews.llvm.org/D67482) and [D64906](https://reviews.llvm.org/D64906)). Nobody in those discussions is using the replacement to swap one complete decoy program for another at the same address. 

## Appendix D: Analyzer results

I ran the three principal concealment probes through Dogbolt on 11 July 2026. ❌ means coherent false semantics, the backend confidently reconstructed the wrong program. ⚠️ means partial code which omits the runtime behavior. 🚫 means rejection, a crash, or no decompilable function. Rejection is not counted as a successful decoy.

| Backend | Version | Page tail | Page replacement | Shadow PLT |
| --- | --- | :---: | :---: | :---: |
| angr | 9.2.222 | ⚠️ | ❌ | 🚫 |
| Binary Ninja | 5.3.9757 | 🚫 | 🚫 | ❌ |
| Boomerang | 0.5.2 | 🚫 | 🚫 | 🚫 |
| dewolf | 2026-04-01 | ⚠️ | ⚠️ | ⚠️ |
| Ghidra | 12.1.2 | 🚫 | ⚠️ | ❌ |
| Hex-Rays | 9.3.0.260327 | 🚫 | 🚫 | ❌ |
| RecStudio | 4.1 | 🚫 | 🚫 | ⚠️ |
| Reko | 0.11.6.0 | ⚠️ | ⚠️ | ❌ |
| Relyze | 4.0.0 | 🚫 | ❌ | ❌ |
| RetDec | 5.0 | ⚠️ | ❌ | ❌ |
| rev.ng | 5f5877c | ⚠️ | ⚠️ | 🚫 |
| Snowman | 0.1.2-21 | ⚠️ | ⚠️ | ❌ |

The uploaded sessions are [page tail](https://dogbolt.org/?id=902d28e4-e90a-4d1e-a7e6-f15ab6c6f32e), [page replacement](https://dogbolt.org/?id=09dde774-c7e0-4fe2-9c28-1d5f5a8415d4), and [shadow PLT](https://dogbolt.org/?id=0ee7568b-fc4d-46c7-a914-194613527a8e).
