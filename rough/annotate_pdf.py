import fitz  # PyMuPDF
import json

INPUT_PDF = "form.pdf"
OUTPUT_PDF = "form_with_boxes.pdf"
BOXES_JSON = "boxes.json"


def main():
    # Load detected boxes
    with open(BOXES_JSON, "r") as f:
        box_data = json.load(f)

    # Open original PDF
    doc = fitz.open(INPUT_PDF)

    for key, boxes in box_data.items():
        # key looks like "page_0", "page_1", ...
        page_index = int(key.split("_")[1])
        page = doc[page_index]

        print(f"Annotating {len(boxes)} boxes on page {page_index}")

        for b in boxes:
            # Coordinates are already in PDF points (from get_drawings)
            rect = fitz.Rect(b["x0"], b["y0"], b["x1"], b["y1"])
            # draw a thin red rectangle
            page.draw_rect(rect, color=(1, 0, 0), width=0.5)

    # Save as new PDF
    doc.save(OUTPUT_PDF)
    doc.close()

    print(f"Saved annotated PDF as: {OUTPUT_PDF}")


if __name__ == "__main__":
    main()
