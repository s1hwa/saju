from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".guide-deps"))
import pymupdf


def main():
    output = ROOT / "artifacts" / "checklist"
    with pymupdf.open(output / "report.pdf") as pdf:
        assert pdf.page_count == 1, "Expected one page"
        page = pdf[0]
        assert abs(page.rect.width - 841.89) < 2, "Expected A4 landscape width"
        assert abs(page.rect.height - 595.28) < 2, "Expected A4 landscape height"
        text = page.get_text()
        assert "Checklist client" in text and "2003" in text, "Missing customer information"
        assert len(page.get_images(full=True)) >= 1, "Missing chart image"
        for block in page.get_text("dict")["blocks"]:
            bounds = pymupdf.Rect(block["bbox"])
            assert page.rect.contains(bounds), f"Content outside page: {bounds}"
        page.get_pixmap(matrix=pymupdf.Matrix(1.5, 1.5), alpha=False).save(output / "report-preview.png")
    print("PASS U06: A4 landscape, one page, customer text, chart image, content inside page")
    print("Visual overlap/legibility inspection is separate from these structural assertions.")


if __name__ == "__main__":
    main()
