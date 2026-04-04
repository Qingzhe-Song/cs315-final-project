#!/usr/bin/env python3
"""
Usage
--------
python clean_steam_intersection.py 
    --hf games.parquet
    --reviews-dir ./mendeley_reviews
    --outdir ./cleaned_steam_intersection
"""

from __future__ import annotations

import argparse
import ast
import csv
import hashlib
import json
import math
import re
from collections.abc import Iterable
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd


# ---------- generic cleaning helpers ----------

def clean_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and math.isnan(value):
        return ""
    text = str(value).replace("\x00", " ").strip()
    text = re.sub(r"\s+", " ", text)
    return text


def digits_only(value: Any) -> str:
    return re.sub(r"\D", "", clean_text(value))


def parse_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if isinstance(value, float) and math.isnan(value):
            return False
        return value != 0

    text = clean_text(value).lower()
    if text in {"1", "true", "t", "yes", "y", "recommended"}:
        return True
    if text in {"0", "false", "f", "no", "n", "not recommended"}:
        return False
    if "not recommended" in text:
        return False
    if "recommended" in text:
        return True
    return False


def parse_price(value: Any) -> str:
    if value is None:
        return "0.00"
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if isinstance(value, float) and math.isnan(value):
            return "0.00"
        return f"{float(value):.2f}"
    text = clean_text(value)
    if not text:
        return "0.00"
    text = text.replace("$", "").replace(",", "")
    try:
        return f"{float(text):.2f}"
    except ValueError:
        return "0.00"


def parse_hours_played(value: Any, source_col: str = "") -> str:
    if value is None:
        return ""
    if isinstance(value, float) and math.isnan(value):
        return ""
    text = clean_text(value).replace(",", "")
    if not text:
        return ""
    try:
        num = float(text)
    except ValueError:
        return ""

    # Steam API playtime_forever style columns are minutes.
    if source_col.lower() in {"playtime_forever", "author.playtime_forever", "author_playtime_forever"}:
        num = num / 60.0
    return f"{num:.2f}"


def parse_int(value: Any) -> str:
    if value is None:
        return "0"
    if isinstance(value, float) and math.isnan(value):
        return "0"
    text = clean_text(value).replace(",", "")
    if not text:
        return "0"
    try:
        # tolerate strings like "10.0"
        return str(int(float(text)))
    except ValueError:
        return "0"


