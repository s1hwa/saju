# Excel First Worksheet Analysis

## Scope

- Source workbook: `기본형식 흑백 2.xlsx`
- Worksheet selection rule: the first worksheet in workbook order
- First worksheet name: `심리흐름주기`
- Used range reported by the worksheet: `A1:AY47`
- Other worksheets were intentionally ignored.

This document records the workbook as found. The application does not require Excel at runtime.

## Input Cells

| Cell | Label | Sample value | Application treatment |
| --- | --- | ---: | --- |
| `C3` | 입춘의 년도 | `1950` | Required numeric input |
| `C4` | 수단 및 재물의 간격 년수 | `10` | Internal constant; not shown as an input |
| `C5` | 이름 | `홍호기` | Required text input; display metadata only |
| `C6` | 나이 | `-16` | Required numeric input |

`C4` is not referenced by any formula on the first worksheet. The 10-year offsets are already represented by the positions of the hard-coded flow arrays. The application keeps the value in one configuration constant so a future workbook revision can replace it without spreading a magic number through the code.

## Automatically Calculated Cells

### Years: `C46:AN46`

There are 38 displayed years. `C46` references `$C$3`. The following cells reproduce the workbook's exact offsets from the input year:

```text
0, 2, 5, 7, 10, 12, 15, 17, 20, 22,
25, 27, 30, 32, 35, 37, 40, 42, 45, 47,
50, 52, 55, 57, 60, 62, 65, 67, 70, 72,
75, 77, 80, 82, 85, 87, 90, 92
```

The application stores this exact array. It does not generate the values from a presumed saju rule.

Representative formulas:

- `C46`: `=$C$3`
- `D46`: `=C46+2`
- `E46`: `=C46+5`
- `F46`: `=E46+2`
- `G46`: `=E46+5`
- `AH46:AL46`: shared formula anchored at `AH46` with `=AF46+5`
- `AM46`: `=AK46+5`
- `AN46`: `=AL46+5`

The shared formula expands by relative reference and produces `2027, 2030, 2032, 2035, 2037` for the sample input. Its stored XML differs from earlier cells, but its calculated sequence remains consistent.

### Ages: `C47:AN47`

- `C47`: `=$C$6&"세"`
- `D47:AN47`: shared formula anchored at `D47` with `=D$46-$C$3+$C$6&"세"`

The numeric application rule is:

```text
age = calculatedYear - inputSpringYear + inputAge
```

The `세` suffix is display formatting and is not stored in the numeric calculation model.

## Solar-Term Labels

The chart category source is `C45:AN45`, containing 38 labels in this order:

```text
입춘, 우수, 경칩, 춘분, 청명, 곡우, 입하, 소만,
망종, 하지, 소서, 대서, 입추, 처서, 백로, 추분,
한로, 상강, 입동, 소설, 대설, 동지, 소한, 대한,
입춘, 우수, 경칩, 춘분, 청명, 곡우, 입하, 소만,
망종, 하지, 소서, 대서, 입추, 처서
```

The workbook contains trailing spaces in the first `입춘 ` and first `소한 ` strings. These spaces are not visible data and are trimmed in the application while order and wording are preserved.

## Flow Data

The four flow rows are constants, not formulas. Blank leading cells are represented as `null` so ECharts leaves a gap before that flow begins.

| Flow | Worksheet row | Original populated span | First nonblank value |
| --- | ---: | --- | --- |
| 심리 | 41 | `B41:AN41` | `B41 = -10` |
| 수단 | 42 | `B42:AN42` | `F42 = -10` |
| 재물 | 43 | `B43:AN43` | `J43 = -10` |
| 명예 | 44 | `B44:AN44` | `N44 = -10` |

The first nonblank positions are four columns apart. When the flow values are paired by position with category cells `C:AN`, those starts occur at 1950, 1960, 1970, and 1980 for the sample input. This confirms the workbook's fixed 10-year displacement.

## Chart Definition

The first worksheet contains one line chart.

- Series names: `A41`, `A42`, `A43`, `A44`
- Multi-level category source: `C45:AN47`
  - row 45: solar term
  - row 46: year
  - row 47: age
- Series value sources: `B41:AN41`, `B42:AN42`, `B43:AN43`, `B44:AN44`
- Blank handling: gap
- `plotVisOnly=1`
- Rows 42, 43, and 44 are hidden, so the original first-sheet chart effectively prioritizes psychology.

## Confirmed 39-versus-38 Mismatch

The category source contains 38 points, while each series source contains 39 cells. Therefore the final value in column `AN` has no corresponding solar term, year, or age.

The user approved the following application mapping:

```text
38 category records: C45:AN47
38 flow values:      B:AM from each flow row
excluded extra value: AN from each flow row
```

This mapping preserves the intended 10-year starts:

| Category record | Paired flow cell | Meaning in sample workbook |
| --- | --- | --- |
| `C45:C47` | `B41:B44` | 1950 starting point |
| `G45:G47` | `F41:F44` | 1960 / 수단 start |
| `K45:K47` | `J41:J44` | 1970 / 재물 start |
| `O45:O47` | `N41:N44` | 1980 / 명예 start |

The excluded values are retained here for audit purposes:

| Cell | Excluded value |
| --- | ---: |
| `AN41` | `15` |
| `AN42` | `15` |
| `AN43` | `5` |
| `AN44` | `-5` |

Using same-column values `C:AN` was rejected because it would discard the initial psychology value `-10` and move the means start from the intended 1960 point to 1957 in the sample workbook.

## Suspicious or Notable Workbook Details

1. The chart has 38 category records but 39 values per series.
2. `C4` appears to be a configurable interval but is not referenced by first-sheet formulas.
3. `C5` is not referenced by a formula or chart title; it is consultation metadata.
4. Rows 42-44 are hidden and the chart excludes hidden rows, despite all four series being defined.
5. The note in `A40` mentions hiding cells/rows 43, 44, and 45, while the workbook actually hides rows 42, 43, and 44.
6. Years `AH46:AL46` use a shared-formula group, and `AM46` and `AN46` use separate shared-formula groups. The calculated values remain consistent with the displayed sequence.
7. Some solar-term strings contain trailing spaces. The application trims only this whitespace.

## Implementation Cautions

- Do not derive new saju formulas from domain knowledge.
- Preserve all 38 offsets and flow values exactly as constants.
- Keep `10` in a single configuration constant.
- Do not expose arbitrary interval editing until a revised workbook defines how the arrays should change.
- Keep blank leading flow values as `null`; do not replace them with zero.
- Start with psychology visible. Means, wealth, and honor are available through checkboxes.
- Only selected series are included in the chart, tooltip, PNG, PDF, and print output.
- Use restrained visual curve smoothing while keeping every Excel-derived data point unchanged.
