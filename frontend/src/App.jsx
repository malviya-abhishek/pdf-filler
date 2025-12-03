import { useState } from "react";
import PdfViewer from "./PdfViewer";
import "./index.css";



export default function App() {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [boxes, setBoxes] = useState(null);

  const [pagesData, setPagesData] = useState(null);  // detection result
  const [boxValues, setBoxValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState(null);



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
    setUploadedFileName(data.file);

    console.log("Filed handled")
  };

  const handleBoxChange = (boxId, char) => {
    // keep only last character & uppercase it
    const value = (char || "").slice(-1).toUpperCase();
    setBoxValues((prev) => ({ ...prev, [boxId]: value }));
  };

  const handleFillPdf = async () => {
    if (!uploadedFileName) {
      alert("No PDF detected yet");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/forms/fill`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: uploadedFileName,
          boxValues,
        }),
      });

      if (!res.ok) {
        console.error("Fill failed", await res.text());
        alert("Fill failed");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // open in new tab OR trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = `filled_${uploadedFileName}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Error filling PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div div className="page-root" >
      <>
        <input type="file" accept="application/pdf" onChange={handleUpload} />
      </>


      {pdfUrl && boxes && (
        <>
          <div >
            <button onClick={handleFillPdf} disabled={loading}>
              Generate Filled PDF
            </button>
          </div>

          <div class="container">
            <div class="pdf-viewer">
              <PdfViewer
                pdfUrl={pdfUrl}
                boxes={boxes}
                boxValues={boxValues}
                onBoxChange={handleBoxChange}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
