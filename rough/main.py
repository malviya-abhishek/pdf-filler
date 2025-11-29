import fitz
import json

INPUT_PDF = "form.pdf"


def is_small_square(rect):
    x0, y0, x1, y1 = rect
    w = abs(x1 - x0)
    h = abs(y1 - y0)

    # Ignore huge shapes (headings, big frames)
    if w > 40 or h > 40:
        return False

    # Ignore tiny dots
    if w < 3 or h < 3:
        return False

    # Letter boxes in PDFs are usually 5–15 points square
    if not (5 <= w <= 20 and 5 <= h <= 20):
        return False

    # Roughly square
    if w == 0 or h == 0:
        return False
    ratio = w / float(h)
    if ratio < 0.6 or ratio > 1.4:
        return False

    return True


def detect_boxes(pdf_path):
    doc = fitz.open(pdf_path)
    result = {}

    for page_index, page in enumerate(doc):
        drawings = page.get_drawings()
        print(f"Page {page_index}: {len(drawings)} drawing objects")

        page_boxes = []

        for d in drawings:
            # Every drawing has a bounding rect, regardless of type
            rect = d["rect"]  # fitz.Rect
            if rect is None:
                continue

            if is_small_square(rect):
                page_boxes.append({
                    "x0": rect.x0,
                    "y0": rect.y0,
                    "x1": rect.x1,
                    "y1": rect.y1,
                    "type": d.get("type", "unknown")
                })

        print(f"  -> Found {len(page_boxes)} candidate boxes")
        result[f"page_{page_index}"] = page_boxes

    return result


if __name__ == "__main__":
    boxes = detect_boxes(INPUT_PDF)

    with open("boxes.json", "w") as f:
        json.dump(boxes, f, indent=2)

    print("Saved boxes.json")
