from __future__ import annotations

import argparse
import gzip
import json
import re
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path


DEFAULT_SERIES = [
    "GSE155178",
    "GSE155304",
    "GSE173834",
    "GSE214131",
    "GSE226826",
    "GSE232863",
    "GSE248919",
    "GSE270392",
    "GSE273478",
]
DEFAULT_OUT = Path("D:/OBS录像/桌面/PlantScNet_ATAC_geo_metadata.tsv")
DEFAULT_CACHE = Path("D:/OBS录像/桌面/PlantScNet_GEO_cache")
NCBI_TOOL = "PlantScNetMetadata"
NCBI_EMAIL = "rnainfor@gmail.com"


@dataclass
class SeriesMetadata:
    series: str
    title: str = "-"
    citation: str = "-"
    pubmed: str = "-"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch PlantScNet ATAC GEO series citation and PMID metadata locally.",
    )
    parser.add_argument("--series", nargs="*", default=DEFAULT_SERIES)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--cache", type=Path, default=DEFAULT_CACHE)
    return parser.parse_args()


def geo_ftp_series_prefix(gse_id: str) -> str:
    return f"{gse_id[:6]}nnn"


def download_geo_soft(gse_id: str, cache_dir: Path) -> Path | None:
    cache_dir.mkdir(parents=True, exist_ok=True)
    soft_path = cache_dir / f"{gse_id}_family.soft.gz"
    if soft_path.exists() and soft_path.stat().st_size > 0:
        return soft_path

    url = (
        "https://ftp.ncbi.nlm.nih.gov/geo/series/"
        f"{geo_ftp_series_prefix(gse_id)}/{gse_id}/soft/{gse_id}_family.soft.gz"
    )
    print(f"FETCH\t{gse_id}\t{url}")
    try:
        with urllib.request.urlopen(url, timeout=120) as response:
            soft_path.write_bytes(response.read())
        return soft_path
    except Exception as exc:
        print(f"WARN\tGEO_DOWNLOAD_FAILED\t{gse_id}\t{exc}")
        return None


def parse_geo_soft_series(gse_id: str, soft_path: Path) -> SeriesMetadata:
    metadata = SeriesMetadata(series=gse_id)
    citations: list[str] = []
    pubmed_ids: list[str] = []

    with gzip.open(soft_path, "rt", errors="replace") as handle:
        for line in handle:
            line = line.rstrip("\n")
            if line.startswith("^SAMPLE"):
                break
            if line.startswith("!Series_title = "):
                metadata.title = line.split(" = ", 1)[1].strip() or "-"
            elif line.startswith("!Series_citation = "):
                value = line.split(" = ", 1)[1].strip()
                if value:
                    citations.append(value)
            elif line.startswith("!Series_pubmed_id = "):
                value = line.split(" = ", 1)[1].strip()
                if value:
                    pubmed_ids.append(value)

    if citations:
        metadata.citation = "; ".join(dict.fromkeys(citations))
    elif metadata.title != "-":
        metadata.citation = metadata.title

    if pubmed_ids:
        metadata.pubmed = ";".join(dict.fromkeys(pubmed_ids))

    return metadata


def normalize_sentence(value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    return value if value.endswith(".") else f"{value}."


def format_author_list(authors: list[dict[str, str]]) -> str:
    author_names = [author.get("name", "").strip() for author in authors]
    author_names = [name for name in author_names if name]

    if not author_names:
        return ""

    if len(author_names) > 4:
        return f"{', '.join(author_names[:4])} et al."

    return f"{', '.join(author_names)}."


def fetch_pubmed_summaries(pmids: list[str]) -> dict[str, dict]:
    if not pmids:
        return {}

    query = urllib.parse.urlencode(
        {
            "db": "pubmed",
            "id": ",".join(pmids),
            "retmode": "json",
            "tool": NCBI_TOOL,
            "email": NCBI_EMAIL,
        },
    )
    url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?{query}"

    try:
        with urllib.request.urlopen(url, timeout=120) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        print(f"WARN\tPUBMED_SUMMARY_FAILED\t{','.join(pmids)}\t{exc}")
        return {}

    result = payload.get("result", {})
    return {
        pmid: result[pmid]
        for pmid in pmids
        if isinstance(result.get(pmid), dict)
    }


def search_pubmed_by_series(gse_id: str) -> list[str]:
    query = urllib.parse.urlencode(
        {
            "db": "pubmed",
            "term": gse_id,
            "retmode": "json",
            "retmax": "5",
            "tool": NCBI_TOOL,
            "email": NCBI_EMAIL,
        },
    )
    url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?{query}"

    try:
        with urllib.request.urlopen(url, timeout=120) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        print(f"WARN\tPUBMED_SEARCH_FAILED\t{gse_id}\t{exc}")
        return []

    id_list = payload.get("esearchresult", {}).get("idlist", [])
    return [str(pmid).strip() for pmid in id_list if str(pmid).strip()]


def format_pubmed_citation(summary: dict) -> str:
    pmid = str(summary.get("uid", "")).strip()
    title = normalize_sentence(str(summary.get("title", "")).strip())
    journal = str(summary.get("source", "")).strip()
    pubdate = str(summary.get("pubdate", "")).strip()
    authors = format_author_list(summary.get("authors", []))

    parts = [part for part in [authors, title, journal, pubdate] if part]
    citation = " ".join(parts).strip()

    if pmid:
        citation = f"{citation} PMID: {pmid}".strip()

    return citation or "-"


def enrich_citations_from_pubmed(rows: list[SeriesMetadata]) -> None:
    for row in rows:
        if row.pubmed != "-":
            continue

        searched_pmids = search_pubmed_by_series(row.series)
        if searched_pmids:
            row.pubmed = ";".join(dict.fromkeys(searched_pmids))

    pmids = []
    for row in rows:
        if row.pubmed == "-":
            continue
        pmids.extend([pmid for pmid in row.pubmed.split(";") if pmid])

    summaries = fetch_pubmed_summaries(list(dict.fromkeys(pmids)))

    for row in rows:
        if row.pubmed == "-":
            continue

        citations = []
        for pmid in row.pubmed.split(";"):
            summary = summaries.get(pmid)
            if summary:
                citations.append(format_pubmed_citation(summary))

        if citations:
            row.citation = "; ".join(citations)


def clean_tsv_value(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip() or "-"


def main() -> None:
    args = parse_args()
    rows: list[SeriesMetadata] = []

    for gse_id in args.series:
        soft_path = download_geo_soft(gse_id, args.cache)
        if not soft_path:
            rows.append(SeriesMetadata(series=gse_id))
            continue
        rows.append(parse_geo_soft_series(gse_id, soft_path))

    enrich_citations_from_pubmed(rows)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write("series\ttitle\tcitation\tpubmed\n")
        for row in rows:
            handle.write(
                "\t".join(
                    [
                        row.series,
                        clean_tsv_value(row.title),
                        clean_tsv_value(row.citation),
                        clean_tsv_value(row.pubmed),
                    ],
                )
                + "\n",
            )

    print("OUT", args.out)
    for row in rows:
        print(row.series, row.pubmed, row.citation[:120], sep="\t")


if __name__ == "__main__":
    main()
