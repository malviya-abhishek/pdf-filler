# python/detect_boxes.py
import fitz
import json
import sys

def group_runs(boxes, y_threshold=2.0, gap_factor=2.5):
    """
    Group boxes into horizontal runs based on:
      1) y position (same line)
      2) horizontal gaps (large gaps start a new run)

    y_threshold: max difference in y0 for boxes to be on same line
    gap_factor: gap > (avg box width * gap_factor) -> split run
    """
    if not boxes:
        return []

    # sort by y (top->bottom), then x (left->right)
    sorted_boxes = sorted(boxes, key=lambda b: (b["y0"], b["x0"]))

    # ---- Step 1: group by Y into raw lines ----
    raw_lines = []
    current_line = [sorted_boxes[0]]
    current_y = sorted_boxes[0]["y0"]

    for b in sorted_boxes[1:]:
        if abs(b["y0"] - current_y) <= y_threshold:
            current_line.append(b)
        else:
            raw_lines.append(current_line)
            current_line = [b]
            current_y = b["y0"]

    if current_line:
        raw_lines.append(current_line)

    # ---- Step 2: within each line, split by big X gaps ----
    all_runs = []
    run_index = 0

    for line in raw_lines:
        # sort by x to be safe
        line = sorted(line, key=lambda b: b["x0"])

        # compute average box width for this line
        widths = [b["x1"] - b["x0"] for b in line]
        avg_width = sum(widths) / len(widths) if widths else 1.0
        gap_threshold = avg_width * gap_factor

        current_run = [line[0]]
        prev_box = line[0]

        for b in line[1:]:
            gap = b["x0"] - prev_box["x1"]
            if gap > gap_threshold:
                # big jump -> start new run
                all_runs.append(current_run)
                current_run = [b]
            else:
                current_run.append(b)
            prev_box = b

        if current_run:
            all_runs.append(current_run)

    # ---- Step 3: build final run objects with ids ----
    grouped = []
    for idx, run_boxes in enumerate(all_runs):
        avg_y = sum(b["y0"] for b in run_boxes) / len(run_boxes)
        grouped.append(
            {
                "id": f"run_{idx}",
                "y": avg_y,
                "boxes": run_boxes,
            }
        )

    return grouped

# def group_runs(boxes, y_threshold=2.0):
#     """
#     Group boxes into horizontal runs based on their y position.
#     y_threshold: maximum difference in y0 for boxes to be considered on same line.
#     """
#     if not boxes:
#         return []

#     # sort boxes top-to-bottom, left-to-right
#     sorted_boxes = sorted(boxes, key=lambda b: (b["y0"], b["x0"]))

#     runs = []
#     current_run = [sorted_boxes[0]]
#     # use the first box's y0 as baseline for the run
#     current_y = sorted_boxes[0]["y0"]

#     for b in sorted_boxes[1:]:
#         if abs(b["y0"] - current_y) <= y_threshold:
#             # same line
#             current_run.append(b)
#         else:
#             # finish previous run
#             runs.append(current_run)
#             # start new run
#             current_run = [b]
#             current_y = b["y0"]

#     # append last run
#     if current_run:
#         runs.append(current_run)

#     grouped = []
#     for idx, run_boxes in enumerate(runs):
#         avg_y = sum(b["y0"] for b in run_boxes) / len(run_boxes)
#         grouped.append(
#             {
#                 "id": f"run_{idx}",
#                 "y": avg_y,
#                 "boxes": run_boxes,
#             }
#         )

#     return grouped


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

        # build runs from page_boxes
        runs = group_runs(page_boxes, y_threshold=2.0, gap_factor=1.5)
        # result[f"page_{page_index}"] = page_boxes
        result[f"page_{page_index}"] = {
            "width": page.rect.width,
            "height": page.rect.height,
            "boxes": page_boxes,
            "runs": runs
        }


    return result


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python detect_boxes.py <pdf_path>", file=sys.stderr)
        sys.exit(1)

    pdf_path = sys.argv[1]
    boxes = detect_boxes(pdf_path)
    print(json.dumps(boxes))
