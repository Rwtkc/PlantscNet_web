from __future__ import annotations

import argparse
import csv
import json
import re
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path


DEFAULT_OUT = Path("D:/OBS录像/桌面/PlantScNet_RNA_citation_metadata.tsv")
NCBI_TOOL = "PlantScNetMetadata"
NCBI_EMAIL = "rnainfor@gmail.com"
CROSSREF_MAILTO = "rnainfor@gmail.com"
PUBMED_SUMMARY_CACHE: dict[str, dict] = {}
PUBMED_SEARCH_CACHE: dict[str, list[str]] = {}
CROSSREF_CACHE: dict[str, dict | None] = {}


@dataclass
class CitationRecord:
    species: str
    sample_id: str
    dataset_id: str
    pubmed: str
    citation: str
    source: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch formal PubMed citations for PlantScNet scRNA metadata locally.",
    )
    parser.add_argument(
        "--summary",
        type=Path,
        required=True,
        help="Server-exported TSV with species, sample_id, dataset_id, pubmed, current_citation.",
    )
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    return parser.parse_args()


def is_pubmed_list(value: str) -> bool:
    return bool(re.fullmatch(r"\d+(?:;\d+)*", value.strip()))


def normalize_sentence(value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    return value if not value or value.endswith(".") else f"{value}."


def format_author_list(authors: list[dict[str, str]]) -> str:
    names = [author.get("name", "").strip() for author in authors]
    names = [name for name in names if name]

    if not names:
        return ""
    if len(names) > 4:
        return f"{', '.join(names[:4])} et al."
    return f"{', '.join(names)}."


def fetch_pubmed_summaries(pmids: list[str]) -> dict[str, dict]:
    pmids = list(dict.fromkeys([pmid for pmid in pmids if pmid]))
    if not pmids:
        return {}

    missing_pmids = [pmid for pmid in pmids if pmid not in PUBMED_SUMMARY_CACHE]
    if not missing_pmids:
        return {pmid: PUBMED_SUMMARY_CACHE[pmid] for pmid in pmids}

    query = urllib.parse.urlencode(
        {
            "db": "pubmed",
            "id": ",".join(missing_pmids),
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
        print(f"WARN\tPUBMED_SUMMARY_FAILED\t{','.join(missing_pmids)}\t{exc}")
        return {pmid: PUBMED_SUMMARY_CACHE[pmid] for pmid in pmids if pmid in PUBMED_SUMMARY_CACHE}

    result = payload.get("result", {})
    for pmid in missing_pmids:
        if isinstance(result.get(pmid), dict):
            PUBMED_SUMMARY_CACHE[pmid] = result[pmid]

    return {pmid: PUBMED_SUMMARY_CACHE[pmid] for pmid in pmids if pmid in PUBMED_SUMMARY_CACHE}


def search_pubmed(query_text: str) -> list[str]:
    query_text = query_text.strip()
    if not query_text:
        return []
    if query_text in PUBMED_SEARCH_CACHE:
        return PUBMED_SEARCH_CACHE[query_text]

    query = urllib.parse.urlencode(
        {
            "db": "pubmed",
            "term": query_text,
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
        print(f"WARN\tPUBMED_SEARCH_FAILED\t{query_text}\t{exc}")
        return []

    ids = payload.get("esearchresult", {}).get("idlist", [])
    PUBMED_SEARCH_CACHE[query_text] = [str(pmid).strip() for pmid in ids if str(pmid).strip()]
    return PUBMED_SEARCH_CACHE[query_text]


def clean_title_query(value: str) -> str:
    value = re.sub(r"\([^)]*(?:GSE|GSM|SRP|SRX|DRP|PRJNA|PRJCA)\d+[^)]*\)", " ", value)
    value = re.sub(r"\b(?:GSE|GSM|SRP|SRX|DRP|PRJNA|PRJCA)\d+\b", " ", value)
    return re.sub(r"\s+", " ", value).strip(" .")


def fetch_crossref_work(title: str) -> dict | None:
    title = clean_title_query(title)
    if not title:
        return None
    if title in CROSSREF_CACHE:
        return CROSSREF_CACHE[title]

    query = urllib.parse.urlencode(
        {
            "query.title": title,
            "rows": "1",
            "mailto": CROSSREF_MAILTO,
        },
    )
    url = f"https://api.crossref.org/works?{query}"

    try:
        request = urllib.request.Request(url, headers={"User-Agent": f"{NCBI_TOOL}/1.0"})
        with urllib.request.urlopen(request, timeout=120) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        print(f"WARN\tCROSSREF_SEARCH_FAILED\t{title}\t{exc}")
        CROSSREF_CACHE[title] = None
        return None

    items = payload.get("message", {}).get("items", [])
    CROSSREF_CACHE[title] = items[0] if items else None
    return CROSSREF_CACHE[title]


def format_pubmed_citation(summary: dict) -> str:
    pmid = str(summary.get("uid", "")).strip()
    title = normalize_sentence(str(summary.get("title", "")).strip())
    journal = str(summary.get("source", "")).strip()
    pubdate = str(summary.get("pubdate", "")).strip()
    authors = format_author_list(summary.get("authors", []))

    citation = " ".join(part for part in [authors, title, journal, pubdate] if part).strip()
    if pmid:
        citation = f"{citation} PMID: {pmid}".strip()
    return citation or "-"


def format_crossref_author_list(authors: list[dict[str, str]]) -> str:
    names = []
    for author in authors:
        family = author.get("family", "").strip()
        given = author.get("given", "").strip()
        initials = "".join(part[:1] for part in re.split(r"[\s-]+", given) if part)
        name = " ".join(part for part in [family, initials] if part)
        if name:
            names.append(name)

    if not names:
        return ""
    if len(names) > 4:
        return f"{', '.join(names[:4])} et al."
    return f"{', '.join(names)}."


def format_crossref_date(work: dict) -> str:
    date_parts = (
        work.get("published-print", {})
        or work.get("published-online", {})
        or work.get("published", {})
        or work.get("issued", {})
    ).get("date-parts", [[]])
    parts = date_parts[0] if date_parts else []
    if not parts:
        return ""

    year = str(parts[0])
    month_names = [
        "",
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ]
    if len(parts) >= 2 and 1 <= int(parts[1]) <= 12:
        return f"{year} {month_names[int(parts[1])]}"
    return year


def format_crossref_citation(work: dict) -> str:
    title = normalize_sentence(str((work.get("title") or [""])[0]).strip())
    journal = str((work.get("container-title") or [""])[0]).strip()
    date_text = format_crossref_date(work)
    doi = str(work.get("DOI", "")).strip()
    authors = format_crossref_author_list(work.get("author", []))

    citation = " ".join(part for part in [authors, title, journal, date_text] if part).strip()
    if doi:
        citation = f"{citation} DOI: {doi}".strip()
    return citation or "-"


def extract_query_ids(*values: str) -> list[str]:
    joined = " ".join(value for value in values if value)
    matches = re.findall(r"(GSE\d+|GSM\d+|SRP\d+|SRX\d+|DRP\d+|PRJNA\d+|PRJCA\d+)", joined)

    priority = {"GSE": 0, "SRP": 1, "DRP": 1, "PRJ": 2, "GSM": 3, "SRX": 4}

    def key(value: str) -> tuple[int, str]:
        prefix = "PRJ" if value.startswith("PRJ") else value[:3]
        return (priority.get(prefix, 9), value)

    return sorted(dict.fromkeys(matches), key=key)


def build_record(row: dict[str, str], summary_cache: dict[str, dict]) -> CitationRecord:
    species = row.get("species", "").strip()
    sample_id = row.get("sample_id", "").strip()
    dataset_id = row.get("dataset_id", "").strip()
    current_pubmed = row.get("pubmed", "-").strip() or "-"
    current_citation = row.get("current_citation", "-").strip() or "-"

    pmids: list[str] = []
    source = "unresolved"

    if is_pubmed_list(current_pubmed):
        pmids = current_pubmed.split(";")
        source = "existing_pubmed"
    else:
        for query_id in extract_query_ids(dataset_id, sample_id, current_citation):
            pmids = search_pubmed(query_id)
            if pmids:
                source = f"pubmed_search:{query_id}"
                break

    summaries = fetch_pubmed_summaries(pmids)
    citations = [
        format_pubmed_citation(summaries[pmid])
        for pmid in pmids
        if pmid in summaries
    ]

    if citations:
        return CitationRecord(
            species=species,
            sample_id=sample_id,
            dataset_id=dataset_id,
            pubmed=";".join(dict.fromkeys(pmids)),
            citation="; ".join(citations),
            source=source,
        )

    crossref_work = fetch_crossref_work(current_citation)
    if crossref_work:
        crossref_citation = format_crossref_citation(crossref_work)
        if crossref_citation != "-":
            return CitationRecord(
                species=species,
                sample_id=sample_id,
                dataset_id=dataset_id,
                pubmed=current_pubmed,
                citation=crossref_citation,
                source="crossref",
            )

    return CitationRecord(
        species=species,
        sample_id=sample_id,
        dataset_id=dataset_id,
        pubmed=current_pubmed,
        citation=current_citation,
        source=source,
    )


def main() -> None:
    args = parse_args()
    rows = list(csv.DictReader(args.summary.open(encoding="utf-8"), delimiter="\t"))
    records = []

    for index, row in enumerate(rows, start=1):
        records.append(build_record(row, {}))
        if index % 25 == 0 or index == len(rows):
            print(f"PROGRESS\t{index}/{len(rows)}")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8", newline="\n") as handle:
        writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
        writer.writerow(["species", "sample_id", "dataset_id", "pubmed", "citation", "source"])
        for record in records:
            writer.writerow(
                [
                    record.species,
                    record.sample_id,
                    record.dataset_id,
                    record.pubmed,
                    record.citation,
                    record.source,
                ],
            )

    unresolved = [
        record
        for record in records
        if "PMID:" not in record.citation and "DOI:" not in record.citation
    ]
    print("TOTAL", len(records))
    print("UNRESOLVED", len(unresolved))
    print("OUT", args.out)
    for record in unresolved[:40]:
        print("UNRESOLVED_ROW", record.species, record.sample_id, record.dataset_id, sep="\t")


if __name__ == "__main__":
    main()
