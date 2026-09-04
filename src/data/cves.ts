export type Severity = "critical" | "high" | "medium"

export type Finding = {
  id: string
  title: string
  summary: string
  published?: string
  score?: string
  cvss?: "3.1" | "4.0"
  severity?: Severity
  url?: string
  advisory?: { label: string; href: string }
}

export type Product = {
  id: string
  name: string
  context: string
  findings: Finding[]
}

export const cveUrl = (id: string) => `https://www.cve.org/CVERecord?id=${id}`

const netronAdvisory = {
  label: "HiddenLayer advisory",
  href: "https://www.hiddenlayer.com/sai-security-advisory/2026-08-netron",
}

const productData: Product[] = [
  {
    id: "netron",
    name: "Netron",
    context: "Neural-network model viewer",
    findings: [
      {
        id: "CVE-2026-79718",
        title: "DOM XSS through an unsanitized node name",
        summary:
          "A crafted model could inject HTML through a node name when its sidebar was opened, enabling local-network requests or a browser exploit chain in the desktop app.",
        published: "2026-08-27",
        score: "6.8",
        cvss: "4.0",
        severity: "medium",
        url: cveUrl("CVE-2026-79718"),
        advisory: netronAdvisory,
      },
      {
        id: "CVE-2026-79719",
        title: "DOM XSS through an unsanitized input description",
        summary:
          "A crafted model could inject HTML through an input description when its sidebar was opened, enabling local-network requests or a browser exploit chain in the desktop app.",
        published: "2026-08-27",
        score: "6.8",
        cvss: "4.0",
        severity: "medium",
        url: cveUrl("CVE-2026-79719"),
        advisory: netronAdvisory,
      },
      {
        id: "CVE-2026-79720",
        title: "DOM XSS through an unsanitized output description",
        summary:
          "A crafted model could inject HTML through an output description when its sidebar was opened, enabling local-network requests or a browser exploit chain in the desktop app.",
        published: "2026-08-27",
        score: "6.8",
        cvss: "4.0",
        severity: "medium",
        url: cveUrl("CVE-2026-79720"),
        advisory: netronAdvisory,
      },
    ],
  },
  {
    id: "mlflow",
    name: "MLflow",
    context: "Machine-learning lifecycle platform",
    findings: [
      {
        id: "CVE-2026-79721",
        title: "Details pending coordinated disclosure",
        summary:
          "This CVE has been assigned; technical details and scoring will be added when its public record is available.",
      },
    ],
  },
  {
    id: "anubis",
    name: "Anubis",
    context: "Web AI firewall",
    findings: [
      {
        id: "CVE-2026-62314",
        title: "Policy bypass via a client-controlled X-Original-URI header",
        summary:
          "A client-controlled header was trusted before the request path, allowing matching ALLOW rules to bypass the Anubis challenge.",
        published: "2026-07-15",
        score: "5.8",
        cvss: "3.1",
        severity: "medium",
        url: cveUrl("CVE-2026-62314"),
        advisory: {
          label: "GitHub advisory",
          href: "https://github.com/TecharoHQ/anubis/security/advisories/GHSA-6wcg-mqvh-fcvg",
        },
      },
    ],
  },
  {
    id: "chromadb",
    name: "ChromaDB",
    context: "AI-native database",
    findings: [
      {
        id: "CVE-2026-45829",
        title: "Pre-authentication remote code execution",
        summary:
          "An unauthenticated attacker could submit a malicious model repository with trust_remote_code enabled and execute code on the server.",
        published: "2026-05-18",
        score: "10.0",
        cvss: "4.0",
        severity: "critical",
        url: cveUrl("CVE-2026-45829"),
      },
      {
        id: "CVE-2026-45833",
        title: "Authenticated remote code execution",
        summary:
          "A user with collection-update permission could load a malicious model repository with trust_remote_code and execute code on the server.",
        published: "2026-06-12",
        score: "9.4",
        cvss: "4.0",
        severity: "critical",
        url: cveUrl("CVE-2026-45833"),
      },
      {
        id: "CVE-2026-8828",
        title: "Cross-tenant authorization bypass in ChromaDB Rust",
        summary:
          "Any authenticated user could read, write, update, or delete collections belonging to another tenant.",
        published: "2026-06-12",
        score: "8.8",
        cvss: "4.0",
        severity: "high",
        url: cveUrl("CVE-2026-8828"),
      },
      {
        id: "CVE-2026-45830",
        title: "Cross-tenant authorization bypass in ChromaDB Python",
        summary:
          "Any authenticated user could read, write, update, or delete collections belonging to another tenant.",
        published: "2026-06-12",
        score: "8.8",
        cvss: "4.0",
        severity: "high",
        url: cveUrl("CVE-2026-45830"),
      },
      {
        id: "CVE-2026-45831",
        title: "SimpleRBAC cross-tenant authorization bypass",
        summary:
          "The provider checked whether a user held a permission, but not which tenant, database, or collection that permission applied to.",
        published: "2026-06-12",
        score: "8.8",
        cvss: "4.0",
        severity: "high",
        url: cveUrl("CVE-2026-45831"),
      },
      {
        id: "CVE-2026-45832",
        title: "Authorization bypass through V1 collection endpoints",
        summary:
          "The V1 endpoints passed no tenant or database to the authorization layer, allowing its controls to be bypassed.",
        published: "2026-06-12",
        score: "8.8",
        cvss: "4.0",
        severity: "high",
        url: cveUrl("CVE-2026-45832"),
      },
    ],
  },
  {
    id: "flair",
    name: "Flair",
    context: "NLP framework",
    findings: [
      {
        id: "CVE-2026-3071",
        title: "Arbitrary code execution through model deserialization",
        summary:
          "Loading a malicious language model could trigger unsafe deserialization and execute arbitrary code.",
        published: "2026-02-26",
        score: "8.4",
        cvss: "3.1",
        severity: "high",
        url: cveUrl("CVE-2026-3071"),
      },
    ],
  },
  {
    id: "misp",
    name: "MISP",
    context: "Threat intelligence platform",
    findings: [
      {
        id: "CVE-2025-66386",
        title: "Path traversal in the EventReport image viewer",
        summary:
          "A site administrator could traverse outside the intended path when viewing an EventReport picture.",
        published: "2025-11-28",
        score: "4.1",
        cvss: "3.1",
        severity: "medium",
        url: cveUrl("CVE-2025-66386"),
      },
    ],
  },
  {
    id: "keras",
    name: "Keras",
    context: "Deep-learning framework",
    findings: [
      {
        id: "CVE-2025-49655",
        title: "Safe-mode bypass through TorchModuleWrapper",
        summary:
          "A malicious Keras file could execute arbitrary code when loaded, despite safe mode being enabled.",
        published: "2025-10-17",
        score: "9.8",
        cvss: "3.1",
        severity: "critical",
        url: cveUrl("CVE-2025-49655"),
      },
    ],
  },
  {
    id: "backend-ai",
    name: "Backend.AI",
    context: "AI compute platform",
    findings: [
      {
        id: "CVE-2025-49651",
        title: "Missing authorization for interactive sessions",
        summary:
          "An attacker could take over active sessions and access, steal, or alter data available inside them.",
        published: "2025-06-09",
        score: "8.1",
        cvss: "3.1",
        severity: "high",
        url: cveUrl("CVE-2025-49651"),
      },
      {
        id: "CVE-2025-49652",
        title: "Arbitrary account creation through missing access control",
        summary:
          "Unauthenticated users could create accounts and reach private data even when registration was disabled.",
        published: "2025-06-09",
        score: "9.8",
        cvss: "3.1",
        severity: "critical",
        url: cveUrl("CVE-2025-49652"),
      },
      {
        id: "CVE-2025-49653",
        title: "Credential exposure leading to account takeover",
        summary:
          "Sensitive data exposed through active sessions could reveal management-platform credentials.",
        published: "2025-06-09",
        score: "8.0",
        cvss: "3.1",
        severity: "high",
        url: cveUrl("CVE-2025-49653"),
      },
    ],
  },
  {
    id: "style-dictionary",
    name: "Style Dictionary",
    context: "Design-token build system",
    findings: [
      {
        id: "CVE-2026-XXXX",
        title:
          "Prototype Pollution via constructor.prototype Bypasses CVE-2026-54639 Patch",
        summary:
          "An attacker could exploit maliciously crafted token data to pollute object prototypes, potentially altering application behavior or data.",
        published: "2026-08-06",
        score: "8.4",
        cvss: "3.1",
        severity: "high",
        advisory: {
          label: "GitHub advisory",
          href: "https://github.com/style-dictionary/style-dictionary/security/advisories/GHSA-xmr7-549p-98w3",
        },
      },
    ],
  },
]

const publishedAt = (finding: Finding) =>
  finding.published ? Date.parse(finding.published) : 0

const newestPublication = (product: Product) =>
  Math.max(...product.findings.map(publishedAt))

export const products = productData
  .map((product) => ({
    ...product,
    findings: [...product.findings].sort(
      (left, right) => publishedAt(right) - publishedAt(left),
    ),
  }))
  .sort(
    (left, right) =>
      newestPublication(right) - newestPublication(left) ||
      left.name.localeCompare(right.name),
  )

export const duplicateProject = {
  id: "redis-duplicate",
  name: "Redis",
  context: "In-memory data store",
  findings: [
    {
      id: "CVE-2026-25243",
      title: "Redis Streams use-after-free",
      summary:
        "I independently found this vulnerability, but my report was marked as a duplicate. My exploit chain takes a different route to remote code execution, so I documented it anyway.",
      writeup: "/posts/redis-stream-pel-uaf",
      note: "https://x.com/gegrgtezrze/status/2062320078280859820",
    },
  ],
}
