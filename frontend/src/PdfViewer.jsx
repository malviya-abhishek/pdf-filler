import { Viewer, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import PageLayer from "./PageLayer";

export default function PdfViewer({ pdfUrl, boxes }) {
    return (
        <div style={{ position: "relative", width: "100%" }}>
            <Worker workerUrl="/pdf.worker.min.js">
                <Viewer
                    fileUrl={pdfUrl}
                    defaultScale={1.0}
                    renderPage={(renderPageProps) => (
                        <PageLayer
                            renderPageProps={renderPageProps}
                            boxes={boxes}
                        />
                    )}
                />
            </Worker>
        </div>
    );
}