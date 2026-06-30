from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path


DEFAULT_SERVER_ROOT = Path("/public/shiny/PlantScNet/PlantscNet_server")
DEFAULT_OUT = Path("/public/shiny/PlantScNet/rna_metadata_summary.tsv")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export current PlantScNet scRNA metadata summary.")
    parser.add_argument("--server-root", type=Path, default=DEFAULT_SERVER_ROOT)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    return parser.parse_args()


def read_sample_info(path: Path) -> list[tuple[str, str, str, str]]:
    rows: list[tuple[str, str, str, str]] = []
    for line in path.read_text(errors="replace").splitlines():
        if not line.strip():
            continue
        if "\t" in line:
            parts = [part.strip() for part in line.split("\t")]
            if len(parts) >= 4:
                rows.append((parts[0], parts[1], " ".join(parts[2:-1]), parts[-1]))
            continue

        parts = line.split()
        if len(parts) >= 4:
            rows.append((parts[0], parts[1], " ".join(parts[2:-1]), parts[-1]))
    return rows


def main() -> None:
    args = parse_args()
    data_root = args.server_root / "data"
    meta_root = args.server_root / "species_meta_data"
    output_rows = []

    for sample_info in sorted(data_root.glob("*/sample_imformation.txt")):
        species = sample_info.parent.name
        for _file_name, sample_id, _tissue, pubmed in read_sample_info(sample_info):
            meta_path = meta_root / species / sample_id / "meta_data.json"
            if not meta_path.exists():
                continue
            metadata = json.loads(meta_path.read_text(errors="replace"))
            output_rows.append(
                [
                    species,
                    sample_id,
                    str(metadata.get("datasetId", sample_id)).strip() or sample_id,
                    pubmed,
                    str(metadata.get("citation", "-")).strip() or "-",
                ],
            )

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8", newline="\n") as handle:
        writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
        writer.writerow(["species", "sample_id", "dataset_id", "pubmed", "current_citation"])
        writer.writerows(output_rows)

    print("TOTAL", len(output_rows))
    print("OUT", args.out)


if __name__ == "__main__":
    main()
