import type { ModuleContent, ModuleId } from '@/types/module'

export const moduleContent: Record<ModuleId, ModuleContent> = {
  home: {
    id: 'home',
    title: 'PlantscNet Portal',
    subtitle: 'A curated gateway for plant single-cell regulatory networks',
    description:
      'Explore plant single-cell regulatory networks across 30 scRNA species and 4 scATAC species.',
    stats: [
      { label: 'Species', value: '30' },
      { label: 'scRNA Species', value: '30' },
      { label: 'scATAC Species', value: '4' },
    ],
    highlights: [
      {
        title: 'Plant Regulatory Atlas',
        description:
          'Compare inferred TF-target relationships across plant species, tissues, and data layers.',
      },
      {
        title: 'Gene-Centered Exploration',
        description:
          'Start from a transcription factor, target gene, or gene list and follow its regulatory context.',
      },
      {
        title: 'Ready for Follow-Up Biology',
        description:
          'Use downloadable networks and prioritization tools to support marker interpretation and candidate selection.',
      },
    ],
    actions: [
      { label: 'Browse Species', to: '/browse' },
      { label: 'Search Genes', to: '/search' },
    ],
  },
  browse: {
    id: 'browse',
    title: 'Browse Species',
    subtitle: 'View plant species, tissues, and available regulatory networks',
    description:
      'Use Browse to see which plant systems are represented and where regulatory relationships can be inspected.',
    stats: [
      { label: 'scRNA Species', value: '30' },
      { label: 'scATAC Species', value: '4' },
      { label: 'Data Layers', value: '2' },
    ],
    highlights: [
      {
        title: 'Species Context',
        description:
          'Move from a plant species to its tissues and regulatory network evidence.',
      },
      {
        title: 'Tissue View',
        description:
          'Check the biological material represented before interpreting a TF-target relationship.',
      },
      {
        title: 'Network Preview',
        description:
          'Inspect high-confidence regulatory links before moving into gene-level search or download.',
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
    subtitle: 'Find TF or target genes within one selected species',
    description:
      'Look up inferred TF-target evidence in the integrated network and supporting sample-level networks for the selected species.',
    stats: [
      { label: 'Data Layers', value: 'scRNA / scATAC' },
      { label: 'Search Modes', value: 'TF / Target' },
      { label: 'Species Filter', value: 'Required' },
    ],
    highlights: [
      {
        title: 'Integrated Evidence',
        description:
          'Species-level results summarize TF-target relationships retained in the final regulatory network.',
      },
      {
        title: 'Species-Specific Meaning',
        description:
          'Each lookup is interpreted within one plant species, keeping gene names and regulatory context coherent.',
      },
      {
        title: 'Biological Source Context',
        description:
          'Sample-level matches help connect a relationship back to the tissue or biological material where it appears.',
      },
    ],
    actions: [],
  },
  tools: {
    id: 'tools',
    title: 'Gene Prioritization Tools',
    subtitle: 'Prioritize candidate genes from PlantScNet regulatory networks',
    description:
      'Use Neighborhood and Context Hub to interpret seed genes, marker lists, or DEGs in a selected scRNA or scATAC network.',
    stats: [
      { label: 'Methods', value: '2' },
      { label: 'Network Sources', value: 'Sample / Integrated' },
      { label: 'Input Mode', value: 'Gene List' },
    ],
    highlights: [
      {
        title: 'Neighborhood',
        description:
          'Rank submitted genes and new candidates by their direct regulatory neighborhood.',
      },
      {
        title: 'Context Hub',
        description:
          'Find hub genes whose network neighbors are enriched for a submitted context or DEG list.',
      },
      {
        title: 'PlantScNet Networks',
        description:
          'Run the tools on an integrated species network or a sample-level TF-target network from the current release.',
      },
    ],
    actions: [],
  },
  download: {
    id: 'download',
    title: 'Download Species Assets',
    subtitle: 'Retrieve motif rankings, final regulatory networks, and TF lists by species',
    description:
      'Download species-level regulatory network files, TF lists, motif resources, and ranking tables for downstream biological analysis.',
    stats: [
      { label: 'Resource Types', value: '4' },
      { label: 'Species Resources', value: '30' },
      { label: 'Data Layers', value: 'scRNA / scATAC' },
    ],
    highlights: [
      {
        title: 'Species-Scoped Downloads',
        description:
          'Each plant species lists the available resources clearly, including final networks and TF annotations.',
      },
      {
        title: 'Biology-Ready Tables',
        description:
          'Downloaded tables can be used for gene prioritization, comparative analysis, and figure preparation.',
      },
      {
        title: 'Motif and Ranking Resources',
        description:
          'Motif files and ranking archives support follow-up interpretation of candidate regulators.',
      },
    ],
    actions: [],
  },
  contact: {
    id: 'contact',
    title: 'Contact Team',
    subtitle: 'Reach the PlantscNet team for data questions or collaboration requests',
    description:
      'Ask about regulatory annotations, data interpretation, missing files, or potential collaboration.',
    stats: [
      { label: 'Main Contact', value: 'Email' },
      { label: 'Institution', value: 'JLAU' },
      { label: 'Scope', value: 'PlantscNet' },
    ],
    highlights: [
      {
        title: 'Data Questions',
        description:
          'Contact us if a regulatory relationship, species annotation, or tissue label needs clarification.',
      },
      {
        title: 'Biological Interpretation',
        description:
          'We welcome questions about how to interpret PlantScNet results in a biological context.',
      },
      {
        title: 'Collaboration',
        description:
          'Researchers interested in plant single-cell regulatory networks can reach out for collaboration.',
      },
    ],
    actions: [],
  },
  help: {
    id: 'help',
    title: 'Module Guide',
    subtitle: 'Use each PlantscNet module for biological interpretation',
    description:
      'Use this page to understand how Browse, Search, Tools, and Download support plant single-cell regulatory interpretation across species, tissues, and genes.',
    stats: [],
    highlights: [],
    actions: [],
  },
}
