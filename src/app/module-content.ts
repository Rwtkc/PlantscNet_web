import type { ModuleContent, ModuleId } from '@/types/module'

export const moduleContent: Record<ModuleId, ModuleContent> = {
  home: {
    id: 'home',
    title: 'PlantscNet Portal',
    subtitle: 'A curated gateway for plant single-cell regulatory networks',
    description:
      'Track datasets, inspect regulatory relationships, and coordinate analysis workflows from one consistent workspace.',
    stats: [
      { label: 'Species Profiles', value: '10' },
      { label: 'Tissue Types', value: '13' },
      { label: 'Weekly Updates', value: '6' },
    ],
    highlights: [
      {
        title: 'Centralized Workspace',
        description:
          'Keep computational outputs, metadata, and protocol notes discoverable for every collaborator.',
      },
      {
        title: 'Reproducible Pipelines',
        description:
          'Standardized execution recipes reduce drift between exploratory notebooks and production workflows.',
      },
      {
        title: 'Quick Module Access',
        description:
          'Jump directly into browsing, searching, downloading, or support paths without losing context.',
      },
    ],
    actions: [
      { label: 'Browse Collections', to: '/browse' },
      { label: 'Start Searching', to: '/search' },
    ],
  },
  browse: {
    id: 'browse',
    title: 'Browse Repository',
    subtitle: 'Navigate data collections by species, tissue, and condition',
    description:
      'Use structured filters to inspect available datasets and review what is ready for downstream GRN inference.',
    stats: [
      { label: 'Public Datasets', value: '215' },
      { label: 'Validated Markers', value: '2.8k' },
      { label: 'Taxonomy Tags', value: '96' },
    ],
    highlights: [
      {
        title: 'Facet Navigation',
        description:
          'Combine organism, tissue layer, and treatment facets to narrow broad collections in seconds.',
      },
      {
        title: 'Snapshot Cards',
        description:
          'Every collection card exposes sampling depth, preprocessing status, and last curation timestamp.',
      },
      {
        title: 'Stable Identifiers',
        description:
          'Persistent dataset IDs enable reproducible references in papers and internal analysis reports.',
      },
    ],
    actions: [
      { label: 'Open Search Module', to: '/search' },
      { label: 'Review Download Assets', to: '/download' },
    ],
  },
  search: {
    id: 'search',
    title: 'Search Regulatory Relations',
    subtitle: 'Query TF or target genes within one selected species',
    description:
      'Search both the integrated final network and sample-derived pySCENIC TF-target files within the selected species.',
    stats: [
      { label: 'Search Scope', value: 'Both' },
      { label: 'Modes', value: 'TF / Target' },
      { label: 'Species Filter', value: 'Required' },
    ],
    highlights: [
      {
        title: 'Separated Score Semantics',
        description:
          'Integrated-network probability and sample-derived importance score are returned in separate result sections.',
      },
      {
        title: 'Species-Scoped Querying',
        description:
          'Every search is constrained to one selected species so the result set stays biologically interpretable.',
      },
      {
        title: 'Sample-Level Backtracking',
        description:
          'Sample-derived matches reveal which sample and tissue still contain the searched relation.',
      },
    ],
    actions: [],
  },
  download: {
    id: 'download',
    title: 'Download Species Assets',
    subtitle: 'Retrieve motif rankings, final regulatory networks, and TF lists by species',
    description:
      'Download the server-side feather rankings, MEME motif files, TF lists, and final regulatory networks prepared for each PlantscNet species.',
    stats: [
      { label: 'Asset Families', value: '4' },
      { label: 'Species Bundles', value: '10' },
      { label: 'Delivery Mode', value: 'Direct' },
    ],
    highlights: [
      {
        title: 'Species-Scoped Downloads',
        description:
          'Each plant species exposes the same four asset families so downstream scripts can stay consistent.',
      },
      {
        title: 'Server-Backed Files',
        description:
          'Large bundles stay on the deployment host and are streamed directly without copying them into the frontend repository.',
      },
      {
        title: 'Workflow Ready',
        description:
          'Ranking feather archives, final regulatory networks, MEME motif files, and TF lists map directly to the species analysis workflow.',
      },
    ],
    actions: [],
  },
  contact: {
    id: 'contact',
    title: 'Contact Team',
    subtitle: 'Reach maintainers for data issues or collaboration requests',
    description:
      'Report curation inconsistencies, request metadata clarification, or propose integration partnerships.',
    stats: [
      { label: 'Response SLA', value: '1 Business Day' },
      { label: 'Maintainers', value: '8' },
      { label: 'Supported Channels', value: '3' },
    ],
    highlights: [
      {
        title: 'Issue Triage',
        description:
          'Incoming requests are automatically classified to route technical and biological questions quickly.',
      },
      {
        title: 'Collaboration Queue',
        description:
          'Joint project proposals are tracked with transparent milestones and shared ownership notes.',
      },
      {
        title: 'Audit-Friendly Logs',
        description:
          'Conversation records can be linked to release notes and curation decisions for accountability.',
      },
    ],
    actions: [],
  },
  help: {
    id: 'help',
    title: 'Help Center',
    subtitle: 'Operational guidance, FAQs, and troubleshooting playbooks',
    description:
      'Find setup instructions, module walkthroughs, and common diagnostics for day-to-day research usage.',
    stats: [
      { label: 'Guides', value: '34' },
      { label: 'FAQ Topics', value: '58' },
      { label: 'Updated This Month', value: '11' },
    ],
    highlights: [
      {
        title: 'Onboarding Paths',
        description:
          'Role-specific guides for wet lab researchers, bioinformaticians, and platform maintainers.',
      },
      {
        title: 'Troubleshooting Matrix',
        description:
          'Map symptoms to corrective actions with command examples and expected outputs.',
      },
      {
        title: 'Doc Versioning',
        description:
          'Link help articles to release versions so instructions stay aligned with deployed behavior.',
      },
    ],
    actions: [
      { label: 'Contact Support', to: '/contact' },
      { label: 'Explore Search', to: '/search' },
    ],
  },
}
