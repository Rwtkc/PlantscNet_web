from __future__ import annotations

import argparse
import json
import re
import shutil
import tarfile
from dataclasses import dataclass
from pathlib import Path


DEFAULT_SOURCE_ROOT = Path("/data1/users/shiny/MINIAC_personal_data")
DEFAULT_BUNDLE_ROOT = Path("/data1/users/shiny/PlantScNet_ATAC_export/atac_web_bundle")
DEFAULT_OUT = Path("/data1/users/shiny/PlantScNet_ATAC_metadata_patch")
DEFAULT_TAR = Path("/data1/users/shiny/PlantScNet_ATAC_metadata_patch.tar.gz")

SPECIES_CONFIG = {
    "ath": {
        "source_dir": "ath",
        "label": "Arabidopsis thaliana",
    },
    "osa": {
        "source_dir": "rice",
        "label": "Oryza sativa",
    },
    "gly": {
        "source_dir": "soybean",
        "label": "Glycine max",
    },
    "zea": {
        "source_dir": "maize",
        "label": "Zea mays",
    },
}

GSM_SERIES_OVERRIDES = {
    "GSM6599888": "GSE214131",
    "GSM6599889": "GSE214131",
    "GSM6599890": "GSE214131",
    "GSM6599891": "GSE214131",
    "GSM8865405": "GSE232863",
    "GSM8865407": "GSE232863",
    "GSM8865409": "GSE232863",
    "GSM8865411": "GSE232863",
    "GSM8865413": "GSE232863",
    "GSM8865415": "GSE232863",
}

CELL_FILE_ALIASES = {
    "GSE155304_rep1": ["sNucATAC_seq_rep1", "sNucATAC-seq_rep1"],
    "GSE155304_rep2": ["sNucATAC_seq_rep2", "sNucATAC-seq_rep2"],
}


@dataclass
class SeriesMetadata:
    title: str = "-"
    citation: str = "-"
    pubmed_id: str = "-"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export a small ATAC metadata patch with cells, citation, and PMID.",
    )
    parser.add_argument("--source-root", type=Path, default=DEFAULT_SOURCE_ROOT)
    parser.add_argument("--bundle-root", type=Path, default=DEFAULT_BUNDLE_ROOT)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--tar", type=Path, default=DEFAULT_TAR)
    parser.add_argument(
        "--geo-metadata-tsv",
        type=Path,
        required=True,
        help="Local-prepared TSV with columns: series, title, citation, pubmed.",
    )
    return parser.parse_args()


def normalize_tissue_label(sample_id: str, raw_tissue: str) -> str:
    compact_sample_id = sample_id.strip().lower()
    compact_tissue = raw_tissue.strip().replace("_", " ").replace("-", " ")
    normalized_tissue = re.sub(r"\s+", " ", compact_tissue).strip().lower()

    if compact_sample_id.startswith("gse248919_"):
        return "Seedling"
    if compact_sample_id.startswith("gsm659988") or compact_sample_id.startswith("gsm659989"):
        return "Root tip"
    if compact_sample_id.startswith("gsm88654"):
        return "Spikelet"
    if re.match(r"^gse273478_pool\d+$", compact_sample_id):
        return "Seedling"
    if compact_sample_id.startswith("gse155178_"):
        if "b73mo17" in compact_sample_id or "leaf2" in compact_sample_id:
            return "Seedling"
        if "axillarybud" in compact_sample_id:
            return "Axillary bud"
        if "crownroot" in compact_sample_id:
            return "Crown root"
        if "root" in compact_sample_id:
            return "Root"
        if "tassel" in compact_sample_id:
            return "Tassel"
        if "ear" in compact_sample_id:
            return "Ear"

    if "spikelet" in normalized_tissue:
        return "Spikelet"
    if "seed" in normalized_tissue:
        return "Seed"
    if "nodule" in normalized_tissue:
        return "Nodule"

    known_tissues = {
        "leaf": "Leaf",
        "root": "Root",
        "hypocotyl": "Hypocotyl",
        "pod": "Pod",
        "ear": "Ear",
        "tassel": "Tassel",
        "seedling": "Seedling",
    }
    if normalized_tissue in known_tissues:
        return known_tissues[normalized_tissue]

    return compact_tissue[:1].upper() + compact_tissue[1:]


