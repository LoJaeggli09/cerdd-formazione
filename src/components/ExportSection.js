import React, { useState } from 'react';
import { FileDown, FileText, FileSpreadsheet, Download, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { exportToPDF, exportToExcel, exportToCSV, exportToTXT } from '../data/exportReports';
import { translate } from '../i18n';

const ExportSection = ({ studentName, studentNumber, formationYear, completedObjectives, objectiveSteps = {}, language = 'it' }) => {
  const t = (key) => translate(key, language);
  const [exportStatus, setExportStatus] = useState(null);
  const [pdfOptions, setPdfOptions] = useState({
    includeStats: true,
    includeDetails: true,
    includeCharts: false
  });

  const handleExport = async (format) => {
    try {
      setExportStatus({ type: 'loading', message: t('export.loading') });
      
      let result;
      switch (format) {
        case 'pdf':
          result = await exportToPDF(studentName, studentNumber, formationYear, completedObjectives, pdfOptions, objectiveSteps, language);
          break;
        case 'excel':
          result = await exportToExcel(studentName, studentNumber, formationYear, completedObjectives, language);
          break;
        case 'csv':
          result = await exportToCSV(studentName, studentNumber, formationYear, completedObjectives, language);
          break;
        case 'txt':
          result = await exportToTXT(studentName, studentNumber, formationYear, completedObjectives, language);
          break;
        default:
          throw new Error('Formato non supportato');
      }

      if (result && result.success) {
        setExportStatus({ 
          type: 'success', 
          message: t('export.success') 
        });
        
        setTimeout(() => setExportStatus(null), 3000);
      } else {
        throw new Error('Export fallito');
      }
    } catch (error) {
      console.error('Errore durante export:', error);
      setExportStatus({ 
        type: 'error', 
        message: t('export.error')
      });
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  const togglePdfOption = (option) => {
    setPdfOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  return (
    <section className="export-section">
      <div className="section-title">
        <FileDown size={24} />
        {t('export.title')}
      </div>

      {exportStatus && (
        <motion.div 
          className={`export-status ${exportStatus.type}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {exportStatus.type === 'success' && <CheckCircle size={20} />}
          <span>{exportStatus.message}</span>
        </motion.div>
      )}

      <div className="export-options-grid">
        <motion.div 
          className="export-card"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="export-card-header">
            <FileText size={32} style={{ color: '#ef4444' }} />
            <h3>{t('export.pdf.title')}</h3>
          </div>
          <p className="export-description">
            {t('export.pdf.desc')}
          </p>
          
          <div className="pdf-options">
            <label className="pdf-option">
              <input 
                type="checkbox" 
                checked={pdfOptions.includeStats}
                onChange={() => togglePdfOption('includeStats')}
              />
              <span>{t('export.pdf.includeStats')}</span>
            </label>
            <label className="pdf-option">
              <input 
                type="checkbox" 
                checked={pdfOptions.includeDetails}
                onChange={() => togglePdfOption('includeDetails')}
              />
              <span>{t('export.pdf.includeDetails')}</span>
            </label>
          </div>

          <button 
            className="export-button pdf"
            onClick={() => handleExport('pdf')}
          >
            <Download size={18} />
            {t('export.pdf.download')}
          </button>
        </motion.div>

        <motion.div 
          className="export-card"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="export-card-header">
            <FileSpreadsheet size={32} style={{ color: '#22c55e' }} />
            <h3>{t('export.excel.title')}</h3>
          </div>
          <p className="export-description">
            {t('export.excel.desc')}
          </p>
          <button 
            className="export-button excel"
            onClick={() => handleExport('excel')}
          >
            <Download size={18} />
            {t('export.excel.download')}
          </button>
        </motion.div>

        <motion.div 
          className="export-card"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="export-card-header">
            <FileText size={32} style={{ color: '#3b82f6' }} />
            <h3>{t('export.csv.title')}</h3>
          </div>
          <p className="export-description">
            {t('export.csv.desc')}
          </p>
          <button 
            className="export-button csv"
            onClick={() => handleExport('csv')}
          >
            <Download size={18} />
            {t('export.csv.download')}
          </button>
        </motion.div>

        <motion.div 
          className="export-card"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="export-card-header">
            <FileText size={32} style={{ color: '#8b5cf6' }} />
            <h3>{t('export.txt.title')}</h3>
          </div>
          <p className="export-description">
            {t('export.txt.desc')}
          </p>
          <button 
            className="export-button txt"
            onClick={() => handleExport('txt')}
          >
            <Download size={18} />
            {t('export.txt.download')}
          </button>
        </motion.div>
      </div>

      <div className="export-info">
        <p>
          {t('export.info')}
        </p>
      </div>
    </section>
  );
};

export default ExportSection;
