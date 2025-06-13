import React, { useState, useEffect, useRef } from 'react';
import { Send, Upload, Download, Loader, Camera, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { chatAPI, ocrAPI, pdfAPI, apiUtils } from '../services/api';
import FileUpload from './FileUpload';
import LoadingSpinner from './LoadingSpinner';
import toast from 'react-hot-toast';

const ChatInterface = ({ sessionId, categorySlug, onSessionUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (sessionId) {
      loadSessionMessages();
    }
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSessionMessages = async () => {
    try {
      setLoading(true);
      const response = await chatAPI.getSession(sessionId);
      setMessages(response.data.session.messages || []);
    } catch (error) {
      toast.error('Nachrichten konnten nicht geladen werden');
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage({
        sessionId,
        content: userMessage.content
      });

      if (response.data.messages) {
        // Replace the temporary user message with the server response
        setMessages(prev => [
          ...prev.slice(0, -1), // Remove temporary message
          ...response.data.messages
        ]);
      }

      // Update session timestamp
      if (onSessionUpdate) {
        onSessionUpdate();
      }

    } catch (error) {
      toast.error('Nachricht konnte nicht gesendet werden');
      console.error('Error sending message:', error);
      
      // Remove the failed message
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadingFile(true);
    setShowFileUpload(false);

    try {
      // Upload receipt for OCR processing
      const response = await ocrAPI.uploadReceipt(file, sessionId);
      const { ocr_result, analysis } = response.data;

      // Add OCR result as a message
      const ocrMessage = {
        id: Date.now(),
        role: 'assistant',
        content: `📄 **Kassenbon analysiert**\n\nIch habe Ihren Kassenbon erfolgreich gescannt und analysiert. Hier sind die Ergebnisse:\n\n${analysis?.savings_analysis?.general_tips?.join('\n\n') || 'Analyse verfügbar.'}`,
        metadata: {
          type: 'ocr_result',
          ocr_data: ocr_result,
          analysis_data: analysis
        },
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, ocrMessage]);
      toast.success('Kassenbon erfolgreich analysiert');

      // Update session
      if (onSessionUpdate) {
        onSessionUpdate();
      }

    } catch (error) {
      toast.error('Kassenbon konnte nicht verarbeitet werden');
      console.error('Error uploading receipt:', error);
    } finally {
      setUploadingFile(false);
    }
  };

  const downloadPDF = async (messageData, filename) => {
    try {
      const planData = messageData.metadata?.plan_data || messageData.metadata;
      if (!planData) {
        toast.error('Keine Plan-Daten verfügbar');
        return;
      }

      // Mock PDF download for MVP
      const response = await pdfAPI.generate({
        type: 'chat_result',
        data: planData
      });

      toast.success('PDF-Vorschau generiert');
      console.log('PDF Response:', response.data);

    } catch (error) {
      toast.error('PDF konnte nicht generiert werden');
      console.error('Error downloading PDF:', error);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {loading && messages.length === 0 ? (
          <div className="chat-loading">
            <LoadingSpinner />
            <p>Chat wird geladen...</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.role}`}>
                <div className="message-content">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                  
                  {/* Special rendering for generated plans */}
                  {message.metadata?.type === 'generated_plan' && (
                    <div className="plan-actions">
                      <button
                        className="download-pdf-btn"
                        onClick={() => downloadPDF(message, `plan_${Date.now()}.pdf`)}
                      >
                        <Download size={16} />
                        Als PDF herunterladen
                      </button>
                    </div>
                  )}

                  {/* Special rendering for OCR results */}
                  {message.metadata?.type === 'ocr_result' && message.metadata?.analysis_data && (
                    <div className="ocr-analysis">
                      <h4>💰 Spartipps:</h4>
                      {message.metadata.analysis_data.savings_analysis?.recommendations?.map((rec, idx) => (
                        <div key={idx} className="savings-tip">
                          <strong>{rec.item}:</strong> {rec.suggestion}
                          {rec.estimated_savings && <span className="savings"> (Ersparnis: {rec.estimated_savings})</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="message-timestamp">
                  {formatTimestamp(message.created_at)}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="message assistant">
                <div className="message-content typing">
                  <LoadingSpinner size="small" />
                  <span>KI antwortet...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="chat-actions">
        {categorySlug === 'shopping' && (
          <button
            className="action-btn upload-btn"
            onClick={() => setShowFileUpload(true)}
            disabled={uploadingFile}
          >
            {uploadingFile ? <Loader className="spinning" size={16} /> : <Camera size={16} />}
            Kassenbon scannen
          </button>
        )}

        {categorySlug === 'fitness' && (
          <button
            className="action-btn plan-btn"
            onClick={() => {
              const planRequest = prompt('Beschreiben Sie Ihre Fitness-Ziele:');
              if (planRequest) {
                setInputMessage(`Erstelle mir einen detaillierten Trainingsplan: ${planRequest}`);
              }
            }}
            disabled={loading}
          >
            <FileText size={16} />
            Trainingsplan
          </button>
        )}
      </div>

      <div className="chat-input">
        <div className="input-container">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Stellen Sie Ihre Frage..."
            disabled={loading}
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!inputMessage.trim() || loading}
            className="send-button"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {showFileUpload && (
        <FileUpload
          onFiles={handleFileUpload}
          onClose={() => setShowFileUpload(false)}
          accept="image/*"
          title="Kassenbon hochladen"
          description="Fotografieren oder laden Sie Ihren Kassenbon hoch für eine automatische Analyse"
        />
      )}
    </div>
  );
};

export default ChatInterface;