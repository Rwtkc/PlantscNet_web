from __future__ import annotations

import argparse
import re
import shutil
from datetime import datetime
from pathlib import Path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Patch deployed PlantScNet ATAC sample_imformation.txt tissue labels.",
    )
    parser.add_argument(
        "--server-root",
        type=Path,
        default=Path.cwd(),
        help="PlantScNet server root containing data_atac/.",
    )
    parser.add_argument(
        "--backup-root",
        type=Path,
        default=None,
        help="Optional backup root. Defaults to ../atac_tissue_backups/<timestamp>.",
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


def split_sample_line(line: str) -> list[str]:
    if "\t" in line:
        return line.rstrip("\n").split("\t")
    return line.rstrip("\n").split()


def patch_sample_info(sample_info_path: Path) -> list[tuple[str, str, str]]:
    changed_rows: list[tuple[str, str, str]] = []
    patched_lines: list[str] = []

    for raw_line in sample_info_path.read_text(errors="replace").splitlines():
        if not raw_line.strip():
            continue

        columns = split_sample_line(raw_line)
        if len(columns) < 4:
            patched_lines.append(raw_line)
            continue

        sample_id = columns[1]
        old_tissue = columns[2]
        new_tissue = normalize_tissue_label(sample_id, old_tissue)

        if new_tissue != old_tissue:
            changed_rows.append((sample_id, old_tissue, new_tissue))
            columns[2] = new_tissue

        patched_lines.append("\t".join(columns))

    sample_info_path.write_text("\n".join(patched_lines) + "\n")
    return changed_rows


def main() -> None:
    args = parse_args()
    server_root = args.server_root.resolve()
    data_atac = server_root / "data_atac"

    if not data_atac.exists():
        raise SystemExit(f"Missing data_atac directory: {data_atac}")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_root = args.backup_root or (server_root.parent / "atac_tissue_backups" / timestamp)
    backup_root.mkdir(parents=True, exist_ok=True)

    total_changes = 0

    for sample_info_path in sorted(data_atac.glob("*/sample_imformation.txt")):
        species_id = sample_info_path.parent.name
        backup_path = backup_root / "data_atac" / species_id / "sample_imformation.txt"
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(sample_info_path, backup_path)

        changes = patch_sample_info(sample_info_path)
        total_changes += len(changes)

        if changes:
            print(f"==== {species_id} {len(changes)} changed ====")
            for sample_id, old_tissue, new_tissue in changes:
                print(f"{sample_id}\t{old_tissue}\t{new_tissue}")

    print(f"BACKUP\t{backup_root}")
    print(f"TOTAL_CHANGED\t{total_changes}")


if __name__ == "__main__":
    main()
