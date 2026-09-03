import jsPDF from 'jspdf';
import { Message } from '../types';

export function exportConversationToPDF(
  sessionTitle: string,
  messages: Message[],
  userName: string = 'User'
) {
  if (!messages || messages.length === 0) {
    alert('No messages to export in this conversation.');
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  // Color palette
  const primaryColor = [66, 133, 244]; // #4285f4
  const darkTextColor = [33, 37, 41];
  const mutedTextColor = [108, 117, 125];
  const userBgColor = [241, 245, 249];
  const botBgColor = [248, 250, 252];
  const borderColor = [226, 232, 240];

  // Helper to check page break
  function checkPageBreak(requiredHeight: number) {
    if (cursorY + requiredHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
      return true;
    }
    return false;
  }

  // --- Header ---
  doc.setFillColor(19, 19, 20);
  doc.roundedRect(margin, cursorY, contentWidth, 24, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INFBOTT', margin + 6, cursorY + 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text('Intelligent AI Assistant — Conversation Export', margin + 6, cursorY + 17);

  const exportDate = new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  doc.setFontSize(8);
  doc.text(`Date: ${exportDate}`, pageWidth - margin - 6, cursorY + 10, { align: 'right' });
  doc.text(`Total Messages: ${messages.length}`, pageWidth - margin - 6, cursorY + 17, { align: 'right' });

  cursorY += 30;

  // --- Session Title Bar ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
  doc.text(`Topic: ${sessionTitle || 'New Conversation'}`, margin, cursorY);
  cursorY += 6;

  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 8;

  // --- Messages ---
  messages.forEach((msg, index) => {
    const isUser = msg.role === 'user';
    const roleLabel = isUser ? `👤 ${userName}` : '⚡ INFBOTT';
    const dateStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    // Sanitize message content from basic Markdown markers for clean PDF rendering
    const cleanContent = msg.content
      .replace(/```[a-zA-Z]*\n/g, '')
      .replace(/```/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s?/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const textLines = doc.splitTextToSize(cleanContent || '(empty message)', contentWidth - 12);
    const textBlockHeight = textLines.length * 4.5;
    const totalBoxHeight = textBlockHeight + 16;

    // Check if we need a new page
    checkPageBreak(Math.min(totalBoxHeight, 50));

    // Message Container Box
    if (isUser) {
      doc.setFillColor(userBgColor[0], userBgColor[1], userBgColor[2]);
      doc.setDrawColor(203, 213, 225);
    } else {
      doc.setFillColor(botBgColor[0], botBgColor[1], botBgColor[2]);
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    }

    doc.roundedRect(margin, cursorY, contentWidth, totalBoxHeight, 2, 2, 'FD');

    // Role & Time Header inside box
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    if (isUser) {
      doc.setTextColor(71, 85, 105);
    } else {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    }
    doc.text(roleLabel, margin + 4, cursorY + 6);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text(dateStr, pageWidth - margin - 4, cursorY + 6, { align: 'right' });

    // Inner divider
    doc.setDrawColor(230, 235, 240);
    doc.setLineWidth(0.3);
    doc.line(margin + 4, cursorY + 8.5, pageWidth - margin - 4, cursorY + 8.5);

    // Text Lines
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);

    let textY = cursorY + 14;
    textLines.forEach((line: string) => {
      if (textY > pageHeight - margin) {
        doc.addPage();
        textY = margin + 6;
      }
      doc.text(line, margin + 4, textY);
      textY += 4.5;
    });

    cursorY += totalBoxHeight + 6;
  });

  // --- Add Page Numbers ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
    doc.text(
      `INFBOTT AI Conversation • Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // Safe file name
  const safeTitle = (sessionTitle || 'conversation')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);
  const filename = `infbott-${safeTitle}-${new Date().toISOString().slice(0, 10)}.pdf`;

  doc.save(filename);
}
