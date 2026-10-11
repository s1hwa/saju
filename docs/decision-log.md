# Implementation Decision Log

This file records judgments made while translating the first worksheet. It exists so later changes can distinguish workbook facts from application decisions.

## 2026-09-26: First Worksheet Only

- Fact: the workbook contains four worksheets.
- Decision: only workbook position 1, `심리흐름주기`, is implemented.
- Reason: explicit project scope.

## 2026-09-26: Resolve the 39-Value Mismatch with 38 Points

- Fact: categories, years, and ages contain 38 records in `C:AN`.
- Fact: each flow series contains 39 cells in `B:AN`.
- Suspicion: the chart value range extends one cell too far.
- Evidence: pairing category record 1 with flow value 1 and using only `B:AM` places flow starts exactly 10 years apart. Pairing same columns does not.
- User-approved decision: pair `C:AN` category records with `B:AM` values and exclude the unmatched `AN` flow value.
- Audit requirement: excluded values remain documented in `docs/excel-analysis.md`.

## 2026-09-26: Series Visibility

- Fact: the workbook defines all four series but hides rows for 수단, 재물, and 명예.
- User-approved decision: psychology is selected when the result opens. The other three are unselected.
- Interaction: checking a flow adds it; clearing the checkbox removes it. Only selected flows appear in the chart and exports.
- Data is never deleted by this interaction; visibility state changes only.

## 2026-09-26: Fixed Interval

- Fact: `C4` contains `10` but is unused by first-sheet formulas.
- Decision: expose no interval input in version 1. Keep `10` as `FLOW_INTERVAL_YEARS` in one constants module.
- Limitation: changing the constant alone does not regenerate flow arrays. A future configurable interval needs a new authoritative workbook rule.

## 2026-09-26: Display Normalization

- Fact: two solar-term strings contain trailing spaces.
- Decision: remove trailing spaces in application labels.
- Reason: spaces are formatting residue and do not change label identity or order.

## 2026-09-26: Name Handling

- Fact: the name cell does not affect calculations.
- Decision: treat name as consultation metadata used in headers and exports.

## 2026-09-26: Softer Chart Lines

- User requirement: chart lines should look less sharp and more gradual.
- Decision: apply restrained ECharts line smoothing to every visible series.
- Constraint: smoothing is presentation-only. Source points, tooltip values, years, ages, and solar-term positions remain unchanged.
- Visual safeguard: do not use an excessive smoothing value that could imply peaks or valleys outside the source data.

c## Unresolved Items

No unresolved calculation question remains for the approved 38-point implementation. Any future workbook change must be re-audited before constants or formulas are altered.
