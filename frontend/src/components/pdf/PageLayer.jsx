// PageLayer.jsx
import React from "react";

const RUN_COLORS = [
    "rgba(255, 0, 0, 0.8)",
    "rgba(0, 128, 0, 0.8)",
    "rgba(0, 0, 255, 0.8)",
    "rgba(255, 165, 0, 0.8)",
    "rgba(128, 0, 128, 0.8)",
    "rgba(0, 206, 209, 0.8)",
];

export default function PageLayer({ renderPageProps, boxes, boxValues, onBoxChange }) {
    const {
        pageIndex,
        width,
        height,
        scale,
        canvasLayer,
        textLayer,
        annotationLayer,
        textLayerRendered,
        markRendered,
    } = renderPageProps;



    const pageKey = `page_${pageIndex}`;
    const pageInfo = boxes[pageKey] || { width: 1, height: 1, boxes: [] };
    const pdfWidth = pageInfo.width;
    const pdfHeight = pageInfo.height;
    const pageBoxes = pageInfo.boxes || [];
    const pageRuns = pageInfo.runs || [];


    const scaleX = width / pdfWidth;
    const scaleY = height / pdfHeight;

    // Tell the viewer this page is fully rendered once text is done
    React.useEffect(() => {
        if (textLayerRendered) {
            markRendered(pageIndex);
        }
    }, [textLayerRendered, pageIndex, markRendered]);

    return (
        <div
            style={{
                position: "relative",
                width,
                height,
                // border: "2px solid red"
            }}
        >
            <div style={{ pointerEvents: "none", border: " 2px solid green" }}>
                {canvasLayer.children}
                {textLayer.children}
                {annotationLayer.children}
            </div>

            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 1000,
                }}
            >
                {pageRuns.map((run, runIndex) => {
                    const color = RUN_COLORS[runIndex % RUN_COLORS.length];
                    return run.boxes.map((b, i) => {
                        const offsetX = -.0;  // tweak by eye
                        const offsetY = -0;

                        const offsetW = -.0;
                        const offsetH = -.0;

                        const x = b.x0 * scaleX + offsetX;
                        const y = b.y0 * scaleY + offsetY;
                        const w = (b.x1 - b.x0) * scaleX + offsetW;
                        const h = (b.y1 - b.y0) * scaleY + offsetH;

                        const boxId = `${pageKey}:${run.id}:${i}`;
                        const value = boxValues[boxId] || "";

                        return (
                            <input
                                key={boxId}
                                value={value}
                                maxLength={1}
                                onChange={(e) => onBoxChange(boxId, e.target.value)}
                                style={{
                                    position: "absolute",
                                    top: y,
                                    left: x,
                                    width: w,
                                    height: h,
                                    border: `1px solid ${color}`,
                                    boxSizing: "border-box",
                                    background: "transparent",
                                    textAlign: "center",
                                    fontSize: Math.max(h * 0.6, 8),
                                    fontFamily: "monospace",
                                    padding: 0,
                                    margin: 0,
                                    outline: "none",
                                }}

                            />
                        );
                    });
                })}
            </div>
        </div>
    );



}