def parse_date(value: Any) -> str | None:
    if value is None:
        return None

    # unix timestamp support
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if isinstance(value, float) and math.isnan(value):
            return None
        try:
            return datetime.utcfromtimestamp(int(value)).strftime("%Y-%m-%d")
        except Exception:
            pass

    text = clean_text(value)
    if not text:
        return None

    # numeric timestamp passed as a string
    if re.fullmatch(r"\d{9,13}", text):
        try:
            ts = int(text[:10])
            return datetime.utcfromtimestamp(ts).strftime("%Y-%m-%d")
        except Exception:
            pass

    formats = [
        "%b %d, %Y",
        "%B %d, %Y",
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%m/%d/%y",
        "%Y/%m/%d",
        "%d %b, %Y",
        "%d %B, %Y",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M:%S.%f",
        "%Y/%m/%d %H:%M:%S",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(text, fmt).strftime("%Y-%m-%d")
        except ValueError:
            pass

    for fmt in ["%b %Y", "%B %Y"]:
        try:
            dt = datetime.strptime(text, fmt)
            return dt.strftime("%Y-%m-01")
        except ValueError:
            pass

    return None


def parse_collection(value: Any) -> list[str]:
    """Parse list-like columns from CSV/JSON/parquet.

    Handles actual lists, JSON arrays, Python-literal arrays, dicts, and simple
    delimiter-separated fallbacks.
    """
    if value is None:
        return []
    if isinstance(value, float) and math.isnan(value):
        return []
    if isinstance(value, list):
        items = value
    elif isinstance(value, dict):
        items = list(value.keys())
    else:
        text = clean_text(value)
        if not text or text in {"[]", "{}", "nan", "None", "null"}:
            return []
        parsed: Any
        try:
            parsed = json.loads(text)
        except Exception:
            try:
                parsed = ast.literal_eval(text)
            except Exception:
                delimiter = ";" if ";" in text else ","
                parsed = [part.strip() for part in text.split(delimiter)]

        if isinstance(parsed, dict):
            items = list(parsed.keys())
        elif isinstance(parsed, list):
            items = parsed
        else:
            items = [parsed]

    result: list[str] = []
    seen: set[str] = set()
    for item in items:
        if isinstance(item, dict):
            candidates = [item.get("name"), item.get("title"), item.get("description"), item.get("text")]
            text = next((clean_text(x) for x in candidates if clean_text(x)), "")
        else:
            text = clean_text(item)
        if text and text not in seen:
            seen.add(text)
            result.append(text)
    return result


def write_csv(path: Path, header: list[str], rows: Iterable[tuple[Any, ...]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        for row in rows:
            writer.writerow(row)


# ---------- HF dataset readers ----------

def iter_hf_games(input_path: Path) -> Iterable[dict[str, Any]]:
    suffix = input_path.suffix.lower()

    if suffix == ".json":
        with input_path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            for app_id, game in data.items():
                row = dict(game)
                row.setdefault("appID", app_id)
                yield row
        elif isinstance(data, list):
            for row in data:
                yield row
        else:
            raise ValueError("Unsupported JSON structure for Hugging Face data")
        return

    if suffix == ".csv":
        with input_path.open("r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            for row in reader:
                yield row
        return

    if suffix in {".parquet", ".pq"}:
        df = pd.read_parquet(input_path)
        for row in df.to_dict(orient="records"):
            yield row
        return

    raise ValueError("--hf must point to a .csv, .json, or .parquet file")


# ---------- Mendeley review helpers ----------

def scan_review_files(reviews_dir: Path) -> dict[str, list[Path]]:
    appid_to_files: dict[str, list[Path]] = {}
    for path in reviews_dir.rglob("*.csv"):
        m = re.match(r"^(\d+)(?:_(\d+))?\.csv$", path.name)
        if not m:
            continue
        appid = m.group(1)
        appid_to_files.setdefault(appid, []).append(path)

    for appid in appid_to_files:
        appid_to_files[appid].sort(key=lambda p: p.name)
    return appid_to_files


def extract_shard_from_filename(path: Path) -> int:
    m = re.match(r"^(\d+)(?:_(\d+))?\.csv$", path.name)
    if not m:
        return 0
    return int(m.group(2) or 0)


def choose_column(columns: list[str], candidates: list[str]) -> str | None:
    lowered = {c.lower(): c for c in columns}
    for cand in candidates:
        if cand.lower() in lowered:
            return lowered[cand.lower()]
    return None


def synthetic_review_id(game_id: str, shard: int, row_num: int, row: dict[str, Any]) -> str:
    # Prefer a collision-free numeric concatenation when it comfortably fits.
    if len(game_id) <= 8 and 0 <= shard <= 999999 and 0 <= row_num <= 999999:
        return f"{game_id}{shard:06d}{row_num:06d}"

    raw = f"{game_id}|{shard}|{row_num}|{clean_text(row.get('user'))}|{clean_text(row.get('post_date'))}|{clean_text(row.get('review'))}"
    digest = hashlib.sha1(raw.encode("utf-8")).hexdigest()
    return str(int(digest[:18], 16) % (10 ** 20))


# ---------- main cleaning workflow ----------

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--hf", required=True, help="Path to Hugging Face games file (.csv, .json, or .parquet)")
    parser.add_argument("--reviews-dir", required=True, help="Directory containing Mendeley review CSV files")
    parser.add_argument("--outdir", default="cleaned_steam_intersection", help="Output directory for cleaned CSVs")
    args = parser.parse_args()

    hf_path = Path(args.hf)
    reviews_dir = Path(args.reviews_dir)
    outdir = Path(args.outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    if not hf_path.exists():
        raise FileNotFoundError(f"Hugging Face file not found: {hf_path}")
    if not reviews_dir.exists():
        raise FileNotFoundError(f"Review directory not found: {reviews_dir}")

    review_files_by_appid = scan_review_files(reviews_dir)
    review_appids = set(review_files_by_appid.keys())

    publisher_set: set[tuple[str]] = set()
    developer_set: set[tuple[str, str]] = set()
    platform_set: set[tuple[str]] = {("Windows",), ("macOS",), ("Linux",)}
    genre_set: set[tuple[str]] = set()
    tag_set: set[tuple[str]] = set()
    feature_set: set[tuple[str]] = set()

    game_rows: list[tuple[Any, ...]] = []
    kept_game_ids: set[str] = set()

    developed_by_rows: set[tuple[str, str]] = set()
    supports_rows: set[tuple[str, str]] = set()
    published_by_rows: set[tuple[str, str]] = set()
    classified_as_rows: set[tuple[str, str]] = set()
    tagged_with_rows: set[tuple[str, str]] = set()
    has_features_rows: set[tuple[str, str]] = set()

    total_hf_rows = 0
    hf_rows_with_matching_reviews = 0
    skipped_hf_rows = 0

    for row in iter_hf_games(hf_path):
        total_hf_rows += 1
        raw_app_id = clean_text(row.get("appID") or row.get("appid") or row.get("app_id"))
        game_id = digits_only(raw_app_id)
        if not game_id or game_id not in review_appids:
            continue

        title = clean_text(row.get("name") or row.get("title"))
        release_date = parse_date(row.get("release_date") or row.get("ReleaseDate"))
        price = parse_price(row.get("price"))

        if not title or not release_date:
            skipped_hf_rows += 1
            continue

        hf_rows_with_matching_reviews += 1
        kept_game_ids.add(game_id)
        game_rows.append((game_id, title, release_date, price))

        developers = parse_collection(row.get("developers"))
        publishers = parse_collection(row.get("publishers"))
        categories = parse_collection(row.get("categories"))
        genres = parse_collection(row.get("genres"))
        tags = parse_collection(row.get("tags"))

        if parse_bool(row.get("windows")):
            supports_rows.add((game_id, "Windows"))
        if parse_bool(row.get("mac")):
            supports_rows.add((game_id, "macOS"))
        if parse_bool(row.get("linux")):
            supports_rows.add((game_id, "Linux"))

        for developer_name in developers:
            developer_set.add((developer_name, ""))
            developed_by_rows.add((game_id, developer_name))

        for publisher_name in publishers:
            publisher_set.add((publisher_name,))
            published_by_rows.add((game_id, publisher_name))

        for genre_name in genres:
            genre_set.add((genre_name,))
            classified_as_rows.add((game_id, genre_name))

        for tag_name in tags:
            tag_set.add((tag_name,))
            tagged_with_rows.add((game_id, tag_name))

        for feature_name in categories:
            feature_set.add((feature_name,))
            has_features_rows.add((game_id, feature_name))

    # Write non-review tables first.
    write_csv(outdir / "Publisher.csv", ["PublisherName"], sorted(publisher_set))
    write_csv(outdir / "Developer.csv", ["DeveloperName", "DeveloperType"], sorted(developer_set))
    write_csv(outdir / "Platform.csv", ["PlatformName"], [("Windows",), ("macOS",), ("Linux",)])
    write_csv(outdir / "Genre.csv", ["GenreName"], sorted(genre_set))
    write_csv(outdir / "Tag.csv", ["TagName"], sorted(tag_set))
    write_csv(outdir / "Feature.csv", ["FeatureName"], sorted(feature_set))
    write_csv(outdir / "Game.csv", ["GameID", "Title", "ReleaseDate", "Price"], sorted(game_rows))
    write_csv(outdir / "DevelopedBy.csv", ["GameID", "DeveloperName"], sorted(developed_by_rows))
    write_csv(outdir / "Supports.csv", ["GameID", "PlatformName"], sorted(supports_rows))
    write_csv(outdir / "PublishedBy.csv", ["GameID", "PublisherName"], sorted(published_by_rows))
    write_csv(outdir / "ClassifiedAs.csv", ["GameID", "GenreName"], sorted(classified_as_rows))
    write_csv(outdir / "TaggedWith.csv", ["GameID", "TagName"], sorted(tagged_with_rows))
    write_csv(outdir / "HasFeatures.csv", ["GameID", "FeatureName"], sorted(has_features_rows))

    # Stream Review.csv to avoid holding all reviews in memory.
    review_csv_path = outdir / "Review.csv"
    review_rows_written = 0
    review_files_read = 0
    review_files_skipped = 0
    review_rows_skipped = 0

    with review_csv_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["ReviewID", "ReviewDate", "IsRecommended", "HelpfulVotes", "HoursPlayed", "GameID"])

        for game_id in sorted(kept_game_ids):
            for review_file in review_files_by_appid.get(game_id, []):
                review_files_read += 1
                try:
                    rdf = pd.read_csv(review_file)
                except Exception:
                    review_files_skipped += 1
                    continue

                columns = list(rdf.columns)
                date_col = choose_column(columns, ["post_date", "timestamp_created", "created_at", "date"])
                recommend_col = choose_column(columns, ["recommend", "voted_up", "is_recommended", "recommended"])
                helpful_col = choose_column(columns, ["helpfulness", "votes_up", "helpful_votes"])
                playtime_col = choose_column(columns, ["playtime", "author.playtime_forever", "author_playtime_forever", "playtime_forever", "hours_played"])

                if date_col is None or recommend_col is None:
                    review_files_skipped += 1
                    continue

                shard = extract_shard_from_filename(review_file)
                for row_num, row in enumerate(rdf.to_dict(orient="records"), start=1):
                    review_date = parse_date(row.get(date_col))
                    if not review_date:
                        review_rows_skipped += 1
                        continue

                    review_id = synthetic_review_id(game_id, shard, row_num, row)
                    is_recommended = 1 if parse_bool(row.get(recommend_col)) else 0
                    helpful_votes = parse_int(row.get(helpful_col)) if helpful_col else "0"
                    hours_played = parse_hours_played(row.get(playtime_col), playtime_col or "") if playtime_col else ""

                    writer.writerow([
                        review_id,
                        review_date,
                        is_recommended,
                        helpful_votes,
                        hours_played,
                        game_id,
                    ])
                    review_rows_written += 1

    summary = {
        "hf_input": str(hf_path),
        "reviews_dir": str(reviews_dir),
        "outdir": str(outdir),
        "review_files_found_by_appid": len(review_files_by_appid),
        "total_hf_rows_seen": total_hf_rows,
        "hf_rows_with_matching_review_appid": hf_rows_with_matching_reviews,
        "games_kept": len(kept_game_ids),
        "hf_rows_skipped_after_intersection": skipped_hf_rows,
        "publishers": len(publisher_set),
        "developers": len(developer_set),
        "genres": len(genre_set),
        "tags": len(tag_set),
        "features": len(feature_set),
        "developed_by_rows": len(developed_by_rows),
        "supports_rows": len(supports_rows),
        "published_by_rows": len(published_by_rows),
        "classified_as_rows": len(classified_as_rows),
        "tagged_with_rows": len(tagged_with_rows),
        "has_features_rows": len(has_features_rows),
        "review_files_read": review_files_read,
        "review_files_skipped": review_files_skipped,
        "review_rows_written": review_rows_written,
        "review_rows_skipped": review_rows_skipped,
        "review_id_note": "ReviewID is synthetic because the uploaded Mendeley sample does not include a native review id column.",
    }

    with (outdir / "cleaning_summary.json").open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
