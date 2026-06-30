export type HelpImage = {
  src: string
  alt: string
  caption: string
}

export type HelpTextBlock = {
  title: string
  summary: string
  paragraphs: string[]
  tone?: 'rna' | 'integrated' | 'atac' | 'neighborhood' | 'hub' | 'download'
}

export type HelpSection = {
  eyebrow: string
  title: string
  summary: string
  images: HelpImage[]
  steps: string[]
  textBlocks?: HelpTextBlock[]
  notes?: string[]
}

export const helpKeywordPattern =
  /(PlantScNet|TF-target|scRNA-seq|scATAC-seq|single-cell RNA-seq|single-cell chromatin|candidate regulatory relationships|candidate regulatory relationship|putative regulatory edge|putative TF-target edge|cross-sample support|chromatin accessibility|motif-based evidence|motif annotations|promoter overlap|GRNBoost2|Arboreto|pySCENIC ctx|SCENIC|cisTarget|XGBoost|gold-standard|importance score|model probability score|cluster support|total supporting peaks|score rank percentile|log2|MEME motif|cisTarget ranking|Feather ranking|TF list file|final regulatory network table|Fill Example|Sample network|Neighborhood|Context Hub|AUC|P-value|Integrated|Sample|DEGs)/g

export const workflowSteps = [
  {
    title: 'Choose a biological context',
    text: 'Start with a species, data layer, tissue, or sample in Browse.',
  },
  {
    title: 'Check TF-target evidence',
    text: 'Use Search when you already have a transcription factor or target gene.',
  },
  {
    title: 'Prioritize genes',
    text: 'Use Neighborhood or Context Hub to turn seed genes, marker genes, or DEGs into ranked candidates.',
  },
  {
    title: 'Export resources',
    text: 'Download network tables and supporting files for downstream analysis and figure preparation.',
  },
]

const inferenceTextBlocks: HelpTextBlock[] = [
  {
    title: 'scRNA-seq sample-level candidate networks',
    tone: 'rna',
    summary:
      'PlantScNet preserves sample context by building candidate TF-target networks from individual public plant scRNA-seq samples.',
    paragraphs: [
      'Public plant single-cell RNA-seq datasets are organized into sample-level expression matrices and processed before network construction.',
      'For each sample, PlantScNet uses GRNBoost2, a tree-based gene regulatory network inference method, through its Arboreto implementation to infer an initial TF-target adjacency table from the expression matrix.',
      'The initial adjacency is refined through pySCENIC ctx, the motif-enrichment and regulon-pruning step from the SCENIC workflow. This step uses species-specific cisTarget ranking resources, which rank motifs across genes, together with motif annotations before postprocessing exports sample-level TF-target tables.',
      'In the RNA sample network, the importance score is the upstream GRNBoost2/Arboreto TF-target importance retained after pySCENIC ctx motif-based pruning. It is useful for ranking candidate edges within the same sample workflow, but it should not be read as a P-value, probability, or direct binding measurement.',
      'The resulting sample-level network represents candidate regulatory relationships for that sample, tissue, developmental stage, or condition.',
      'These networks are inferred regulatory hypotheses and should not be interpreted as direct experimental evidence of binding or regulation.',
    ],
  },
  {
    title: 'Species-level integrated RNA networks',
    tone: 'integrated',
    summary:
      'PlantScNet also integrates evidence across multiple scRNA-seq samples from the same species to produce species-level candidate networks.',
    paragraphs: [
      'PlantScNet does not only display one-sample inference results. Candidate TF-target edges that recur or receive support across samples are organized for species-level integration.',
      'Cross-sample support is used to increase confidence in putative TF-target edges that are repeatedly observed across tissues, conditions, datasets, or projects.',
      'Candidate edges can be converted into feature matrices describing sample support, project support, recurrence, nonzero fraction, and other cross-sample evidence patterns.',
      'When suitable known or orthology-projected gold-standard regulatory relationships are available, XGBoost is used to assign probability-like scores or priority rankings to candidate TF-target edges.',
      'For the final integrated network table, PlantScNet retains prioritized candidate edges with a model probability score of 0.5 or higher.',
      'A higher model score indicates stronger prioritization of a predicted or putative regulatory edge, not direct experimental evidence for a regulatory interaction.',
      'Species-level integrated networks are intended for browsing, searching, downloading, and prioritizing candidate regulatory relationships beyond a single sample context.',
      'Current integrated RNA outputs cover multiple representative plant species in the release; the Help page avoids fixing a count because release files may be updated independently of the text.',
    ],
  },
  {
    title: 'scATAC-seq-derived candidate regulatory networks',
    tone: 'atac',
    summary:
      'The scATAC workflow converts chromatin accessibility and motif evidence into promoter-proximal candidate TF-target relationships.',
    paragraphs: [
      'Each scATAC-seq sample is processed through a single-cell chromatin workflow, including peak matrix construction, TF-IDF normalization, LSI dimensional reduction, graph-based clustering, and detection of cluster-enriched open chromatin regions.',
      'Open regions are associated with genes through promoter overlap or nearby-gene annotation. A promoter-overlapping open region provides chromatin accessibility evidence for a candidate target gene.',
      'The same open regions are scanned or matched against TF motif annotations. If a motif mapped to a TF occurs in a target-associated open region, PlantScNet records a putative TF-target edge.',
      'ATAC-derived edges are aggregated across clusters within a sample. For each TF-target edge, cluster support records how many clusters support the edge, and total supporting peaks records the total number of supporting open peaks across those clusters.',
      'The sample-level ATAC ranking score is calculated as importance score = cluster support * log2(1 + total supporting peaks). This empirical score combines repeated cluster support and supporting peak count for candidate edge prioritization.',
      'ATAC-derived importance score, score rank percentile, cluster support, total supporting peaks, and related features can also be used in XGBoost scoring when suitable gold-standard or projected regulatory relationships are available.',
      'These networks provide chromatin accessibility evidence and motif-based evidence for candidate edge prioritization.',
    ],
  },
]

