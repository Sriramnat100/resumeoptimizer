/**
 * PDF Generation Utilities
 * Handles resume PDF export functionality
 */

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Download the current resume as a PDF
 * @param {Object} currentDocument - The current resume document
 * @returns {Promise<void>}
 */
export const downloadPDF = async (currentDocument) => {
  if (!currentDocument) {
    console.warn('No document available for PDF generation');
    return;
  }
  
  try {
    console.log('📄 [PDF] Starting PDF generation for:', currentDocument.title);
    
    // Create a temporary div to render the resume for PDF
    const resumeElement = document.querySelector('.resume-container');
    if (!resumeElement) {
      console.error('❌ [PDF] Resume container not found');
      throw new Error('Resume container not found');
    }

    // Hide the AI assistant so it doesn't show up in the PDF
    const aiAssistant = document.querySelector('.w-96.border-l.border-gray-200');
    const originalDisplay = aiAssistant ? aiAssistant.style.display : '';
    if (aiAssistant) {
      aiAssistant.style.display = 'none';
      console.log('📄 [PDF] Hidden AI assistant for PDF generation');
    }

    // Use html2canvas to capture the resume with optimized settings
    console.log('📄 [PDF] Capturing resume with html2canvas...');
    const canvas = await html2canvas(resumeElement, {
      scale: 1.5, // Better quality than 1, but not as heavy as 2
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      removeContainer: true,
      width: resumeElement.offsetWidth,
      height: resumeElement.offsetHeight,
      // Better rendering options
      foreignObjectRendering: false,
      imageTimeout: 0,
      onclone: (clonedDoc) => {
        // Ensure proper styling in the cloned document
        const clonedResume = clonedDoc.querySelector('.resume-container');
        if (clonedResume) {
          clonedResume.style.width = '100%';
          clonedResume.style.maxWidth = '800px';
          clonedResume.style.margin = '0 auto';
          clonedResume.style.padding = '20px';
          clonedResume.style.backgroundColor = '#ffffff';
        }
      }
    });

    console.log('📄 [PDF] Canvas captured successfully');

    // Restore AI Assistant visibility
    if (aiAssistant) {
      aiAssistant.style.display = originalDisplay;
      console.log('📄 [PDF] Restored AI assistant visibility');
    }

    // Convert canvas to PDF with better quality
    console.log('📄 [PDF] Converting to PDF...');
    const imgData = canvas.toDataURL('image/png'); // Use PNG for better text quality
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Generate filename
    const filename = `${currentDocument.title || 'resume'}.pdf`;
    
    // Download the PDF
    pdf.save(filename);
    console.log('✅ [PDF] PDF downloaded successfully:', filename);
    
  } catch (error) {
    console.error('❌ [PDF] Error generating PDF:', error);
    throw new Error('Failed to generate PDF. Please try again.');
  }
};

/**
 * Check if PDF generation is supported in the current environment
 * @returns {boolean} Whether PDF generation is available
 */
export const isPDFSupported = () => {
  return typeof window !== 'undefined' && 
         typeof document !== 'undefined' && 
         typeof html2canvas !== 'undefined' && 
         typeof jsPDF !== 'undefined';
};

/**
 * Get PDF generation status and requirements
 * @returns {Object} Status information about PDF generation
 */
export const getPDFStatus = () => {
  return {
    supported: isPDFSupported(),
    hasDocument: true, // This would be passed in
    hasResumeContainer: !!document.querySelector('.resume-container'),
    requirements: {
      html2canvas: typeof html2canvas !== 'undefined',
      jsPDF: typeof jsPDF !== 'undefined',
      browser: typeof window !== 'undefined'
    }
  };
}; 