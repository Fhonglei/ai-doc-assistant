"""Small RAG evaluation runner for portfolio demos.

Default mode runs a fast offline lexical retrieval check over sample docs.
Pass --backend-url to upload the samples and evaluate live API answers.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import httpx


ROOT = Path(__file__).resolve().parents[1]
EVAL_DIR = ROOT / "evals"
SAMPLE_DIR = EVAL_DIR / "samples"
QA_SET = EVAL_DIR / "qa_set.jsonl"


@dataclass
class EvalCase:
    id: str
    question: str
    expected_document: str | None
    expected_terms: list[str]
    answerable: bool


def load_cases() -> list[EvalCase]:
    cases = []
    for line in QA_SET.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        data = json.loads(line)
        cases.append(EvalCase(**data))
    return cases


def tokenize(text: str) -> set[str]:
    return set(re.findall(r"[a-zA-Z0-9_]+", text.lower()))


def load_sample_docs() -> dict[str, str]:
    return {
        path.name: path.read_text(encoding="utf-8")
        for path in sorted(SAMPLE_DIR.glob("*.txt"))
    }


def lexical_retrieve(question: str, docs: dict[str, str]) -> str | None:
    q_tokens = tokenize(question)
    best_name = None
    best_score = 0
    for name, text in docs.items():
        score = len(q_tokens & tokenize(text))
        if score > best_score:
            best_name = name
            best_score = score
    return best_name


def run_offline(cases: Iterable[EvalCase]) -> dict:
    docs = load_sample_docs()
    results = []
    hits = 0
    answerable_total = 0

    for case in cases:
        predicted = lexical_retrieve(case.question, docs)
        hit = case.expected_document is None or predicted == case.expected_document
        if case.answerable:
            answerable_total += 1
            hits += int(hit)
        results.append(
            {
                "id": case.id,
                "mode": "offline",
                "predicted_document": predicted,
                "expected_document": case.expected_document,
                "retrieval_hit": hit,
            }
        )

    return {
        "mode": "offline",
        "retrieval_hit_rate": hits / answerable_total if answerable_total else 0,
        "results": results,
    }


def api_headers(token: str | None) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"} if token else {}


def upload_samples(client: httpx.Client, backend_url: str, token: str | None) -> dict[str, str]:
    uploaded = {}
    for path in sorted(SAMPLE_DIR.glob("*.txt")):
        with path.open("rb") as fh:
            response = client.post(
                f"{backend_url}/api/v1/documents/upload",
                files={"file": (path.name, fh, "text/plain")},
                headers=api_headers(token),
                timeout=120,
            )
        response.raise_for_status()
        uploaded[path.name] = response.json()["id"]
    return uploaded


def run_live(cases: Iterable[EvalCase], backend_url: str, token: str | None) -> dict:
    results = []
    citation_hits = 0
    refusal_hits = 0
    answerable_total = 0
    unanswerable_total = 0

    with httpx.Client() as client:
        uploaded = upload_samples(client, backend_url.rstrip("/"), token)
        for case in cases:
            document_ids = list(uploaded.values())
            response = client.post(
                f"{backend_url.rstrip('/')}/api/v1/chat/send",
                json={"query": case.question, "document_ids": document_ids, "stream": False},
                headers=api_headers(token),
                timeout=120,
            )
            response.raise_for_status()
            body = response.json()
            answer = body["answer"]
            source_names = {source["document_name"] for source in body.get("sources", [])}
            has_expected_source = (
                case.expected_document is None or case.expected_document in source_names
            )
            has_citation = bool(re.search(r"\[\d+\]", answer))
            refused = "couldn't find relevant information" in answer.lower()

            if case.answerable:
                answerable_total += 1
                citation_hits += int(has_expected_source and has_citation)
            else:
                unanswerable_total += 1
                refusal_hits += int(refused)

            results.append(
                {
                    "id": case.id,
                    "mode": "live",
                    "expected_document": case.expected_document,
                    "source_names": sorted(source_names),
                    "citation_ok": has_expected_source and has_citation,
                    "refusal_ok": refused if not case.answerable else None,
                }
            )

    return {
        "mode": "live",
        "citation_accuracy": citation_hits / answerable_total if answerable_total else 0,
        "refusal_accuracy": refusal_hits / unanswerable_total if unanswerable_total else 0,
        "results": results,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--backend-url", help="Run live eval against a backend URL.")
    parser.add_argument("--token", help="Optional bearer token for authenticated backends.")
    parser.add_argument("--output", default=str(EVAL_DIR / "last_run.json"))
    args = parser.parse_args()

    cases = load_cases()
    report = (
        run_live(cases, args.backend_url, args.token)
        if args.backend_url
        else run_offline(cases)
    )

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