const toolTextBlocks: HelpTextBlock[] = [
  {
    title: 'Neighborhood',
    tone: 'neighborhood',
    summary:
      'Neighborhood is a direct-neighbor gene prioritization method for seed genes associated with a biological process, phenotype, tissue state, or candidate pathway.',
    paragraphs: [
      'The submitted genes are treated as guide genes. PlantScNet first keeps the input genes that are present in the selected regulatory network.',
      'For every network gene, the method sums the edge weights connecting that gene to valid guide genes. In integrated networks, the weight reflects species-level regulatory support; in sample networks, it reflects sample-level network support.',
      'Prioritized submitted genes are the valid input genes ranked by their connectivity to the rest of the input set. This helps evaluate whether the submitted genes form a coherent network neighborhood.',
      'Top new candidate genes are non-input genes directly connected to one or more guide genes. Higher score and higher support indicate stronger direct network evidence.',
      'The AUC and P-value summarize whether the submitted guide genes are more connected than background genes. A high AUC suggests that the input gene set is suitable for network-based candidate discovery.',
    ],
  },
  {
    title: 'Context Hub',
    tone: 'hub',
    summary:
      'Context Hub is designed for context gene sets such as DEGs, marker genes, or stress-responsive genes, where an upstream regulator may not itself be strongly differentially expressed.',
    paragraphs: [
      'The submitted genes are treated as the context set. PlantScNet identifies which of these genes are present in the selected network before calculating enrichment.',
      'Each network gene is evaluated as a potential hub. The method counts the total number of network neighbors of that hub and how many of those neighbors belong to the submitted context set.',
      'A hypergeometric enrichment test is used to ask whether the hub neighborhood contains more input genes than expected by chance.',
      'Genes with smaller P-values and more input links are ranked higher as context-associated hubs. These hubs are candidate regulators or organizing genes for the submitted biological context.',
      'The Input gene? column indicates whether the hub itself was submitted. Hub links is the total network degree of the hub, and Input links is the number of submitted context genes found in its neighborhood.',
    ],
  },
]

