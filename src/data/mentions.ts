export type Mention = {
  name: string
  context: string
  description: string
  href: string
  kind: string
  year: string
  research: {
    label: string
    href: string
  }
}

export type MentionGroup = {
  id: string
  title: string
  mentions: Mention[]
}

const cffResearch = {
  label: "Breaking Control Flow Flattening",
  href: "/posts/cff-remover",
}

const findMyResearch = {
  label: "Find My People on Linux",
  href: "/posts/find-my-people-linux",
}

export const mentionGroups: MentionGroup[] = [
  {
    id: "research-citations",
    title: "Research & technical citations",
    mentions: [
      {
        name: "Roxane Cohen",
        context: "PhD thesis · Université Paris-Dauphine–PSL",
        description:
          "Cites Breaking Control Flow Flattening as an academic reference on deobfuscation.",
        href: "https://www.robindavid.fr/assets/pdf/thesis_rcohen_2025.pdf",
        kind: "academic",
        year: "2025",
        research: cffResearch,
      },
      {
        name: "tmp.0ut #5",
        context: "Overview of code virtualization",
        description:
          "References Breaking Control Flow Flattening in technical research on code virtualization and deobfuscation.",
        href: "https://tmpout.sh/5/12.html",
        kind: "technical research",
        year: "2026",
        research: cffResearch,
      },
      {
        name: "Black Mass Vol. III",
        context: "vx-underground",
        description:
          "References the automated control-flow-flattening analysis approach.",
        href: "https://mini-01-s3.vx-underground.org/samples/Papers/Other/VXUG%20Zines/2025-07-22%20-%20Black%20Mass%20Volume%20III.pdf",
        kind: "technical reference",
        year: "2025",
        research: cffResearch,
      },
      {
        name: "Day[0]",
        context: "Episode 263",
        description:
          "Discusses Breaking Control Flow Flattening in an episode covering reverse engineering and exploitation research.",
        href: "https://dayzerosec.com/podcast/263.html",
        kind: "podcast",
        year: "2024",
        research: cffResearch,
      },
    ],
  },
  {
    id: "press-mentions",
    title: "Press & institutional mentions",
    mentions: [
      {
        name: "The Register",
        context:
          "Researcher tricks Apple’s Find My into sharing location data with Linux",
        description:
          "In-depth coverage of the protocol work behind receiving Find My People location data on Linux.",
        href: "https://www.theregister.com/security/2026/08/20/researcher-tricks-apples-find-my-into-sharing-location-data-with-linux/5290496",
        kind: "press",
        year: "2026",
        research: findMyResearch,
      },
      {
        name: "SC Media",
        context:
          "Security researcher enrolls Linux device in Apple’s Find My network",
        description:
          "Coverage of the Linux enrollment, key retrieval, and location-decryption research.",
        href: "https://www.scworld.com/brief/security-researcher-enrolls-linux-device-in-apples-find-my-network",
        kind: "press",
        year: "2026",
        research: findMyResearch,
      },
      {
        name: "Thailand NCSA / ThaiCERT",
        context: "Cyber Threat Intelligence · 26 August 2026",
        description:
          "Included the Find My People research in a national cyber-threat-intelligence roundup.",
        href: "https://webboard-nsoc.ncsa.or.th/topic/3227/cyber-threat-intelligence-26-august-2026",
        kind: "institutional",
        year: "2026",
        research: findMyResearch,
      },
      {
        name: "CTO at NCSC",
        context: "Weekly security roundup · week ending 23 August 2026",
        description:
          "Selected the Find My People research for its weekly tooling-and-techniques roundup.",
        href: "https://ctoatncsc.substack.com/p/cto-at-ncsc-summary-week-ending-august-13a",
        kind: "institutional",
        year: "2026",
        research: findMyResearch,
      },
    ],
  },
]
