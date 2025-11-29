import { useState } from "react";
import PdfViewer from "./PdfViewer";

export default function App() {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [boxes, setBoxes] = useState(null);

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    // Upload to NestJS
    const response = await fetch("http://localhost:3000/forms/detect", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    setPdfUrl(URL.createObjectURL(file));
    setBoxes(data.boxes);

    console.log("Filed handled")
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>PDF Viewer with Detected Boxes</h1>

      <input type="file" accept="application/pdf" onChange={handleUpload} />

      {pdfUrl && boxes && (<PdfViewer pdfUrl={pdfUrl} boxes={boxes} />)}
    </div>
  );
}