const downloadTextBlocks: HelpTextBlock[] = [
  {
    title: 'Motif and transcription factor resources',
    tone: 'download',
    summary:
      'The MEME motif and TF list files document the motif universe and transcription factors used by the species workflow.',
    paragraphs: [
      'The MEME motif file stores transcription factor binding motif position weight matrices in MEME format. It is used when motif matching, motif enrichment, or motif-based regulatory annotation needs to be reproduced outside the web interface.',
      'The TF list file defines the transcription factor set used for the species workflow. It helps users check which TF genes were considered during RNA GRNBoost2/pySCENIC inference or motif-based regulatory annotation.',
    ],
  },
  {
    title: 'cisTarget ranking resource',
    tone: 'download',
    summary:
      'The Feather ranking archive is the gene-by-motif cisTarget ranking resource used for motif enrichment and pruning workflows.',
    paragraphs: [
      'The cisTarget ranking archive is a compressed Feather ranking file. It stores motif rankings across genes and supports pySCENIC ctx-like motif enrichment, regulon pruning, and species-specific motif evidence checks.',
      'This file is mainly needed when rebuilding or auditing the cisTarget database layer rather than when simply browsing PlantScNet network edges.',
    ],
  },
  {
    title: 'Final regulatory network table',
    tone: 'download',
    summary:
      'The final regulatory network table is the species-level integrated TF-target network intended for downstream network analysis.',
    paragraphs: [
      'The final regulatory network table contains prioritized TF-target edges and probability-like model scores when an integrated XGBoost workflow is available for the species or data layer.',
      'In integrated network releases, the downloadable table keeps candidate edges with a model probability score of 0.5 or higher.',
      'Use this table for external visualization, enrichment analysis, graph analysis, or candidate regulator prioritization. The edges should still be interpreted as predicted or putative regulatory relationships, not direct experimental evidence.',
    ],
  },
]

