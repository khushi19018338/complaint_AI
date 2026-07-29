import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setFormState,
  updateFormFields,
  clearForm,
  addMessage,
  setMessages,
  setProgress,
  setStatusMessage,
  setExtracting,
  setSaving,
  setChatting,
} from './store/complaintSlice';
import { extractText, uploadFile, sendChatMessage, saveComplaint } from './api';
import './App.css';

// SVG Icons
const Icons = {
  CloudUpload: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
    </svg>
  ),
  FileText: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  AlertCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.085 1.086L12.75 12.75A.75.75 0 0112 13.5H12a.75.75 0 01-.75-.75V11.25zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5zM22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z" />
    </svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
    </svg>
  ),
  RotateCcw: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  ),
  Save: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18" />
    </svg>
  ),
  Bot: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25M7.5 9.75h.008v.008H7.5V9.75zm9 0h.008v.008h-.008V9.75z" />
    </svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
  Send: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  ),
  X: () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '18px', height: '18px' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
};

function App() {
  const dispatch = useDispatch();

  // Retrieve states from Redux slice
  const formState = useSelector(state => state.complaint.formState);
  const messages = useSelector(state => state.complaint.chatHistory);
  const progress = useSelector(state => state.complaint.progress);
  const statusMessage = useSelector(state => state.complaint.statusMessage);
  const isExtracting = useSelector(state => state.complaint.isExtracting);
  const isSaving = useSelector(state => state.complaint.isSaving);
  const isChatting = useSelector(state => state.complaint.isChatting);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [chatInput, setChatInput] = useState('');

  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll chat history
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Utility to determine if a field has a real extracted value
  const hasValue = (val) => {
    return val !== undefined && val !== null && val.toString().trim() !== '' && val !== 'Awaiting AI extraction...';
  };

  const getInputValue = (val) => {
    return hasValue(val) ? val : 'Awaiting AI extraction...';
  };

  const getInputClass = (val) => {
    return `form-input ${hasValue(val) ? 'has-value' : 'awaiting-extraction'}`;
  };

  // Simulated extraction progress animation
  const runProgressAnimation = () => {
    dispatch(setProgress(10));
    const interval = setInterval(() => {
      dispatch(setProgress(Math.min(90, Math.floor(Math.random() * 10) + 80))); // jump towards completion dynamically
    }, 400);

    return () => clearInterval(interval);
  };

  // Handlers for File Upload
  const handleDropzoneClick = () => {
    if (isExtracting) return;
    fileInputRef.current?.click();
  };

  const processFile = async (file) => {
    if (!file) return;
    dispatch(setExtracting(true));
    dispatch(setStatusMessage("Analyzing document content and extracting key details... Please wait, this may take a few moments."));
    
    const cancelProgress = runProgressAnimation();

    try {
      const response = await uploadFile(file);
      cancelProgress();
      dispatch(setProgress(100));
      
      if (response.success && response.extracted_data) {
        dispatch(setFormState(response.extracted_data));
        dispatch(setStatusMessage(`Document parsed successfully: ${file.name}`));
        
        let assistantNotes = `Successfully parsed **${file.name}** and populated the complaint form fields.`;
        if (response.extracted_data.riskJustification) {
          assistantNotes += `\n\n**AI Risk Assessment Summary:**\n* **Severity:** ${response.extracted_data.initialSeverity}\n* **Priority:** ${response.extracted_data.priority}\n* **Justification:** ${response.extracted_data.riskJustification}`;
        }
        dispatch(addMessage({
          sender: 'assistant',
          text: assistantNotes
        }));
      } else {
        throw new Error(response.message || "Failed to parse document.");
      }
    } catch (err) {
      cancelProgress();
      dispatch(setProgress(0));
      dispatch(setStatusMessage("Failed to extract details. Please verify your file format."));
      console.error(err);
      dispatch(addMessage({
        sender: 'assistant',
        text: `⚠️ **Extraction Error:** I was unable to parse the document **${file.name}**. Please ensure it contains readable text.`
      }));
    } finally {
      dispatch(setExtracting(false));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (isExtracting) return;
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  // Handlers for Paste Text
  const openPasteModal = () => {
    if (isExtracting) return;
    setPasteText('');
    setIsModalOpen(true);
  };

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return;
    setIsModalOpen(false);
    dispatch(setExtracting(true));
    dispatch(setStatusMessage("Analyzing pasted content and extracting key details... Please wait."));
    
    const cancelProgress = runProgressAnimation();

    try {
      const response = await extractText(pasteText);
      cancelProgress();
      dispatch(setProgress(100));

      if (response.success && response.extracted_data) {
        dispatch(setFormState(response.extracted_data));
        dispatch(setStatusMessage("Pasted content parsed successfully."));
        
        let assistantNotes = "Successfully extracted details from pasted text.";
        if (response.extracted_data.riskJustification) {
          assistantNotes += `\n\n**AI Risk Assessment:**\n* **Severity:** ${response.extracted_data.initialSeverity}\n* **Priority:** ${response.extracted_data.priority}\n* **Justification:** ${response.extracted_data.riskJustification}`;
        }
        dispatch(addMessage({
          sender: 'assistant',
          text: assistantNotes
        }));
      } else {
        throw new Error(response.message || "Failed to parse text.");
      }
    } catch (err) {
      cancelProgress();
      dispatch(setProgress(0));
      dispatch(setStatusMessage("Failed to extract details from pasted text."));
      console.error(err);
      dispatch(addMessage({
        sender: 'assistant',
        text: "⚠️ **Extraction Error:** I could not parse the pasted text using the LLM model."
      }));
    } finally {
      dispatch(setExtracting(false));
    }
  };

  // Handlers for Chat Assistant (includes general query + form updates)
  const handleChatSend = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMsg = { sender: 'user', text: chatInput };
    const updatedMessages = [...messages, userMsg];
    
    dispatch(addMessage(userMsg));
    setChatInput('');
    dispatch(setChatting(true));

    try {
      const response = await sendChatMessage(updatedMessages, formState);
      if (response.success) {
        // If the backend parsed an update to the form in chat, update Redux formState!
        if (response.updated_form_data) {
          dispatch(updateFormFields(response.updated_form_data));
        }
        if (response.reply) {
          dispatch(addMessage({ sender: 'assistant', text: response.reply }));
        }
      }
    } catch (err) {
      console.error(err);
      dispatch(addMessage({
        sender: 'assistant',
        text: "⚠️ I'm sorry, I'm having trouble communicating with the server right now. Please try again."
      }));
    } finally {
      dispatch(setChatting(false));
    }
  };

  // Handlers for Form Actions
  const handleSaveForm = async () => {
    dispatch(setSaving(true));
    try {
      const response = await saveComplaint(formState);
      if (response.success) {
        alert(response.message || "Complaint saved to database successfully.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving complaint to SQLite database.");
    } finally {
      dispatch(setSaving(false));
    }
  };

  const handleResetForm = () => {
    if (window.confirm("Are you sure you want to clear the form? All extracted data will be lost.")) {
      dispatch(clearForm());
    }
  };

  return (
    <div className="dashboard-container">
      {/* LEFT PANEL: Log Customer Complaint Form */}
      <main className="form-panel">
        <header className="panel-header">
          <div className="header-title-group">
            <h1>Log Customer Complaint</h1>
            <p>API & FDF Quality Assurance Module</p>
          </div>
          <span className="status-badge pending-triage">Pending Triage</span>
        </header>

        {/* SECTION 1: ORIGIN & CUSTOMER DETAILS */}
        <section className="form-section">
          <h2 className="form-section-title">1. Origin & Customer Details</h2>
          <div className="fields-grid">
            <div className="field-wrapper">
              <label className="field-label">Complaint Source</label>
              <div className="input-container">
                <input
                  type="text"
                  readOnly
                  className={getInputClass(formState.complaintSource)}
                  value={getInputValue(formState.complaintSource)}
                />
              </div>
            </div>
            <div className="field-wrapper">
              <label className="field-label">Customer Name</label>
              <div className="input-container">
                <input
                  type="text"
                  readOnly
                  className={getInputClass(formState.customerName)}
                  value={getInputValue(formState.customerName)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: PRODUCT & BATCH IDENTIFICATION */}
        <section className="form-section">
          <h2 className="form-section-title">2. Product & Batch Identification</h2>
          <div className="fields-grid">
            <div className="field-wrapper">
              <label className="field-label">Product Name</label>
              <div className="input-container">
                <input
                  type="text"
                  readOnly
                  className={getInputClass(formState.productName)}
                  value={getInputValue(formState.productName)}
                />
              </div>
            </div>
            <div className="field-wrapper">
              <label className="field-label">Product Strength/Grade</label>
              <div className="input-container">
                <input
                  type="text"
                  readOnly
                  className={getInputClass(formState.productStrength)}
                  value={getInputValue(formState.productStrength)}
                />
              </div>
            </div>
            <div className="field-wrapper">
              <label className="field-label">Batch/Lot Number</label>
              <div className="input-container">
                <input
                  type="text"
                  readOnly
                  className={getInputClass(formState.batchNumber)}
                  value={getInputValue(formState.batchNumber)}
                />
              </div>
            </div>
            <div className="field-wrapper">
              <label className="field-label">Manufacturing Date</label>
              <div className="input-container">
                <input
                  type="text"
                  readOnly
                  className={getInputClass(formState.manufacturingDate)}
                  value={getInputValue(formState.manufacturingDate)}
                />
                <span className="field-icon"><Icons.Calendar /></span>
              </div>
            </div>
            <div className="field-wrapper">
              <label className="field-label">Expiry Date</label>
              <div className="input-container">
                <input
                  type="text"
                  readOnly
                  className={getInputClass(formState.expiryDate)}
                  value={getInputValue(formState.expiryDate)}
                />
                <span className="field-icon"><Icons.Calendar /></span>
              </div>
            </div>
            <div className="field-wrapper">
              <label className="field-label">Quantity Affected</label>
              <div className="input-container">
                <input
                  type="text"
                  readOnly
                  className={getInputClass(formState.quantityAffected)}
                  value={getInputValue(formState.quantityAffected)}
                />
                {hasValue(formState.quantityAffected) && <span className="field-unit">kg</span>}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: COMPLAINT DETAILS */}
        <section className="form-section">
          <h2 className="form-section-title">3. Complaint Details</h2>
          <div className="fields-grid">
            <div className="field-wrapper">
              <label className="field-label">Complaint Type</label>
              <div className="input-container">
                <input
                  type="text"
                  readOnly
                  className={getInputClass(formState.complaintType)}
                  value={getInputValue(formState.complaintType)}
                />
              </div>
            </div>
            <div className="field-wrapper">
              <label className="field-label">Complaint Date</label>
              <div className="input-container">
                <input
                  type="text"
                  readOnly
                  className={getInputClass(formState.complaintDate)}
                  value={getInputValue(formState.complaintDate)}
                />
                <span className="field-icon"><Icons.Calendar /></span>
              </div>
            </div>
            <div className="field-wrapper full-width">
              <label className="field-label">Detailed Complaint Description</label>
              <div className="input-container">
                <textarea
                  readOnly
                  className={getInputClass(formState.detailedDescription)}
                  value={getInputValue(formState.detailedDescription)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: INITIAL ASSESSMENT & PRIORITY */}
        <section className="form-section">
          <h2 className="form-section-title">4. Initial Assessment & Priority</h2>
          <div className="fields-grid">
            <div className="field-wrapper">
              <label className="field-label">Initial Severity</label>
              <div className="input-container">
                <select
                  disabled
                  className={getInputClass(formState.initialSeverity)}
                  value={formState.initialSeverity || ''}
                >
                  <option value="">Awaiting AI extraction...</option>
                  <option value="Critical">Critical</option>
                  <option value="Major">Major</option>
                  <option value="Minor">Minor</option>
                </select>
              </div>
            </div>
            <div className="field-wrapper">
              <label className="field-label">Priority</label>
              <div className="input-container">
                <select
                  disabled
                  className={getInputClass(formState.priority)}
                  value={formState.priority || ''}
                >
                  <option value="">Awaiting AI extraction...</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Reset / Save Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleResetForm}
            disabled={isExtracting || isSaving}
          >
            <Icons.RotateCcw /> Reset Form
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveForm}
            disabled={isExtracting || isSaving || !hasValue(formState.productName)}
          >
            <Icons.Save /> Save Complaint
          </button>
        </div>
      </main>

      {/* RIGHT PANEL: AI Complaint Intake Assistant */}
      <aside className="ai-panel">
        <header className="panel-header">
          <div className="header-title-group">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--accent-blue)', display: 'flex' }}><Icons.Bot /></span>
              AI Complaint Intake Assistant
            </h1>
          </div>
          <span className="status-badge beta">BETA</span>
        </header>

        {/* File Drag and Drop Zone */}
        <div
          className="upload-dropzone"
          onClick={handleDropzoneClick}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".pdf,.docx,.txt,.eml"
          />
          <div className="upload-icon-container">
            <Icons.CloudUpload />
          </div>
          <p className="upload-text">
            Drag & drop complaint document here<br />
            or <span>click to browse</span>
          </p>
        </div>

        {/* OR Divider */}
        <div className="or-divider">OR</div>

        {/* Paste Text Button */}
        <button
          type="button"
          className="btn btn-paste"
          onClick={openPasteModal}
          disabled={isExtracting}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.FileText /> Paste Complaint Text / Email
          </span>
        </button>

        {/* Supported Formats Alert */}
        <div className="format-alert">
          <span className="format-alert-icon"><Icons.AlertCircle /></span>
          <div className="format-alert-content">
            <p>Supported formats: PDF, DOCX, TXT, EML</p>
            <span>Max file size: 10MB</span>
          </div>
        </div>

        {/* Extraction Progress (Visible when progress > 0) */}
        {progress > 0 && (
          <div className="extraction-progress-container">
            <div className="progress-header">
              <span>Extraction Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <p className={`progress-message ${progress === 100 ? 'highlight' : ''}`}>
              {statusMessage}
            </p>
          </div>
        )}

        {/* Chat Assistant Messages Area */}
        <section className="ai-assistant-section">
          <h2 className="section-label">AI Assistant</h2>
          <div className="chat-history">
            {messages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.sender}`}>
                <div className={`avatar ${msg.sender === 'assistant' ? 'bot' : 'user'}`}>
                  {msg.sender === 'assistant' ? <Icons.Bot /> : <Icons.User />}
                </div>
                <div className="message-bubble">
                  {msg.text.includes('**') || msg.text.includes('⚠️') || msg.text.includes('\n') ? (
                    // Simple Markdown formatting parser
                    <p dangerouslySetInnerHTML={{
                      __html: msg.text
                        .replace(/\n/g, '<br />')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\* (.*?)(?:<br \/>|$)/g, '<li>$1</li>')
                        .replace(/⚠️/g, '<span>⚠️</span>')
                    }} />
                  ) : (
                    <p>{msg.text}</p>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form className="chat-input-container" onSubmit={handleChatSend}>
            <textarea
              className="chat-textarea"
              placeholder="Ask me anything about this complaint..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleChatSend();
                }
              }}
              disabled={isExtracting || isChatting}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={isExtracting || isChatting || !chatInput.trim()}
            >
              <Icons.Send />
            </button>
          </form>
          <p className="ai-disclaimer">
            AI responses may contain errors. Please verify information.
          </p>
        </section>
      </aside>

      {/* PASTE TEXT MODAL */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <header className="modal-header">
              <h3>Paste Complaint Text / Email</h3>
              <button type="button" className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <Icons.X />
              </button>
            </header>
            <div className="modal-body">
              <textarea
                placeholder="Paste the raw email body, ticket contents, or document text here..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handlePasteSubmit}
                  disabled={!pasteText.trim()}
                >
                  Extract Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
