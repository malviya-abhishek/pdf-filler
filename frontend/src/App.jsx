import React, { useState } from "react";
import PdfViewer from "@/components/pdf/PdfViewer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import "./index.css";

const API_URL = window.location.origin;
// const API_URL = "http://localhost:3000";

export default function App() {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [boxes, setBoxes] = useState(null);
  const [boxValues, setBoxValues] = useState({});
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [loading, setLoading] = useState(false);

  // -------------------------------
  // 1. Upload + Detection Handler
  // -------------------------------
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_URL}/forms/detect`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    setPdfUrl(URL.createObjectURL(file));
    setBoxes(data.boxes);
    setUploadedFileName(data.file);

    console.log("Fields extracted");
  };

  // -------------------------------
  // 2. Box Input Handler
  // -------------------------------
  const handleBoxChange = (id, char) => {
    const value = (char || "").slice(-1).toUpperCase();
    setBoxValues((prev) => ({ ...prev, [id]: value }));
  };

  // -------------------------------
  // 3. Fill PDF Handler
  // -------------------------------
  const handleFillPdf = async () => {
    if (!uploadedFileName) {
      alert("No PDF detected yet");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/forms/fill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: uploadedFileName, boxValues }),
      });

      if (!res.ok) {
        console.error("Fill failed", await res.text());
        alert("Fill failed");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `filled_${uploadedFileName}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      // remove all the elements 
      setPdfUrl(null);
      setBoxes(null);
      setBoxValues({});
      setUploadedFileName(null);
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Error filling PDF");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------------------------
  // UI LAYOUT — new full-width full-height layout with shadcn components
  // --------------------------------------------------------------------
  return (
    <div className="flex flex-col h-screen w-screen">
      {/* TOP TOOLBAR */}
      <div className="h-14 border-b bg-white flex items-center gap-3 px-4">

        {/* Upload PDF */}
        <Button asChild>
          <label>
            Browse
            <input type="file" accept="application/pdf" onChange={handleUpload} hidden />
          </label>
        </Button>

        <Separator orientation="vertical" className="h-6" />

        {/* Fill PDF */}
        <Button
          variant="outline"
          onClick={handleFillPdf}
          disabled={!pdfUrl || !boxes || loading}
        >
          {loading ? "Processing..." : "Generate Filled PDF"}
        </Button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-hidden bg-gray-100">
        <ScrollArea className="w-full h-full">
          <div className="p-4 flex justify-center min-h-[100vh]">
            <div className="bg-white shadow rounded" style={{ height: "100%", width: "100%" }}>
              {pdfUrl && boxes ? (
                <PdfViewer
                  pdfUrl={pdfUrl}
                  boxes={boxes}
                  boxValues={boxValues}
                  onBoxChange={handleBoxChange}
                />
              ) : (
                <div className="p-10 text-gray-400" style={{ "textAlign": "center" }}>
                  Upload a PDF to begin
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
