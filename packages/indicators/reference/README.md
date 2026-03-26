# Reference sources (not built)

`indicators.rs` is a **third-party reference copy**: Rust + PyO3 + NumPy bindings used elsewhere in the Jesse ecosystem for accelerated indicator math. It is **not** compiled or imported by `@shredder/indicators` (this package is TypeScript-only).

Keep this file only if you want a **offline diff target** when validating port behavior. Safe to delete from the repo if you do not use it.
