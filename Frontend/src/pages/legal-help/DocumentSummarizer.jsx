"use client"

import { useState } from "react"
import { FileText, Upload, Loader2, Download, Eye } from "lucide-react"
import { useTranslation } from "react-i18next"
import toast from "react-hot-toast"
import GlassCard from "../../components/GlassCard"

const DocumentSummarizer = () => {
  const { i18n } = useTranslation()
  const [file, setFile] = useState(null)
  const [text, setText] = useState("")
  const [summary, setSummary] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [keyPoints, setKeyPoints] = useState([])

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0]
    if (uploadedFile) {
      if (uploadedFile.type === "application/pdf" || uploadedFile.type.startsWith("image/")) {
        setFile(uploadedFile)
        toast.success(i18n.language === "hi" ? "फाइल अपलोड हो गई" : "File uploaded successfully")
      } else {
        toast.error(i18n.language === "hi" ? "केवल PDF और इमेज फाइलें स्वीकार हैं" : "Only PDF and image files are accepted")
      }
    }
  }

  const summarizeDocument = async () => {
    if (!file && !text.trim()) {
      toast.error(i18n.language === "hi" ? "कृपया फाइल अपलोड करें या टेक्स्ट दर्ज करें" : "Please upload a file or enter text")
      return
    }

    setIsProcessing(true)
    const toastId = toast.loading(i18n.language === "hi" ? "दस्तावेज़ का विश्लेषण किया जा रहा है..." : "Analyzing document...")

    try {
      let documentText = text;
      let imageBase64 = null;
      let imageMimeType = null;
      
      // If image file is uploaded, convert to base64
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
        });
        reader.readAsDataURL(file);
        const dataUrl = await base64Promise;
        imageBase64 = dataUrl.split(',')[1]; // Remove data:image/png;base64, prefix
        imageMimeType = file.type;
      } else if (file && file.type === "application/pdf") {
        toast.error(i18n.language === "hi" ? "PDF फ़ाइलों के लिए, कृपया टेक्स्ट बॉक्स में सामग्री कॉपी-पेस्ट करें" : "For PDF files, please copy-paste content into the text box", { id: toastId });
        setIsProcessing(false);
        return;
        }
      }

      // Validate that we have either text or image
      if (!imageBase64 && (!documentText || documentText.trim().length < 50)) {
        toast.error(i18n.language === "hi" ? "कृपया कम से कम 50 वर्णों का टेक्स्ट दर्ज करें या एक इमेज अपलोड करें" : "Please enter at least 50 characters of text or upload an image", { id: toastId });
        setIsProcessing(false);
        return;
      }

      // Call the AI API
      const requestBody = {
        documentType: "Legal Document"
      };
      
      if (imageBase64) {
        requestBody.imageBase64 = imageBase64;
        requestBody.imageMimeType = imageMimeType;
      }
      
      if (documentText && documentText.trim()) {
        requestBody.documentText = documentText;
      }

      const response = await fetch('http://localhost:5001/api/ai/summarize-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to summarize document');
      }

      const data = await response.json();
      const result = data.data;

      // Format summary with proper structure
      const formattedSummary = `**${i18n.language === "hi" ? "दस्तावेज़ प्रकार" : "Document Type"}:** ${result.documentType}

**${i18n.language === "hi" ? "सारांश" : "Summary"}:**
${result.summary}

**${i18n.language === "hi" ? "तात्कालिकता" : "Urgency"}:** ${result.urgency?.toUpperCase() || 'MEDIUM'}

**${i18n.language === "hi" ? "अगले कदम" : "Next Steps"}:**
${result.nextSteps || 'Review carefully and consult legal professional'}`;

      setSummary(formattedSummary);
      setKeyPoints(result.keyPoints || result.recommendations || []);
      toast.success(i18n.language === "hi" ? "दस्तावेज़ का सारांश तैयार हो गया" : "Document summary generated", { id: toastId });
    } catch (error) {
      console.error('Summarization error:', error);
      toast.error(i18n.language === "hi" ? `सारांश बनाने में त्रुटि: ${error.message}` : `Error generating summary: ${error.message}`, { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {i18n.language === "hi" ? "दस्तावेज़ सारांशकर्ता" : "Document Summarizer"}
        </h1>
        <p className="text-slate-400">
          {i18n.language === "hi" ? "कानूनी दस्तावेज़ों को समझने में आसान बनाएं" : "Make legal documents easier to understand"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <GlassCard>
          <h2 className="text-xl font-semibold text-cyan-400 mb-4">
            {i18n.language === "hi" ? "दस्तावेज़ अपलोड करें" : "Upload Document"}
          </h2>

          {/* File Upload */}
          <div className="mb-6">
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center hover:border-slate-500 transition-colors">
              <FileText className="mx-auto mb-4 text-slate-400" size={48} />
              <p className="text-slate-300 mb-2">
                {i18n.language === "hi" ? "PDF या इमेज फाइल अपलोड करें" : "Upload PDF or image file"}
              </p>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg cursor-pointer transition-colors"
              >
                <Upload size={16} />
                {i18n.language === "hi" ? "फाइल चुनें" : "Choose File"}
              </label>
              {file && (
                <p className="mt-2 text-green-400 text-sm">
                  {i18n.language === "hi" ? "चयनित:" : "Selected:"} {file.name}
                </p>
              )}
            </div>
          </div>

          {/* Text Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {i18n.language === "hi" ? "या टेक्स्ट पेस्ट करें" : "Or paste text"}
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={i18n.language === "hi" ? "यहाँ अपना टेक्स्ट पेस्ट करें..." : "Paste your text here..."}
              className="w-full h-32 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
          </div>

          <button
            onClick={summarizeDocument}
            disabled={isProcessing || (!file && !text.trim())}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                {i18n.language === "hi" ? "प्रोसेसिंग..." : "Processing..."}
              </>
            ) : (
              <>
                <Eye size={16} />
                {i18n.language === "hi" ? "सारांश बनाएं" : "Generate Summary"}
              </>
            )}
          </button>
        </GlassCard>

        {/* Output Section */}
        <GlassCard>
          <h2 className="text-xl font-semibold text-cyan-400 mb-4">{i18n.language === "hi" ? "सारांश" : "Summary"}</h2>

          {summary ? (
            <div className="space-y-4">
              <div className="bg-slate-900/50 p-4 rounded-lg">
                <div className="whitespace-pre-wrap text-slate-300">{summary}</div>
              </div>

              {keyPoints.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    {i18n.language === "hi" ? "मुख्य बिंदु" : "Key Points"}
                  </h3>
                  <ul className="space-y-2">
                    {keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-2 text-slate-300">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 flex-shrink-0"></span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => {
                  const element = document.createElement("a")
                  const file = new Blob([summary], { type: "text/plain" })
                  element.href = URL.createObjectURL(file)
                  element.download = "document-summary.txt"
                  document.body.appendChild(element)
                  element.click()
                  document.body.removeChild(element)
                }}
                className="w-full btn-secondary flex items-center justify-center gap-2"
              >
                <Download size={16} />
                {i18n.language === "hi" ? "सारांश डाउनलोड करें" : "Download Summary"}
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <FileText size={48} className="mx-auto mb-4" />
              <p>{i18n.language === "hi" ? "सारांश यहाँ दिखाई देगा" : "Summary will appear here"}</p>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}

export default DocumentSummarizer
