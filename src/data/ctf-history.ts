export type CtfMoment = {
  date: string
  month: string
  title: string
  team: string
  result: string
  resultUrl: string
  highlight?: "winner" | "podium" | "finals"
  note?: string
  link?: { label: string; href: string }
}

// A team scoreboard alone does not establish personal participation. Each
// entry also has a first-person account, explicit credit, or user confirmation.
// Do not infer team-join dates from event dates.
export const ctfSeasons: { year: string; moments: CtfMoment[] }[] = [
  {
    year: "2023",
    moments: [
      {
        date: "2023-01",
        month: "January",
        title: "RealWorldCTF",
        team: "Phreaks 2600",
        result: "23rd overall · 1st French team",
        resultUrl: "https://ctftime.org/event/1797/",
        // The school's announcement explicitly names Esteban among the players.
        // https://fr.linkedin.com/posts/val%C3%A9rie-de-saint-p%C3%A8re-43128715a_ahou-ahou-ahou-bravo-%C3%A0-toute-activity-7017856051425247232-RgIf
      },
    ],
  },
  {
    year: "2024",
    moments: [
      {
        date: "2024-01",
        month: "January",
        title: "RealWorldCTF",
        team: "Friendly Maltese Citizens",
        result: "3rd place",
        highlight: "podium",
        resultUrl: "https://ctftime.org/event/2172/",
        note: "We were one of only six teams to solve “Let’s Party in the House.”",
        // Personal participation and challenge result: the linked writeup and
        // https://www.linkedin.com/posts/tonglet-esteban_third-place-at-the-realworld-ctf-this-activity-7158067987923501056-skqf
        link: { label: "My writeup", href: "/posts/rwctf-wu/" },
      },
      {
        date: "2024-08",
        month: "August",
        title: "DEF CON 32 finals",
        team: "Friendly Maltese Citizens",
        result: "11th of 12 finalists",
        highlight: "finals",
        resultUrl:
          "https://nautilus.institute/blog/2024/defcon-32-ctf-final-results/",
        note: "My first time playing in the DEF CON finals, in Las Vegas.",
        // Personal attendance: user confirmation and https://github.com/Zerotistic
      },
    ],
  },
  {
    year: "2025",
    moments: [
      {
        date: "2025-06",
        month: "June",
        title: "Google CTF",
        team: "Friendly Maltese Citizens",
        result: "1st place",
        highlight: "winner",
        resultUrl: "https://ctftime.org/event/2718/",
        // Personal participation confirmed by the user; event ran June 27–29.
      },
      {
        date: "2025-08",
        month: "August",
        title: "DEF CON 33 finals",
        team: "Friendly Maltese Citizens",
        result: "8th of 12 finalists",
        highlight: "finals",
        resultUrl: "https://ctftime.org/event/2897/",
        note: "Back in Las Vegas for a second year of finals with FMC.",
        // Personal attendance: user confirmation and https://github.com/Zerotistic
        // Team result also confirmed in this firsthand teammate account.
        // https://srlabs.de/blog/competing-at-the-def-con-ctf-finals-2025
      },
    ],
  },
]

// Four consecutive appearances: user confirmation and their GitHub profile.
// Cities: https://ecsc.eu/hall-of-fame/belgium and each edition's page.
export const ecscEditions = [
  { year: "2022", date: "2022-09", month: "September", city: "Vienna" },
  { year: "2023", date: "2023-10", month: "October", city: "Hamar" },
  { year: "2024", date: "2024-10", month: "October", city: "Turin" },
  { year: "2025", date: "2025-10", month: "October", city: "Warsaw" },
]

type TeamMilestone = {
  kind: "team"
  date: string
  month?: string
  team: "idek" | "Project Sekai"
  href: string
  note: string
}

export type CtfTimelineEntry =
  | (CtfMoment & { kind: "competition" })
  | ((typeof ecscEditions)[number] & { kind: "ecsc" })
  | TeamMilestone

// Approximate dates supplied by the user, not inferred from team scoreboards.
const teamMilestones: TeamMilestone[] = [
  {
    kind: "team",
    date: "2023",
    team: "idek",
    href: "https://idek.team/",
    note: "My first big team.",
  },
  {
    kind: "team",
    date: "2025-08",
    month: "August",
    team: "Project Sekai",
    href: "https://sekai.team/",
    note: "Left idek to join Project Sekai.",
  },
]

export const ctfTimeline: CtfTimelineEntry[] = [
  ...teamMilestones,
  ...ctfSeasons.flatMap(({ moments }) =>
    moments.map((moment) => ({ ...moment, kind: "competition" as const })),
  ),
  ...ecscEditions.map((edition) => ({ ...edition, kind: "ecsc" as const })),
].sort((a, b) => a.date.localeCompare(b.date))

// Hackceler8 attendance is user-confirmed, but its year/team are not established.
// FMC's 2025 qualification does not prove attendance at that particular edition.
