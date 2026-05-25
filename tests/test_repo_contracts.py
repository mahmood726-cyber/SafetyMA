"""Static artifact contracts for the SafetyMA single-file app."""

from __future__ import annotations

import re
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
INDEX_HTML = REPO_ROOT / "index.html"
README = REPO_ROOT / "README.md"
ASSET_RE = re.compile(r'<(?:link|script)[^>]+(?:href|src)="([^"]+)"', re.IGNORECASE)


def test_readme_methods_are_reflected_in_app_shell() -> None:
    html = INDEX_HTML.read_text(encoding="utf-8")
    readme = README.read_text(encoding="utf-8")

    assert "# SafetyMA" in readme
    assert "Peto OR" in readme
    assert "<title>SafetyMA" in html
    assert "Pharmacovigilance Meta-Analysis" in html
    assert "GRADE-style Certainty Assessment" in html
    assert "Cumulative Safety Monitoring" in html


def test_core_analysis_panels_and_exports_exist() -> None:
    html = INDEX_HTML.read_text(encoding="utf-8")

    expected_markers = [
        "forestCanvas",
        "labbeCanvas",
        "cumulCanvas",
        "looCanvas",
        "gradeTable",
        "baselineRisk",
        "runAnalysis()",
        "exportPlot('forestCanvas','safety_forest')",
    ]

    for marker in expected_markers:
        assert marker in html


def test_local_assets_resolve() -> None:
    html = INDEX_HTML.read_text(encoding="utf-8")
    assets = ASSET_RE.findall(html)

    assert assets, "expected at least one linked local asset"

    missing = [
        asset
        for asset in assets
        if not asset.startswith(("http://", "https://"))
        if not (REPO_ROOT / asset).resolve().is_file()
    ]
    assert not missing, f"missing linked assets: {missing}"