def extract_dataset_id(sample_id: str) -> str:
    match = re.search(r"(GSE\d+|GSM\d+|SRP\d+|SRX\d+|DRP\d+|PRJNA\d+)", sample_id)
    return match.group(1) if match else sample_id


def extract_series_id(sample_id: str) -> str | None:
    match = re.search(r"(GSE\d+)", sample_id)
    if match:
        return match.group(1)

    gsm_match = re.search(r"(GSM\d+)", sample_id)
    if gsm_match:
        return GSM_SERIES_OVERRIDES.get(gsm_match.group(1))

    return None


def load_geo_metadata(gse_ids: set[str], metadata_tsv: Path) -> dict[str, SeriesMetadata]:
    loaded: dict[str, SeriesMetadata] = {}
    if not metadata_tsv.exists():
        raise FileNotFoundError(f"Missing GEO metadata TSV: {metadata_tsv}")

    lines = metadata_tsv.read_text(errors="replace").splitlines()
    if not lines:
        raise ValueError(f"Empty GEO metadata TSV: {metadata_tsv}")

    header = lines[0].split("\t")
    for line in lines[1:]:
        if not line.strip():
            continue
        row = dict(zip(header, line.split("\t")))
        series = row.get("series", "").strip()
        if not series:
            continue
        loaded[series] = SeriesMetadata(
            title=row.get("title", "-").strip() or "-",
            citation=row.get("citation", "-").strip() or "-",
            pubmed_id=row.get("pubmed", "-").strip() or "-",
        )

    metadata: dict[str, SeriesMetadata] = {}
    for gse_id in sorted(gse_ids):
        metadata[gse_id] = loaded.get(gse_id, SeriesMetadata())
    return metadata


def read_sample_info(sample_info_path: Path) -> list[tuple[str, str, str, str]]:
    rows: list[tuple[str, str, str, str]] = []
    for line in sample_info_path.read_text(errors="replace").splitlines():
        if not line.strip():
            continue
        parts = line.split("\t") if "\t" in line else line.split()
        if len(parts) < 4:
            continue
        rows.append((parts[0], parts[1], parts[2], parts[3]))
    return rows


def count_data_rows(path: Path) -> int:
    count = 0
    with path.open(errors="replace") as handle:
        for index, line in enumerate(handle):
            if not line.strip():
                continue
            lowered = line.lower()
            if index == 0 and ("barcode" in lowered or lowered.startswith("cell")):
                continue
            count += 1
    return count


def find_cell_count(source_root: Path, species_id: str, sample_id: str) -> str:
    source_dir = source_root / SPECIES_CONFIG[species_id]["source_dir"]
    series_id = extract_series_id(sample_id)
    dataset_dirs = []
    if series_id:
        dataset_dirs.extend(source_dir.glob(f"standardized/{series_id}_2kb"))
    dataset_dirs.extend(source_dir.glob("standardized/*_2kb"))

    seen: set[Path] = set()
    candidates: list[Path] = []
    sample_aliases = [sample_id, *CELL_FILE_ALIASES.get(sample_id, [])]

    for dataset_dir in dataset_dirs:
        if dataset_dir in seen or not dataset_dir.exists():
            continue
        seen.add(dataset_dir)
        for alias in sample_aliases:
            candidates.extend(dataset_dir.glob(f"cluster_tables/{alias}_cell_clusters.tsv"))
            candidates.extend(dataset_dir.glob(f"results/cluster_tables/{alias}_cell_clusters.tsv"))
            candidates.extend(dataset_dir.glob(f"cluster_peaks/raw/{alias}_cluster_assignments.tsv"))
            candidates.extend(dataset_dir.glob(f"raw_input/{alias}/singlecell.csv"))
            candidates.extend(dataset_dir.rglob(f"{alias}*cell*cluster*.tsv"))
            candidates.extend(dataset_dir.rglob(f"{alias}*cluster_assignments.tsv"))

    existing_candidates = [path for path in dict.fromkeys(candidates) if path.exists()]
    if not existing_candidates:
        return "-"

    count = count_data_rows(existing_candidates[0])
    return str(count) if count > 0 else "-"


