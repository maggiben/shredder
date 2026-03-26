#!/usr/bin/env python3
"""Emit registry-metadata.json from indicators_to_be_ported Python sources.

Each entry matches JSDoc-oriented fields used by @shredder/indicators:
- description: one-line summary (like a JSDoc summary line)
- returns: optional @returns text (from :return: in NumPy-style docstrings)
- params: list of { name, default?, description?, type? } (compatible with @param)
"""
from __future__ import annotations

import ast
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PY_DIR = os.path.join(os.path.dirname(ROOT), "indicators_to_be_ported")
OUT = os.path.join(ROOT, "src", "registry-metadata.json")

_PARAM_LINE = re.compile(r"^:param\s+(\w+)\s*:\s*(.*)$", re.IGNORECASE)
_RETURN_LINE = re.compile(r"^:return\s*:\s*(.*)$", re.IGNORECASE)
_TYPE_HINT = re.compile(r"^(bool|int|float|str|np\.ndarray|ndarray)\b", re.IGNORECASE)


def literal_to_json(v: ast.expr | None) -> object:
    if v is None:
        return None
    if isinstance(v, ast.Constant):
        return v.value
    if isinstance(v, ast.Name):
        return v.id
    return ast.unparse(v)


def pick_summary(doc: str, stem: str) -> str:
    """First title line, skipping @tags, :param / :return, and credits-only lines."""
    for raw in doc.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("@"):
            continue
        if line.startswith(":"):
            continue
        if line.lower().startswith("credits:"):
            continue
        if line.startswith("http://") or line.startswith("https://"):
            continue
        return line
    return stem


def parse_numpy_doc_sections(doc: str) -> tuple[dict[str, str], str | None]:
    """Parse :param name: ... and :return: ... lines (NumPy / reST style → JSDoc-friendly strings)."""
    param_desc: dict[str, str] = {}
    returns: str | None = None
    for raw in doc.splitlines():
        line = raw.strip()
        m = _PARAM_LINE.match(line)
        if m:
            name = m.group(1)
            body = m.group(2).strip()
            param_desc[name] = body
            continue
        m = _RETURN_LINE.match(line)
        if m:
            returns = m.group(1).strip() or None
    return param_desc, returns


def infer_param_type(description: str) -> str | None:
    if not description:
        return None
    m = _TYPE_HINT.match(description.strip())
    if not m:
        return None
    t = m.group(1).lower()
    if t in ("bool",):
        return "boolean"
    if t in ("int", "float", "str"):
        return "number" if t in ("int", "float") else "string"
    if t in ("np.ndarray", "ndarray"):
        return "OhlcvMatrix | Float64Array"
    return None


def main() -> None:
    if not os.path.isdir(PY_DIR):
        print("extract_registry_metadata: missing directory", PY_DIR, file=sys.stderr)
        sys.exit(1)

    meta: dict[str, dict[str, object]] = {}
    for py_name in sorted(os.listdir(PY_DIR)):
        if not py_name.endswith(".py") or py_name == "__init__.py":
            continue
        stem = py_name[:-3]
        path = os.path.join(PY_DIR, py_name)
        tree = ast.parse(open(path, encoding="utf-8").read())
        target: ast.FunctionDef | None = None
        for node in tree.body:
            if isinstance(node, ast.FunctionDef) and node.name == stem:
                target = node
                break
        if target is None:
            for node in tree.body:
                if isinstance(node, ast.FunctionDef):
                    target = node
                    break
        if target is None:
            meta[stem] = {"description": stem, "params": []}
            continue

        doc = ast.get_docstring(target) or ""
        param_desc, returns = parse_numpy_doc_sections(doc)
        first_line = pick_summary(doc, stem)

        args = target.args
        names = [a.arg for a in args.args]
        defaults = list(args.defaults)
        n_no_defaults = len(names) - len(defaults)
        params: list[dict[str, object]] = []
        for i, name in enumerate(names):
            if name in ("self", "cls"):
                continue
            entry: dict[str, object] = {"name": name}
            d_i = i - n_no_defaults
            if d_i >= 0:
                entry["default"] = literal_to_json(defaults[d_i])
            if name in param_desc:
                pdesc = param_desc[name]
                entry["description"] = pdesc
                hinted = infer_param_type(pdesc)
                if hinted:
                    entry["type"] = hinted
            params.append(entry)

        row: dict[str, object] = {"description": first_line, "params": params}
        if returns:
            row["returns"] = returns
        meta[stem] = row

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, "w", encoding="utf-8").write(json.dumps(meta, indent=2, sort_keys=True) + "\n")
    print("wrote", OUT, "entries", len(meta))


if __name__ == "__main__":
    main()
