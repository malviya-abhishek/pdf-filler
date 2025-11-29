// PageLayer.jsx
import React from "react";

export default function PageLayer({ renderPageProps, boxes }) {
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




    const pageInfo = boxes[`page_${pageIndex}`] || { width: 1, height: 1, boxes: [] };
    const pdfWidth = pageInfo.width;
    const pdfHeight = pageInfo.height;
    const pageBoxes = pageInfo.boxes || [];

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
            }}
        >
            {/* Original PDF content */}
            {canvasLayer.children}

            {/* Our overlay */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    zIndex: 50,
                }}
            >
                {pageBoxes.map((b, i) => {

                    const offsetX = -1;  // tweak by eye
                    const offsetY = -0.5;

                    const offsetW = -1;
                    const offsetH = -1;

                    const x = b.x0 * scaleX + offsetX;
                    const y = b.y0 * scaleY + offsetY;
                    const w = (b.x1 - b.x0) * (scaleX + offsetW);
                    const h = (b.y1 - b.y0) * (scaleY + offsetH);

                    return (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                border: "1px solid red",
                                top: y,
                                left: x,
                                width: w,
                                height: h,
                                pointerEvents: "none",
                            }}
                        />
                    );
                })}
            </div>

            {/* Text + annotations on top */}
            {textLayer.children}
            {annotationLayer.children}
        </div>
    );
}