def write_meta_data(
    meta_dir: Path,
    species_id: str,
    sample_id: str,
    series_metadata: SeriesMetadata,
    cells: str,
) -> None:
    meta_dir.mkdir(parents=True, exist_ok=True)
    meta = {
        "organism": SPECIES_CONFIG[species_id]["label"],
        "experimentType": "single-cell/nucleus ATAC-seq",
        "platform": "scATAC/snATAC-seq",
        "datasetId": extract_dataset_id(sample_id),
        "citation": series_metadata.citation,
        "cells": cells,
        "modality": "scATAC-seq",
    }
    (meta_dir / "meta_data.json").write_text(
        json.dumps(meta, indent=2, ensure_ascii=False) + "\n",
    )


def build_patch(args: argparse.Namespace) -> None:
    if args.out.exists():
        shutil.rmtree(args.out)
    args.out.mkdir(parents=True, exist_ok=True)

    sample_records: list[tuple[str, str, str, str, str]] = []
    gse_ids: set[str] = set()

    for species_id in SPECIES_CONFIG:
        sample_info_path = args.bundle_root / "data_atac" / species_id / "sample_imformation.txt"
        if not sample_info_path.exists():
            continue
        for file_name, sample_id, tissue, pubmed_id in read_sample_info(sample_info_path):
            series_id = extract_series_id(sample_id)
            if series_id:
                gse_ids.add(series_id)
            sample_records.append((species_id, file_name, sample_id, tissue, pubmed_id))

    geo_metadata = load_geo_metadata(gse_ids, args.geo_metadata_tsv)
    summary_rows: list[list[str]] = []

    grouped_rows: dict[str, list[tuple[str, str, str, str]]] = {}
    for species_id, file_name, sample_id, tissue, _pubmed_id in sample_records:
        series_id = extract_series_id(sample_id)
        series_metadata = geo_metadata.get(series_id or "", SeriesMetadata())
        cells = find_cell_count(args.source_root, species_id, sample_id)
        tissue = normalize_tissue_label(sample_id, tissue)

        grouped_rows.setdefault(species_id, []).append(
            (file_name, sample_id, tissue, series_metadata.pubmed_id),
        )
        write_meta_data(
            args.out / "species_meta_data_atac" / species_id / sample_id,
            species_id,
            sample_id,
            series_metadata,
            cells,
        )
        summary_rows.append(
            [
                species_id,
                sample_id,
                tissue,
                cells,
                series_id or "-",
                series_metadata.pubmed_id,
                series_metadata.citation,
            ],
        )

    for species_id, rows in grouped_rows.items():
        data_dir = args.out / "data_atac" / species_id
        data_dir.mkdir(parents=True, exist_ok=True)
        with (data_dir / "sample_imformation.txt").open("w") as handle:
            for row in rows:
                handle.write("\t".join(row) + "\n")

    with (args.out / "summary.tsv").open("w") as handle:
        handle.write("species\tsample_id\ttissue\tcells\tseries\tpubmed\tcitation\n")
        for row in summary_rows:
            handle.write("\t".join(row) + "\n")

    missing_cells = [row for row in summary_rows if row[3] == "-"]
    missing_pubmed = [row for row in summary_rows if row[5] == "-"]
    print("TOTAL_SAMPLES", len(summary_rows))
    print("MISSING_CELLS", len(missing_cells))
    print("MISSING_PUBMED", len(missing_pubmed))
    print("OUT", args.out)

    if args.tar.exists():
        args.tar.unlink()
    with tarfile.open(args.tar, "w:gz") as tar:
        tar.add(args.out, arcname=args.out.name)
    print("TAR", args.tar)


def main() -> None:
    build_patch(parse_args())


if __name__ == "__main__":
    main()
