from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
import tarfile
from pathlib import Path


DEFAULT_SERVER_ROOT = Path("/public/shiny/PlantScNet/PlantscNet_server")
DEFAULT_OUT = Path("/public/shiny/PlantScNet/PlantScNet_RNA_metadata_patch")
DEFAULT_TAR = Path("/public/shiny/PlantScNet/PlantScNet_RNA_metadata_patch.tar.gz")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build a no-network scRNA metadata patch from locally prepared citation TSV.",
    )
    parser.add_argument("--server-root", type=Path, default=DEFAULT_SERVER_ROOT)
    parser.add_argument("--citation-tsv", type=Path, required=True)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--tar", type=Path, default=DEFAULT_TAR)
    return parser.parse_args()


def is_pubmed_token(value: str) -> bool:
    return bool(re.fullmatch(r"\d+(?:;\d+)*|-", value.strip()))


def load_citations(path: Path) -> dict[tuple[str, str], dict[str, str]]:
    rows = csv.DictReader(path.open(encoding="utf-8"), delimiter="\t")
    return {
        (row["species"].strip(), row["sample_id"].strip()): {
            "pubmed": row.get("pubmed", "-").strip() or "-",
            "citation": row.get("citation", "-").strip() or "-",
        }
        for row in rows
        if row.get("species") and row.get("sample_id")
    }


def rewrite_sample_info_line(line: str, species: str, citation_map: dict[tuple[str, str], dict[str, str]]) -> str:
    if not line.strip():
        return line

    if "\t" in line:
        parts = [part.strip() for part in line.rstrip("\n").split("\t")]
        if len(parts) >= 4:
            sample_id = parts[1]
            update = citation_map.get((species, sample_id))
            if update:
                parts[-1] = update["pubmed"]
            return "\t".join(parts)
        return line.rstrip("\n")

    parts = line.split()
    if len(parts) < 4:
        return line.rstrip("\n")

    sample_id = parts[1]
    update = citation_map.get((species, sample_id))
    if not update:
        return line.rstrip("\n")

    if is_pubmed_token(parts[-1]):
        parts[-1] = update["pubmed"]
    else:
        parts.append(update["pubmed"])
    return "\t".join(parts)


def main() -> None:
    args = parse_args()
    citation_map = load_citations(args.citation_tsv)

    if args.out.exists():
        shutil.rmtree(args.out)
    args.out.mkdir(parents=True, exist_ok=True)

    data_root = args.server_root / "data"
    meta_root = args.server_root / "species_meta_data"
    changed_meta = 0
    changed_sample_info = 0

    for (species, sample_id), update in sorted(citation_map.items()):
        meta_path = meta_root / species / sample_id / "meta_data.json"
        if not meta_path.exists():
            continue

        metadata = json.loads(meta_path.read_text(errors="replace"))
        old_citation = str(metadata.get("citation", "-")).strip()
        old_pubmed = "-"
        metadata["citation"] = update["citation"]
        changed_meta += int(old_citation != metadata["citation"])

        out_meta = args.out / "species_meta_data" / species / sample_id
        out_meta.mkdir(parents=True, exist_ok=True)
        (out_meta / "meta_data.json").write_text(
            json.dumps(metadata, indent=2, ensure_ascii=False) + "\n",
        )

    for sample_info in sorted(data_root.glob("*/sample_imformation.txt")):
        species = sample_info.parent.name
        rewritten = [
            rewrite_sample_info_line(line, species, citation_map)
            for line in sample_info.read_text(errors="replace").splitlines()
        ]
        original = sample_info.read_text(errors="replace").splitlines()
        if rewritten != original:
            out_dir = args.out / "data" / species
            out_dir.mkdir(parents=True, exist_ok=True)
            (out_dir / "sample_imformation.txt").write_text("\n".join(rewritten) + "\n")
            changed_sample_info += 1

    with (args.out / "summary.tsv").open("w", encoding="utf-8", newline="\n") as handle:
        writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
        writer.writerow(["species", "sample_id", "pubmed", "citation"])
        for (species, sample_id), update in sorted(citation_map.items()):
            writer.writerow([species, sample_id, update["pubmed"], update["citation"]])

    if args.tar.exists():
        args.tar.unlink()
    with tarfile.open(args.tar, "w:gz") as tar:
        tar.add(args.out, arcname=args.out.name)

    print("INPUT_ROWS", len(citation_map))
    print("CHANGED_METADATA", changed_meta)
    print("CHANGED_SAMPLE_INFO_FILES", changed_sample_info)
    print("OUT", args.out)
    print("TAR", args.tar)


if __name__ == "__main__":
    main()
