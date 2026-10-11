from hashlib import sha256
from pathlib import Path
import sys
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".guide-deps"))

import pymupdf
from docx import Document


DELIVERY_DIR = ROOT / "delivery" / "인생흐름주기_최종검증본_20260930"
DELIVERY_ZIP = ROOT / "delivery" / "인생흐름주기_최종검증본_20260930.zip"
INSTALLER = DELIVERY_DIR / "인생흐름주기_설치파일.exe"
GUIDE_PDF = DELIVERY_DIR / "인생흐름주기_사용안내서.pdf"
GUIDE_DOCX = DELIVERY_DIR / "인생흐름주기_사용안내서.docx"
REPORT_PDF = ROOT / "artifacts" / "report.pdf"


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def digest(path):
    hasher = sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def validate_pdf(path, expected_pages, minimum_text, require_image):
    require(path.exists(), f"Missing PDF: {path}")
    pdf = pymupdf.open(path)
    require(pdf.page_count == expected_pages, f"Unexpected page count for {path.name}: {pdf.page_count}")
    require(not pdf.is_encrypted, f"Encrypted PDF: {path.name}")
    require(not pdf.is_repaired, f"Damaged PDF required repair: {path.name}")

    text_length = sum(len(page.get_text()) for page in pdf)
    image_count = sum(len(page.get_images(full=True)) for page in pdf)
    require(text_length >= minimum_text, f"Too little text in {path.name}: {text_length}")
    if require_image:
        require(image_count >= 1, f"No image content in {path.name}")

    first_page = pdf[0]
    pixmap = first_page.get_pixmap(matrix=pymupdf.Matrix(0.5, 0.5), alpha=False)
    nonwhite = sum(1 for value in pixmap.samples if value < 245)
    require(nonwhite > len(pixmap.samples) * 0.05, f"Rendered page appears blank: {path.name}")
    pdf.close()
    return text_length, image_count


def main():
    require(INSTALLER.exists(), "Installer is missing")
    require(INSTALLER.stat().st_size > 100_000_000, "Installer is unexpectedly small")
    with INSTALLER.open("rb") as file:
        require(file.read(2) == b"MZ", "Installer is not a Windows executable")

    guide_text, guide_images = validate_pdf(GUIDE_PDF, 2, 700, True)
    report_text, report_images = validate_pdf(REPORT_PDF, 1, 80, True)

    document = Document(GUIDE_DOCX)
    docx_text = " ".join(paragraph.text for paragraph in document.paragraphs)
    for phrase in ("Ctrl + 마우스 휠", "전체 보기", "화면 맞춤", "Microsoft Print to PDF"):
        require(phrase in docx_text, f"Guide DOCX is missing: {phrase}")

    require(DELIVERY_ZIP.exists(), "Delivery ZIP is missing")
    expected_files = {INSTALLER.name, GUIDE_PDF.name, GUIDE_DOCX.name}
    with ZipFile(DELIVERY_ZIP) as archive:
        entries = [entry for entry in archive.infolist() if not entry.is_dir()]
        names = {Path(entry.filename).name for entry in entries}
        require(names == expected_files, f"Unexpected ZIP contents: {sorted(names)}")
        for entry in entries:
            matching_file = DELIVERY_DIR / Path(entry.filename).name
            require(sha256(archive.read(entry)).hexdigest() == digest(matching_file), f"ZIP entry differs: {entry.filename}")

    print("PASS installer: Windows PE header and size")
    print(f"PASS guide PDF: 2 pages, text={guide_text}, images={guide_images}")
    print(f"PASS print PDF: 1 page, text={report_text}, images={report_images}, nonblank")
    print("PASS guide DOCX: zoom, full-view, fit-to-screen, and PDF instructions")
    print("PASS delivery ZIP: exact contents and matching SHA-256 hashes")


if __name__ == "__main__":
    main()
