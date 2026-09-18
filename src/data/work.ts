import deloitteLogo from "@/assets/optimized/logos/deloitte.webp?url"
import hackcyomLogo from "@/assets/optimized/logos/hackcyom.webp?url"
import hiddenlayerLogo from "@/assets/optimized/logos/hiddenlayer.webp?url"
export type WorkEntry = {
  id: string
  organization: string
  logo: string
  role: string
  kind: "Work" | "Apprenticeship" | "Education"
  start: string
  end?: string
  location?: string
  note?: string
  approximateEnd?: boolean
  phases?: {
    label: string
    start: string
    end: string
    approximateStart?: boolean
    approximateEnd?: boolean
  }[]
}

export const work: WorkEntry[] = [
  {
    id: "hiddenlayer",
    organization: "HiddenLayer",
    logo: hiddenlayerLogo,
    role: "Security Researcher",
    kind: "Work",
    start: "2025-02",
    location: "Remote",
  },
  {
    id: "hackcyom",
    organization: "Hackcyom",
    logo: hackcyomLogo,
    role: "Security Researcher",
    kind: "Work",
    start: "2023-02",
    end: "2025-02",
    location: "Paris, France",
    phases: [
      {
        label: "Full-time",
        start: "2024-03",
        end: "2025-02",
        approximateStart: true,
      },
      {
        label: "Apprenticeship",
        start: "2023-02",
        end: "2024-03",
        approximateEnd: true,
      },
    ],
  },
  {
    id: "deloitte",
    organization: "Deloitte",
    logo: deloitteLogo,
    role: "Junior Consultant",
    kind: "Apprenticeship",
    start: "2022-10",
    end: "2023-02",
    location: "Paris, France",
  },
]

export const education: WorkEntry = {
  id: "ecole-2600",
  organization: "École 2600",
  logo: "/static/work/ecole-2600.png",
  role: "Cybersecurity apprenticeship",
  kind: "Education",
  start: "2022",
  end: "2024-03",
  approximateEnd: true,
  note: "Left to continue full-time at Hackcyom.",
}
