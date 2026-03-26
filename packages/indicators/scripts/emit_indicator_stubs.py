#!/usr/bin/env python3
"""Create placeholder indicator modules for any stem missing from src/indicators/."""
from __future__ import annotations

import ast
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PY_DIR = os.path.join(os.path.dirname(ROOT), "indicators_to_be_ported")
IND_DIR = os.path.join(ROOT, "src", "indicators")

SKIP = {"__init__"}
# Hand-maintained implementations — do not overwrite
HAND_WRITTEN = {
    "sma",
    "ema",
    "wilders",
    "mean_ad",
    "median_ad",
    "smma",
    "wma",
    "dema",
    "tema",
    "trima",
    "rsi",
    "macd",
    "kama",
    "zlema",
    "bollinger_bands",
    "bollinger_bands_width",
    "ma",
    "hwma",
    "mwdx",
    "atr",
    "adx",
    "adosc",
    "di",
    "dm",
    "donchian",
    "willr",
    "vwma",
    "cvi",
    "chop",
    "chande",
    "vi",
    "stochastic",
    "stochf",
    "srsi",
    "alligator",
    "ichimoku_cloud",
    "var",
}


def doc_comment(path: str, stem: str) -> str:
    tree = ast.parse(open(path, encoding="utf-8").read())
    fn = None
    for node in tree.body:
        if isinstance(node, ast.FunctionDef) and node.name == stem:
            fn = node
            break
    if fn is None:
        for node in tree.body:
            if isinstance(node, ast.FunctionDef):
                fn = node
                break
    doc = ast.get_docstring(fn) or stem
    lines = [f" {ln}" if ln.strip() else "" for ln in doc.strip().split("\n")]
    inner = "\n".join(lines)
    return f"/*\n{inner}\n*/"


def write_barrel(stems: list[str]) -> None:
    lines: list[str] = []
    for s in stems:
        if s == "var":
            lines.append('export { varIndicator as "var" } from "./var.js";')
        else:
            lines.append(f'export {{ {s} }} from "./{s}.js";')
    path = os.path.join(IND_DIR, "index.ts")
    open(path, "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print("wrote barrel", path, "exports", len(stems))


def main() -> None:
    os.makedirs(IND_DIR, exist_ok=True)
    n = 0
    for py_name in sorted(os.listdir(PY_DIR)):
        if not py_name.endswith(".py"):
            continue
        stem = py_name[:-3]
        if stem in SKIP:
            continue
        if stem in HAND_WRITTEN:
            continue
        target = os.path.join(IND_DIR, f"{stem}.ts")
        if os.path.isfile(target):
            continue
        py_path = os.path.join(PY_DIR, py_name)
        header = doc_comment(py_path, stem)
        stub_fn = f"{stem}Stub"
        export_line = f"export {{ {stub_fn} as {stem} }};"
        if stem == "var":
            stub_fn = "varIndicatorStub"
            export_line = 'export { varIndicatorStub as "var" };'
        err_id = stem.replace("\\", "\\\\").replace('"', '\\"')
        body = f"""{header}
import type {{ IndicatorCandles }} from "../types.js";

/**
 * TODO: Port from packages/indicators_to_be_ported/{py_name}
 * Stub preserves package build; replace with full implementation.
 */
function {stub_fn}(_candles: IndicatorCandles, ..._args: unknown[]): never {{
  throw new Error(
    '@shredder/indicators: indicator "' + "{err_id}" + '" stub — port pending from Python sources.',
  );
}}
{export_line}
"""
        open(target, "w", encoding="utf-8").write(body)
        n += 1
    stems = []
    for py_name in sorted(os.listdir(PY_DIR)):
        if not py_name.endswith(".py"):
            continue
        stem = py_name[:-3]
        if stem in SKIP:
            continue
        stems.append(stem)
    write_barrel(stems)
    print("wrote", n, "stub files")


if __name__ == "__main__":
    main()
