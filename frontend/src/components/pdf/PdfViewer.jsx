import { Viewer, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

import PageLayer from "./PageLayer";

export default function PdfViewer({ pdfUrl, boxes, boxValues, onBoxChange, scale = 2.1 }) {
    return (
        <Worker
            workerUrl="/pdf.worker.min.js"
        >
            <Viewer
                fileUrl={pdfUrl}
                defaultScale={scale}
                renderPage={(renderPageProps) => (
                    <PageLayer
                        renderPageProps={renderPageProps}
                        boxes={boxes}
                        boxValues={boxValues}
                        onBoxChange={onBoxChange}
                    />
                )}
            />
        </Worker>
    );
}