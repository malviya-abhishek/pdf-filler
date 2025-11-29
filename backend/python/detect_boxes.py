# python/detect_boxes.py
import fitz
import json
import sys

def is_small_square(rect):
    x0, y0, x1, y1 = rect
    w = abs(x1 - x0)
    h = abs(y1 - y0)

    if w > 40 or h > 40:
        return False
    if w < 3 or h < 3:
        return False
    if not (5 <= w <= 20 and 5 <= h <= 20):
        return False

    if w == 0 or h == 0:
        return False
    ratio = w / float(h)
    if ratio < 0.6 or ratio > 1.4:
        return False

    return True


def detect_boxes(pdf_path: str):
    doc = fitz.open(pdf_path)
    result = {}

    for page_index, page in enumerate(doc):
        drawings = page.get_drawings()
        page_boxes = []

        for d in drawings:
            rect = d["rect"]
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

        # result[f"page_{page_index}"] = page_boxes
        result[f"page_{page_index}"] = {
            "width": page.rect.width,
            "height": page.rect.height,
            "boxes": page_boxes,
        }


    return result


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python detect_boxes.py <pdf_path>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    boxes = detect_boxes(pdf_path)
    print(json.dumps(boxes))
