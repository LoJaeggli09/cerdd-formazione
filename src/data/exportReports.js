import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { trainingPlan } from './trainingPlan';
import { translate } from '../i18n';

const getLocaleByLanguage = (language = 'it') => {
  const localeMap = {
    it: 'it-IT',
    en: 'en-US',
    de: 'de-DE',
    fr: 'fr-FR'
  };
  return localeMap[language] || 'it-IT';
};

const getFieldName = (field, language = 'it') => {
  const key = `field.${field.id}.name`;
  const translated = translate(key, language);
  return translated === key ? field.name : translated;
};

const getObjectiveText = (objective, language = 'it') => {
  const key = `objective.${objective.id}`;
  const translated = translate(key, language);
  return translated === key ? objective.text : translated;
};

/**
 * Esporta il report in formato PDF con grafici e statistiche
 */
export const exportToPDF = async (studentName, studentNumber, formationYear, completedObjectives, options = {}, objectiveSteps = {}, language = 'it') => {
  return new Promise((resolve, reject) => {
    try {
      const t = (key) => translate(key, language);
      const locale = getLocaleByLanguage(language);
      const pdf = new jsPDF();
      const runAutoTable = (tableOptions) => {
        if (typeof pdf.autoTable === 'function') {
          pdf.autoTable(tableOptions);
        } else {
          autoTable(pdf, tableOptions);
        }
      };
      const getLastTableFinalY = () => {
        if (pdf.lastAutoTable && typeof pdf.lastAutoTable.finalY === 'number') {
          return pdf.lastAutoTable.finalY;
        }
        const internalLast = pdf.internal && pdf.internal.lastAutoTable;
        if (internalLast && typeof internalLast.finalY === 'number') {
          return internalLast.finalY;
        }
        return null;
      };
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Opzioni di personalizzazione
      const {
        includeStats = true,
        includeDetails = true,
        includeCharts = false
      } = options;

  // Header
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(t('export.report.title'), pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${t('export.report.generatedOn')}: ${new Date().toLocaleDateString(locale)}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 15;
  pdf.setDrawColor(33, 150, 243);
  pdf.setLineWidth(0.5);
  pdf.line(20, yPosition, pageWidth - 20, yPosition);
  
  // Informazioni studente
  yPosition += 10;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(t('export.report.studentInfo'), 20, yPosition);
  
  yPosition += 8;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${t('profile.name')}: ${studentName}`, 25, yPosition);
  
  yPosition += 6;
  pdf.text(`${t('profile.number')}: ${studentNumber}`, 25, yPosition);
  
  yPosition += 6;
  pdf.text(`${t('profile.year')}: ${formationYear || t('export.report.na')}`, 25, yPosition);
  
  yPosition += 12;

  // Calcola statistiche
  const fields = trainingPlan.competenceFields || [];
  let totalObjectives = 0;
  let completedCount = 0;
  const fieldStats = [];

  fields.forEach(field => {
    let fieldCompleted = 0;
    let fieldTotal = 0;
    
    // Itera su tutte le competenze del campo
    (field.competencies || []).forEach(competency => {
      (competency.objectives || []).forEach(objective => {
        fieldTotal++;
        if (completedObjectives[objective.id]) {
          fieldCompleted++;
        }
      });
    });
    
    const fieldPercentage = fieldTotal > 0 ? Math.round((fieldCompleted / fieldTotal) * 100) : 0;

    fieldStats.push({
      field: `${field.id} - ${getFieldName(field, language)}`,
      completed: fieldCompleted,
      total: fieldTotal,
      percentage: fieldPercentage
    });

    totalObjectives += fieldTotal;
    completedCount += fieldCompleted;
  });

  const overallPercentage = totalObjectives > 0 ? Math.round((completedCount / totalObjectives) * 100) : 0;

  // Statistiche generali
  if (includeStats) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(t('export.report.generalStats'), 20, yPosition);
    
    yPosition += 8;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${t('export.report.overallProgress')}: ${overallPercentage}%`, 25, yPosition);
    
    yPosition += 6;
    pdf.text(`${t('export.report.completedObjectives')}: ${completedCount} / ${totalObjectives}`, 25, yPosition);
    
    yPosition += 6;
    pdf.text(`${t('export.report.remainingObjectives')}: ${totalObjectives - completedCount}`, 25, yPosition);
    
    yPosition += 6;
    const completedFields = fieldStats.filter(f => f.percentage === 100).length;
    pdf.text(`${t('export.report.completedFields')}: ${completedFields} / ${fields.length}`, 25, yPosition);
    
    yPosition += 12;
  }

  // Tabella progresso per campo
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(t('export.report.progressByField'), 20, yPosition);
  yPosition += 5;

  runAutoTable({
    startY: yPosition,
    head: [[t('export.report.field'), t('export.report.completed'), t('export.report.total'), t('export.report.progress')]],
    body: fieldStats.map(stat => [
      stat.field,
      stat.completed.toString(),
      stat.total.toString(),
      `${stat.percentage}%`
    ]),
    theme: 'grid',
    headStyles: { fillColor: [33, 150, 243], fontStyle: 'bold' },
    styles: {
      fontSize: 9,
      lineColor: [229, 231, 235],
      lineWidth: 0.15
    },
    bodyStyles: {
      fillColor: [255, 255, 255]
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 30, halign: 'center' }
    }
  });

  const firstTableFinalY = getLastTableFinalY();
  yPosition = (firstTableFinalY || yPosition) + 15;

  // Dettagli obiettivi per campo
  if (includeDetails) {
    fields.forEach((field, fieldIndex) => {
      // Controllo spazio pagina
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${field.id} - ${getFieldName(field, language)}`, 20, yPosition);
      yPosition += 5;

      // Raccogli tutti gli obiettivi del campo attraverso le competenze
      const objectiveData = [];
      (field.competencies || []).forEach(competency => {
        (competency.objectives || []).forEach(obj => {
          const steps = objectiveSteps[obj.id] || {};
          const spiegato = steps.spiegato ? 'V' : 'X';
          const esercitato = steps.esercitato ? 'V' : 'X';
          const autonomo = steps.autonomo ? 'V' : 'X';

          const objectiveText = getObjectiveText(obj, language);
          objectiveData.push([
            obj.id,
            objectiveText.substring(0, 80) + (objectiveText.length > 80 ? '...' : ''),
            spiegato,
            esercitato,
            autonomo,
            completedObjectives[obj.id] ? t('export.report.status.completed') : t('export.report.status.inProgress')
          ]);
        });
      });

      if (objectiveData.length === 0) return;

      runAutoTable({
        startY: yPosition,
        head: [[t('export.report.id'), t('export.report.description'), t('objectives.step.spiegato'), t('objectives.step.esercitato'), t('objectives.step.autonomo'), t('export.report.status')]],
        body: objectiveData,
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineColor: [229, 231, 235],
          lineWidth: 0.15
        },
        bodyStyles: {
          fillColor: [255, 255, 255]
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 95 },
          2: { cellWidth: 18, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 24, halign: 'center' }
        },
        didParseCell: function (data) {
          if (data.section === 'body' && [2, 3, 4].includes(data.column.index)) {
            if (data.cell.text[0] === 'V') {
              data.cell.styles.textColor = [46, 125, 50];
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [211, 47, 47];
              data.cell.styles.fontStyle = 'bold';
            }
          }

          if (data.section === 'body' && data.column.index === 5) {
            if (data.cell.text[0] === t('export.report.status.completed')) {
              data.cell.styles.textColor = [46, 125, 50]; // verde
              data.cell.styles.fontStyle = 'bold';
            } else {
              data.cell.styles.textColor = [211, 47, 47]; // rosso
            }
          }
        }
      });

      const detailTableFinalY = getLastTableFinalY();
      yPosition = (detailTableFinalY || yPosition) + 10;
    });
  }

  // Footer
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'italic');
    pdf.text(
      `${t('export.report.page')} ${i} ${t('export.report.of')} ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Salva il PDF
  const fileName = `report_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);

      resolve({ success: true, fileName });
    } catch (error) {
      console.error('Errore nella generazione PDF:', error);
      reject({ success: false, error: error.message });
    }
  });
};

/**
 * Esporta il report in formato Excel
 */
export const exportToExcel = async (studentName, studentNumber, formationYear, completedObjectives, language = 'it') => {
  return new Promise((resolve, reject) => {
    try {
      const t = (key) => translate(key, language);
      const locale = getLocaleByLanguage(language);
      const wb = XLSX.utils.book_new();

  // Sheet 1: Informazioni e statistiche generali
  const fields = trainingPlan.competenceFields || [];
  let totalObjectives = 0;
  let completedCount = 0;

  fields.forEach(field => {
    (field.competencies || []).forEach(competency => {
      (competency.objectives || []).forEach(objective => {
        totalObjectives++;
        if (completedObjectives[objective.id]) {
          completedCount++;
        }
      });
    });
  });

  const overallPercentage = totalObjectives > 0 ? Math.round((completedCount / totalObjectives) * 100) : 0;

  const infoData = [
    [t('export.report.title')],
    [],
    [t('export.report.studentInfo')],
    [t('profile.name'), studentName],
    [t('profile.number'), studentNumber],
    [t('profile.year'), formationYear || t('export.report.na')],
    [t('export.report.generatedDate'), new Date().toLocaleDateString(locale)],
    [],
    [t('export.report.generalStats')],
    [t('export.report.overallProgress'), `${overallPercentage}%`],
    [t('export.report.completedObjectives'), `${completedCount} / ${totalObjectives}`],
    [t('export.report.remainingObjectives'), totalObjectives - completedCount],
    [t('export.report.completedFields'), `${fields.filter(f => {
      let fieldTotal = 0;
      let fieldCompleted = 0;
      (f.competencies || []).forEach(c => {
        (c.objectives || []).forEach(obj => {
          fieldTotal++;
          if (completedObjectives[obj.id]) fieldCompleted++;
        });
      });
      return fieldTotal > 0 && fieldCompleted === fieldTotal;
    }).length} / ${fields.length}`]
  ];

  const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
  wsInfo['!cols'] = [{ wch: 25 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, t('export.report.sheet.info'));

  // Sheet 2: Riepilogo per campo
  const fieldSummary = [
    [t('export.report.field'), t('export.report.fieldId'), t('export.report.completed'), t('export.report.total'), `${t('export.report.progress')} %`]
  ];

  fields.forEach(field => {
    let fieldCompleted = 0;
    let fieldTotal = 0;
    (field.competencies || []).forEach(competency => {
      (competency.objectives || []).forEach(objective => {
        fieldTotal++;
        if (completedObjectives[objective.id]) {
          fieldCompleted++;
        }
      });
    });
    const fieldPercentage = fieldTotal > 0 ? Math.round((fieldCompleted / fieldTotal) * 100) : 0;

    fieldSummary.push([
      getFieldName(field, language),
      field.id,
      fieldCompleted,
      fieldTotal,
      fieldPercentage
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(fieldSummary);
  wsSummary['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, t('export.report.sheet.summary'));

  // Sheet 3: Dettaglio obiettivi
  const objectivesDetail = [
    [t('export.report.field'), t('export.report.objectiveId'), t('export.report.description'), t('export.report.status')]
  ];

  fields.forEach(field => {
    (field.competencies || []).forEach(competency => {
      (competency.objectives || []).forEach(obj => {
        objectivesDetail.push([
          `${field.id} - ${getFieldName(field, language)}`,
          obj.id,
          getObjectiveText(obj, language),
          completedObjectives[obj.id] ? t('export.report.status.completed') : t('export.report.status.inProgress')
        ]);
      });
    });
  });

  const wsDetails = XLSX.utils.aoa_to_sheet(objectivesDetail);
  wsDetails['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 80 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, wsDetails, t('export.report.sheet.details'));

  // Salva il file Excel
  const fileName = `report_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      resolve({ success: true, fileName });
    } catch (error) {
      console.error('Errore nella generazione Excel:', error);
      reject({ success: false, error: error.message });
    }
  });
};

/**
 * Esporta in formato CSV (semplice)
 */
export const exportToCSV = async (studentName, studentNumber, formationYear, completedObjectives, language = 'it') => {
  return new Promise((resolve, reject) => {
    try {
      const t = (key) => translate(key, language);
      const fields = trainingPlan.competenceFields || [];
  const rows = [
    [t('export.report.field'), t('export.report.objectiveId'), t('export.report.description'), t('export.report.status')]
  ];

  fields.forEach(field => {
    (field.competencies || []).forEach(competency => {
      (competency.objectives || []).forEach(obj => {
        rows.push([
          `${field.id} - ${getFieldName(field, language)}`,
          obj.id,
          getObjectiveText(obj, language),
          completedObjectives[obj.id] ? t('export.report.status.completed') : t('export.report.status.inProgress')
        ]);
      });
    });
  });

  const csvContent = rows.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  const fileName = `report_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      resolve({ success: true, fileName });
    } catch (error) {
      console.error('Errore nella generazione CSV:', error);
      reject({ success: false, error: error.message });
    }
  });
};

/**
 * Esporta in formato TXT (testo semplice)
 */
export const exportToTXT = async (studentName, studentNumber, formationYear, completedObjectives, language = 'it') => {
  return new Promise((resolve, reject) => {
    try {
      const t = (key) => translate(key, language);
      const locale = getLocaleByLanguage(language);
      const fields = trainingPlan.competenceFields || [];
  let totalObjectives = 0;
  let completedCount = 0;

  fields.forEach(field => {
    (field.competencies || []).forEach(competency => {
      (competency.objectives || []).forEach(objective => {
        totalObjectives++;
        if (completedObjectives[objective.id]) {
          completedCount++;
        }
      });
    });
  });

  const overallPercentage = totalObjectives > 0 ? Math.round((completedCount / totalObjectives) * 100) : 0;

  let textContent = '═══════════════════════════════════════════════════════\n';
  textContent += `           ${t('export.report.title').toUpperCase()}\n`;
  textContent += '═══════════════════════════════════════════════════════\n\n';

  textContent += `${t('export.report.studentInfo').toUpperCase()}\n`;
  textContent += '───────────────────────────────────────────────────────\n';
  textContent += `${t('profile.name')}: ${studentName}\n`;
  textContent += `${t('profile.number')}: ${studentNumber}\n`;
  textContent += `${t('profile.year')}: ${formationYear || t('export.report.na')}\n`;
  textContent += `${t('export.report.generatedDate')}: ${new Date().toLocaleDateString(locale)}\n\n`;

  textContent += `${t('export.report.generalStats').toUpperCase()}\n`;
  textContent += '───────────────────────────────────────────────────────\n';
  textContent += `${t('export.report.overallProgress')}: ${overallPercentage}%\n`;
  textContent += `${t('export.report.completedObjectives')}: ${completedCount} / ${totalObjectives}\n`;
  textContent += `${t('export.report.remainingObjectives')}: ${totalObjectives - completedCount}\n\n`;

  textContent += `${t('export.report.objectivesByField').toUpperCase()}\n`;
  textContent += '═══════════════════════════════════════════════════════\n\n';

  fields.forEach(field => {
    let fieldCompleted = 0;
    let fieldTotal = 0;
    const allObjectives = [];
    
    (field.competencies || []).forEach(competency => {
      (competency.objectives || []).forEach(objective => {
        fieldTotal++;
        allObjectives.push(objective);
        if (completedObjectives[objective.id]) {
          fieldCompleted++;
        }
      });
    });
    
    const fieldPercentage = fieldTotal > 0 ? Math.round((fieldCompleted / fieldTotal) * 100) : 0;

    textContent += `\n${field.id} - ${getFieldName(field, language)}\n`;
    textContent += `${t('export.report.progress')}: ${fieldPercentage}% (${fieldCompleted}/${fieldTotal})\n`;
    textContent += '───────────────────────────────────────────────────────\n';

    allObjectives.forEach(obj => {
      const status = completedObjectives[obj.id]
        ? `[✓] ${t('export.report.status.completed')}`
        : `[ ] ${t('export.report.status.inProgress')}`;
      textContent += `\n  ${obj.id}: ${status}\n`;
      textContent += `  ${getObjectiveText(obj, language)}\n`;
    });

    textContent += '\n';
  });

  textContent += '\n═══════════════════════════════════════════════════════\n';
  textContent += `                    ${t('export.report.end').toUpperCase()}\n`;
  textContent += '═══════════════════════════════════════════════════════\n';

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  const fileName = `report_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

      resolve({ success: true, fileName });
    } catch (error) {
      console.error('Errore nella generazione TXT:', error);
      reject({ success: false, error: error.message });
    }
  });
};
