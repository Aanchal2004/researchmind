export type WorkspaceNavItem = {
  href: string;
  label: string;
  badge?: string;
};

export type Metric = {
  label: string;
  value: string;
  change: string;
  tone: "teal" | "violet" | "amber";
};

export type Paper = {
  title: string;
  authors: string;
  year: string;
  venue: string;
  source: string;
  summary: string;
  score?: string;
  tags?: string[];
};

export type Collection = {
  name: string;
  count: string;
  accent: string;
};

export type Alert = {
  topic: string;
  description: string;
  frequency: string;
  updates: string;
  accent: string;
};

export const workspaceNav: WorkspaceNavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/search", label: "Search" },
  { href: "/dashboard#library", label: "Library" },
  { href: "/dashboard#collections", label: "Collections" },
  { href: "/dashboard#alerts", label: "Alerts", badge: "3" },
  { href: "/dashboard#settings", label: "Settings" },
];

export const featuredSources = [
  "PubMed",
  "arXiv",
  "IEEE Xplore",
  "Crossref",
  "Semantic Scholar",
];

export const dashboardMetrics: Metric[] = [
  {
    label: "Papers saved",
    value: "47",
    change: "+8 this week",
    tone: "teal",
  },
  {
    label: "Collections",
    value: "6",
    change: "+1 this month",
    tone: "violet",
  },
  {
    label: "Alerts",
    value: "3",
    change: "3 new papers",
    tone: "amber",
  },
];

export const recentPapers: Paper[] = [
  {
    title: "Scaling Laws for Diffusion Models in Image Synthesis",
    authors: "K. Parmar, Y. Li, J. Lu, et al.",
    year: "2024",
    venue: "arXiv",
    source: "arXiv",
    summary: "Benchmarks how model size and compute affect multimodal diffusion performance.",
  },
  {
    title: "Retrieval-Augmented Generation for Scientific Text",
    authors: "S. Moon, Y. Zhang, D. M. Blei",
    year: "2024",
    venue: "NeurIPS",
    source: "NeurIPS",
    summary: "Uses structured retrieval pipelines to ground synthesis over technical corpora.",
  },
  {
    title: "AlphaFold 3 Predicts Interactions Across Biomolecules",
    authors: "J. Abramson, J. Adler, J. Dunger, et al.",
    year: "2024",
    venue: "Nature",
    source: "Nature",
    summary: "Extends structure prediction to proteins, DNA, RNA, and ligands in one model.",
  },
  {
    title: "Graph Neural Diffusion Networks",
    authors: "Z. Chen, T. Başar, Y. Sun, et al.",
    year: "2023",
    venue: "ICML",
    source: "ICML",
    summary: "Explores graph-conditioned denoising for controllable scientific generation tasks.",
  },
];

export const collections: Collection[] = [
  { name: "Diffusion Models", count: "12 papers", accent: "from-sky-400 to-cyan-300" },
  { name: "Protein Folding", count: "9 papers", accent: "from-emerald-400 to-lime-300" },
  { name: "LLM Alignment", count: "7 papers", accent: "from-violet-400 to-fuchsia-300" },
  { name: "Computer Vision", count: "8 papers", accent: "from-amber-400 to-orange-300" },
  { name: "RL + Control", count: "6 papers", accent: "from-rose-400 to-orange-300" },
];

export const topicAlerts: Alert[] = [
  {
    topic: "Diffusion Models",
    description: "New papers on training, scaling, and evaluation.",
    frequency: "Daily digest",
    updates: "3 new papers",
    accent: "text-teal-300 bg-teal-400/10",
  },
  {
    topic: "Protein Structure Prediction",
    description: "AlphaFold, RoseTTAFold, ESMFold, and more.",
    frequency: "Daily digest",
    updates: "1 new paper",
    accent: "text-violet-300 bg-violet-400/10",
  },
  {
    topic: "LLM Reasoning & Agents",
    description: "Reasoning, tool use, planning, and agent frameworks.",
    frequency: "Weekly digest",
    updates: "2 new papers",
    accent: "text-amber-300 bg-amber-400/10",
  },
];