export const helpSections: HelpSection[] = [
  {
    eyebrow: 'Browse',
    title: 'Explore species, tissues, samples, and network evidence',
    summary:
      'Browse is the starting point for checking whether PlantScNet contains the plant system and regulatory layer needed for a biological question.',
    textBlocks: inferenceTextBlocks,
    images: [
      {
        src: 'help/browse-overview.png',
        alt: 'Browse page overview showing the species and tissue explorer.',
        caption:
          'Browse overview with data layer, species, tissue, and sample organization.',
      },
      {
        src: 'help/browse-species-detail.png',
        alt: 'Browse species detail view showing regulatory network information.',
        caption:
          'Species detail view for inspecting available regulatory evidence before gene-level analysis.',
      },
      {
        src: 'help/browse-network-preview.png',
        alt: 'Browse network preview showing a force-directed TF-target regulatory network.',
        caption:
          'Network preview showing TF-target regulatory links after zooming into the force-directed graph.',
      },
    ],
    steps: [
      'Open the Browse page and choose the data layer first. Use scRNA for expression-derived regulatory networks and scATAC for chromatin-accessibility-derived regulatory evidence.',
      'Keep Browse by species selected when you want to start from a plant species. Switch to Browse by tissue when the biological question is tissue-centered.',
      'Click a species name in the left explorer to open its summary. The main panel shows tissue composition, sample records, and available regulatory evidence.',
      'If samples are listed under the species, click a sample ID to inspect sample-level network information and sample metadata.',
      'Scroll to the network preview to inspect the force-directed TF-target graph. Use Fit view, mouse wheel zoom, and dragging to focus on dense or peripheral network regions.',
      'Use the network preview and table to identify TF-target relationships that are worth checking later in Search or downloading for downstream analysis.',
    ],
    notes: [
      'Integrated networks summarize species-level evidence, while sample networks preserve sample-specific context.',
    ],
  },
  {
    eyebrow: 'Search',
    title: 'Look up candidate transcription factors or target genes',
    summary:
      'Search is designed for gene-centered questions. It helps determine whether a TF or target appears in the integrated network or supporting sample-level networks.',
    images: [
      {
        src: 'help/search-form.png',
        alt: 'Search page form for querying a transcription factor or target gene.',
        caption: 'Search form for choosing the data layer, species, and query gene.',
      },
      {
        src: 'help/search-results.png',
        alt: 'Search result table showing sample-level TF-target matches.',
        caption:
          'Search results separate integrated species evidence from sample-level matches.',
      },
    ],
    steps: [
      'Open the Search page and select the data layer that matches your question: scRNA or scATAC.',
      'Use Search by TF when your query is a transcription factor. Use Search by Target when your query is a possible downstream gene.',
      'Select one species from the species picker. The search is performed within this species only.',
      'Enter one gene symbol in the query box. If you are unsure about the input format, click Fill Example to load a valid, editable example for the selected data layer.',
      'Use Fill Example when testing the page or checking whether the current data layer can return results, then replace the example gene with your own query.',
      'Click Search by TF or Search by Target to submit the query.',
      'Read the integrated species network section first. If an integrated network is not available, continue with the sample-level matches.',
      'Use the sample-level table to see which samples, tissues, TFs, targets, and scores support the query relationship.',
    ],
    notes: [
      'Scores should be interpreted as network support, not as direct experimental evidence of binding or regulation.',
    ],
  },
  {
    eyebrow: 'Tools',
    title: 'Prioritize candidate genes with network-based methods',
    summary:
      'Tools provides two network-based analyses for interpreting seed genes, marker genes, or differential genes within a selected PlantScNet scRNA or scATAC regulatory network.',
    textBlocks: toolTextBlocks,
    images: [
      {
        src: 'help/tools-form-example.png',
        alt: 'Tools page with selected species and example genes.',
        caption: 'Choose a data layer, method, network source, species, and gene list.',
      },
      {
        src: 'help/tools-neighborhood-results.png',
        alt: 'Neighborhood result table with prioritized submitted genes and new candidates.',
        caption:
          'Neighborhood ranks submitted genes and new candidates by direct network support.',
      },
      {
        src: 'help/tools-context-hub-results.png',
        alt: 'Context Hub result table with ranked hub genes and p-values.',
        caption:
          'Context Hub identifies hub genes whose network neighbors are enriched for the input gene set.',
      },
    ],
    steps: [
      'Open the Tools page and choose the data layer, method, and network source before entering genes.',
      'Choose Integrated when you want to analyze the species-level network. Choose Sample when the question is tied to one sample or tissue context.',
      'Select the species. If Sample is selected, also choose the sample network from the sample picker.',
      'Paste one gene per line in the Gene list box. You can also click Fill Example to load five editable example genes for the selected species.',
      'For page testing, Fill Example provides a quick input gene list; in Sample mode, still confirm that a Sample network is selected before running the tool.',
      'Choose Neighborhood when you have seed genes and want to rank submitted genes together with new nearby candidate genes.',
      'Choose Context Hub when you have marker genes, DEGs, or another context gene set and want to identify hub genes enriched for that input set.',
      'Click Run prioritization and wait until the status changes to Complete.',
      'Use the result tables, pagination, and Export CSV or Export TXT buttons to save ranked genes for downstream annotation or experimental candidate selection.',
    ],
    notes: [
      'Neighborhood is best for a seed list of known or suspected genes. Context Hub is best for a broader context list such as DEGs or marker genes.',
      'Tools analyze the selected PlantScNet network. They do not generate the underlying regulatory network; network construction is described in the Browse network evidence notes.',
      'These tools generate network-supported hypotheses and should be interpreted together with biological knowledge and follow-up experimental evidence.',
    ],
  },
  {
    eyebrow: 'Download',
    title: 'Retrieve network resources for downstream analysis',
    summary:
      'Download gathers species-level resources such as final regulatory networks, TF lists, motif files, and ranking-related files.',
    textBlocks: downloadTextBlocks,
    images: [
      {
        src: 'help/download-overview.png',
        alt: 'Download page showing species download bundles.',
        caption: 'Download overview listing species-level resource bundles.',
      },
      {
        src: 'help/download-expanded.png',
        alt: 'Expanded species download card showing available files.',
        caption:
          'Expanded species view with available files and direct download actions.',
      },
    ],
    steps: [
      'Open the Download page and find the species you want to analyze.',
      'Click the species row to expand its available download bundle.',
      'Check the status label beside each file. Available files can be downloaded directly, while unavailable files are shown as Not available.',
      'Download the final regulatory network table when you need the integrated TF-target table for downstream graph analysis, visualization, enrichment analysis, or candidate prioritization outside the web page.',
      'Download the MEME motif file and TF list file when you need the motif library and TF universe used by the species workflow.',
      'Download the cisTarget ranking archive when you need the ranking resource for motif enrichment, regulon pruning, or database-layer auditing.',
    ],
  },
]
