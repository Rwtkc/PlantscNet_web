from __future__ import annotations

import argparse
import json
import re
import shutil
import tarfile
from pathlib import Path


DEFAULT_SOURCE_ROOT = Path("/data1/users/shiny/MINIAC_personal_data")
DEFAULT_INTEGRATED_ROOT = Path("/data1/users/shiny/PlantscNet_atac")
DEFAULT_OUT = Path("/data1/users/shiny/PlantScNet_ATAC_export/atac_web_bundle")
DEFAULT_TAR = Path("/data1/users/shiny/PlantScNet_ATAC_export/atac_web_bundle.tar.gz")

SPECIES_CONFIG = {
    "ath": {
        "source_dir": "ath",
        "label": "Arabidopsis thaliana",
        "integrated": "ath_atac/outputs/top2w_scatac_only_upper_20260531/step4/final_regulatory_with_probability.tsv",
    },
    "osa": {
        "source_dir": "rice",
        "label": "Oryza sativa",
        "integrated": "osa_atac/outputs/top2w_upper_20260531/step4/final_regulatory_with_probability.tsv",
    },
    "gly": {
        "source_dir": "soybean",
        "label": "Glycine max",
        "integrated": "gly_atac/outputs/top2w_20260529/step4/final_regulatory_with_probability.tsv",
    },
    "zea": {
        "source_dir": "maize",
        "label": "Zea mays",
        "integrated": "zea_atac/outputs/step4_pcg/final_regulatory_with_probability.tsv",
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Export PlantScNet ATAC sample and integrated networks for web deployment.",
    )
    parser.add_argument("--source-root", type=Path, default=DEFAULT_SOURCE_ROOT)
    parser.add_argument("--integrated-root", type=Path, default=DEFAULT_INTEGRATED_ROOT)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--tar", type=Path, default=DEFAULT_TAR)
    parser.add_argument(
        "--exclude-gse155304",
        action="store_true",
        help="Exclude the two Arabidopsis GSE155304 sNucATAC samples.",
    )
    return parser.parse_args()


def extract_dataset_id(sample_id: str, source_path: Path) -> str:
    pattern = r"(GSE\d+|GSM\d+|SRP\d+|SRX\d+|DRP\d+|PRJNA\d+)"
    for value in (sample_id, str(source_path)):
        match = re.search(pattern, value)
        if match:
            return match.group(1)
    return sample_id


def read_sample_tissue(sample_info_path: Path) -> tuple[str, str, str] | None:
    lines = [
        line.rstrip("\n")
        for line in sample_info_path.read_text(errors="replace").splitlines()
        if line.strip()
    ]
    if len(lines) < 2:
        return None

    header = lines[0].split("\t")
    values = lines[1].split("\t")
    row = dict(zip(header, values))

    file_name = row.get("regulatory_file") or row.get("file_name") or values[0]
    sample_id = row.get("sample_id") or row.get("sample_name") or values[1]
    tissue = row.get("tissue") or (values[2] if len(values) > 2 else "-")
    return file_name, sample_id, tissue


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


def resolve_network_file(sample_info_path: Path, file_name: str) -> Path:
    source_network = sample_info_path.parent / file_name
    if source_network.exists():
        return source_network

    candidates = sorted(sample_info_path.parent.glob("*_ranked_scplant_like.tsv"))
    if candidates:
        return candidates[0]

    raise FileNotFoundError(f"Missing sample network for {sample_info_path}")


def write_meta_data(meta_dir: Path, label: str, dataset_id: str) -> None:
    meta_dir.mkdir(parents=True, exist_ok=True)
    meta = {
        "organism": label,
        "experimentType": "single-cell/nucleus ATAC-seq",
        "platform": "scATAC/snATAC-seq",
        "datasetId": dataset_id,
        "citation": "-",
        "cells": "-",
        "modality": "scATAC-seq",
    }
    (meta_dir / "meta_data.json").write_text(
        json.dumps(meta, indent=2, ensure_ascii=False) + "\n",
    )


def export_species(
    species_id: str,
    config: dict[str, str],
    source_root: Path,
    integrated_root: Path,
    out: Path,
    exclude_gse155304: bool,
) -> tuple[list[str], list[list[str]]]:
    data_dir = out / "data_atac" / species_id
    meta_species_dir = out / "species_meta_data_atac" / species_id
    data_dir.mkdir(parents=True, exist_ok=True)
    meta_species_dir.mkdir(parents=True, exist_ok=True)

    source_dir = source_root / config["source_dir"]
    sample_info_files = sorted(
        source_dir.glob("standardized/*_2kb/results/per_sample/*/ranked/*_file_sample_tissue.tsv"),
    )

    sample_rows: list[tuple[str, str, str, str]] = []
    manifest_rows: list[list[str]] = []

    for sample_info_path in sample_info_files:
        dataset_dir = sample_info_path.parts[sample_info_path.parts.index("standardized") + 1]
        if exclude_gse155304 and dataset_dir == "GSE155304_2kb":
            continue

        parsed = read_sample_tissue(sample_info_path)
        if not parsed:
            continue

        original_file_name, sample_id, tissue = parsed
        tissue = normalize_tissue_label(sample_id, tissue)
        source_network = resolve_network_file(sample_info_path, original_file_name)
        web_file_name = f"atac_{sample_id}_ranked_scplant_like.tsv"
        shutil.copy2(source_network, data_dir / web_file_name)

        dataset_id = extract_dataset_id(sample_id, source_network)
        sample_rows.append((web_file_name, sample_id, tissue, "-"))
        write_meta_data(meta_species_dir / sample_id, config["label"], dataset_id)

        manifest_rows.append(
            [species_id, config["label"], sample_id, tissue, dataset_id, str(source_network)],
        )

    with (data_dir / "sample_imformation.txt").open("w") as handle:
        for row in sorted(sample_rows, key=lambda value: value[1]):
            handle.write("\t".join(row) + "\n")

    integrated = integrated_root / config["integrated"]
    if not integrated.exists():
        raise FileNotFoundError(f"Missing integrated network: {integrated}")
    shutil.copy2(integrated, data_dir / "final_regulatory_with_probability.tsv")

    summary_row = [species_id, config["label"], str(len(sample_rows)), str(integrated)]
    return summary_row, manifest_rows


def write_bundle(args: argparse.Namespace) -> None:
    if args.out.exists():
        shutil.rmtree(args.out)
    args.out.mkdir(parents=True, exist_ok=True)

    summary_rows: list[list[str]] = []
    manifest_rows: list[list[str]] = []

    for species_id, config in SPECIES_CONFIG.items():
        summary_row, species_manifest_rows = export_species(
            species_id,
            config,
            args.source_root,
            args.integrated_root,
            args.out,
            args.exclude_gse155304,
        )
        summary_rows.append(summary_row)
        manifest_rows.extend(species_manifest_rows)

    with (args.out / "summary.tsv").open("w") as handle:
        handle.write("species\tlabel\tsamples\tintegrated_network\n")
        for row in summary_rows:
            handle.write("\t".join(row) + "\n")

    with (args.out / "manifest.tsv").open("w") as handle:
        handle.write("species\tlabel\tsample_id\ttissue\tdataset_id\tsource_network\n")
        for row in manifest_rows:
            handle.write("\t".join(row) + "\n")

    args.tar.parent.mkdir(parents=True, exist_ok=True)
    if args.tar.exists():
        args.tar.unlink()
    with tarfile.open(args.tar, "w:gz") as tar:
        tar.add(args.out, arcname="atac_web_bundle")

    print("SUMMARY")
    for row in summary_rows:
        print("\t".join(row))
    print("TOTAL", sum(int(row[2]) for row in summary_rows))
    print("OUT", args.out)
    print("TAR", args.tar)


def main() -> None:
    write_bundle(parse_args())


if __name__ == "__main__":
    main()