export const landingFeatures = [
  {
    title: "Search across 5 databases",
    description:
      "Run one query across PubMed, arXiv, IEEE Xplore, Crossref, and Semantic Scholar.",
    cta: "Explore databases",
  },
  {
    title: "AI synthesis built for literature review",
    description:
      "Generate grounded summaries, compare claims, and surface tension across papers.",
    cta: "Learn about synthesis",
  },
  {
    title: "Citation export without friction",
    description:
      "Collect references and export in BibTeX, RIS, APA, or MLA directly from the workspace.",
    cta: "See export options",
  },
];

export const workflowSteps = [
  {
    step: "01",
    title: "Ask a research question",
    body: "Start with a natural-language prompt, author, DOI, or topic cluster.",
  },
  {
    step: "02",
    title: "Triangulate across sources",
    body: "ResearchMind merges signals from multiple academic databases into one ranked view.",
  },
  {
    step: "03",
    title: "Synthesize and organize",
    body: "Save key papers, export citations, and convert findings into living collections.",
  },
];

export const searchFilters = [
  "Date: 2020 - Present",
  "Domain: Computer Science, Biology",
  "Sources: 5 selected",
  "Open access preferred",
];

export const searchResults: Paper[] = [
  {
    title: "TargetDiff: Diffusion Models for Target-Aware 3D Molecule Generation",
    authors: "Jinheon Baek, Minki Kang, Sung Ju Hwang, et al.",
    year: "2022",
    venue: "arXiv: 2210.03621v2",
    source: "arXiv",
    summary:
      "Produces 3D molecules conditioned on target protein structures with strong validity and diversity.",
    score: "9.6",
    tags: ["target-aware", "molecular-generation", "protein-binding"],
  },
  {
    title: "GeoDiff: A Geometric Diffusion Model for 3D Molecular Conformation Generation",
    authors: "Yinghao Xu, Zhenrong Jia, Vijay Pande, et al.",
    year: "2022",
    venue: "NeurIPS",
    source: "PubMed",
    summary:
      "Introduces an SE(3)-equivariant diffusion model for physically plausible 3D conformations.",
    score: "9.1",
    tags: ["se(3)-equivariance", "drug-discovery", "conformations"],
  },
  {
    title: "EquiBind: Geometric Deep Learning for Structure-Based Molecule Generation",
    authors: "Bowen Jing, Stephan Eismann, Patrick Bryant, et al.",
    year: "2022",
    venue: "ICML",
    source: "arXiv",
    summary:
      "Pairs geometric inductive bias with diffusion-style reasoning for protein-pocket conditioning.",
    score: "8.7",
    tags: ["binding-affinity", "structure-based", "geometric-learning"],
  },
  {
    title: "DiffSBDD: Diffusion Model for Structure-Based Drug Design",
    authors: "Zhixuan Liu, Sibo Wang, Xiangxiang Zeng, et al.",
    year: "2022",
    venue: "Bioinformatics",
    source: "Semantic Scholar",
    summary:
      "Applies diffusion to ligand generation with structure-aware priors and benchmarking analysis.",
    score: "8.3",
    tags: ["drug-design", "benchmarks", "ligand-generation"],
  },
];

export const synthesisHighlights = [
  "Diffusion models have become a leading approach for 3D molecule generation, especially in structure-based settings.",
  "SE(3)-equivariance is a recurring ingredient for rotational and translational consistency.",
  "Conditioning on protein pockets improves downstream affinity and functional plausibility.",
];

export const synthesisSources = [
  "[1] Baek, J., Kang, M., Hwang, S. J., et al. TargetDiff. arXiv:2210.03621v2, 2022.",
  "[2] Xu, Y., Jia, Z., Pande, V., et al. GeoDiff. NeurIPS, 2022.",
  "[3] Jing, B., Eismann, S., Bryant, P., et al. EquiBind. arXiv:2302.05125, 2023.",
  "[4] Liu, Z., Wang, S., Zeng, X., et al. DiffSBDD. Bioinformatics, 2022.",
  "[5] Corso, G., et al. DiffDock. arXiv:2210.01776, 2022.",
];
