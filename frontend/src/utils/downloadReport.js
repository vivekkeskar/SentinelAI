
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function downloadReport(report) {
  if (!report) return;

  const pdf = new jsPDF();
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const M = 18;
  const maxWidth = W - M * 2;
  const bottom = H - 22;

  const navy = [15, 23, 42];
  const blue = [2, 132, 199];
  const gray = [71, 85, 105];

  const id = report.incident_id ?? report.id ?? "Unknown";
  let y = 55;

  function clean(value) {
    return String(value ?? "Not available")
      .replace(/\r/g, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u2013\u2014]/g, "-")
      .replace(/\u2022/g, "-")
      .replace(/\u2192/g, "->")
      .replace(/\u2265/g, ">=")
      .replace(/\u2264/g, "<=")
      .replace(/[\u2705\u274c\u26a0\ufe0f]/g, "")
      .replace(/[^\x09\x0a\x0d\x20-\x7e\xa0-\xff]/g, "")
      .replace(/\*\*/g, "")
      .replace(/__/g, "")
      .replace(/`/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  }

  function newPage(space = 10) {
    if (y + space > bottom) {
      pdf.addPage();
      y = 22;
    }
  }

  function addText(value, options = {}) {
    const size = options.size ?? 10;
    const bold = options.bold ?? false;
    const indent = options.indent ?? 0;
    const color = options.color ?? gray;

    const content = clean(value).trim();
    if (!content) return;

    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    pdf.setTextColor(...color);

    const lines = pdf.splitTextToSize(
      content,
      maxWidth - indent
    );

    const lineHeight = size * 0.48 + 1;

    for (const line of lines) {
      newPage(lineHeight + 2);
      pdf.text(line, M + indent, y);
      y += lineHeight;
    }

    y += options.gap ?? 3;
  }

  function addHeading(value, level = 2) {
    newPage(18);
    y += 4;

    addText(value, {
      size: level === 1 ? 15 : level === 2 ? 12 : 10,
      bold: true,
      color: level === 1 ? blue : navy,
      gap: 5
    });
  }

  function addTable(lines) {
    const rows = lines.map((line) => {
      let row = line.trim();

      if (row.startsWith("|")) row = row.slice(1);
      if (row.endsWith("|")) row = row.slice(0, -1);

      return row.split("|").map((cell) => clean(cell.trim()));
    });

    const separator = (row) =>
      row.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));

    const head = rows[0];
    const body = rows.slice(
      rows[1] && separator(rows[1]) ? 2 : 1
    );

    if (!head.length || !body.length) {
      lines.forEach((line) => addText(line));
      return;
    }

    newPage(18);

    autoTable(pdf, {
      startY: y,
      head: [head],
      body,
      theme: "grid",
      margin: {
        left: M,
        right: M,
        top: 22,
        bottom: 22
      },
      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 3,
        overflow: "linebreak",
        valign: "top",
        textColor: navy,
        lineColor: [226, 232, 240],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: navy,
        textColor: [255, 255, 255],
        fontStyle: "bold"
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      showHead: "everyPage"
    });

    y = pdf.lastAutoTable.finalY + 7;
  }

  function addMarkdown(content) {
    const lines = String(content ?? "Not available")
      .replace(/\r/g, "")
      .split("\n");

    let i = 0;
    let inCode = false;

    while (i < lines.length) {
      const line = lines[i].trim();

      if (line.startsWith("```")) {
        inCode = !inCode;
        i++;
        continue;
      }

      if (!line) {
        y += 2;
        i++;
        continue;
      }

      if (inCode) {
        addText(line, {
          size: 8,
          indent: 4,
          gap: 1
        });
        i++;
        continue;
      }

      const heading = line.match(/^(#{1,6})\s+(.+)$/);

      if (heading) {
        addHeading(heading[2], heading[1].length);
        i++;
        continue;
      }

      if (/^[-*_]{3,}$/.test(line)) {
        newPage(8);
        pdf.setDrawColor(226, 232, 240);
        pdf.line(M, y, W - M, y);
        y += 7;
        i++;
        continue;
      }

      if (line.includes("|")) {
        const rows = [];
        let j = i;

        while (
          j < lines.length &&
          lines[j].trim() &&
          lines[j].includes("|")
        ) {
          rows.push(lines[j]);
          j++;
        }

        const isTable =
          rows.length >= 3 &&
          /^\s*\|?[\s:|-]+\|?\s*$/.test(rows[1]) &&
          rows[1].includes("---");

        if (isTable) {
          addTable(rows);
          i = j;
          continue;
        }
      }

      const bullet = line.match(/^([-*+]|\d+[.)])\s+(.+)$/);

      if (bullet) {
        addText(`${bullet[1]} ${bullet[2]}`, {
          indent: 4,
          gap: 2
        });
        i++;
        continue;
      }

      if (line.startsWith(">")) {
        addText(line.replace(/^>\s*/, ""), {
          indent: 5,
          color: blue
        });
        i++;
        continue;
      }

      addText(line);
      i++;
    }
  }

  function addSection(title, content) {
    newPage(30);
    y += 6;

    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(M, y - 7, maxWidth, 14, 2, 2, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(...navy);
    pdf.text(title, M + 5, y + 2);

    y += 16;
    addMarkdown(content);
  }

  // Report header
  pdf.setFillColor(...navy);
  pdf.rect(0, 0, W, 43, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(23);
  pdf.setTextColor(255, 255, 255);
  pdf.text("SentinelAI", M, 20);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text(
    "AI-Powered Incident Investigation Report",
    M,
    30
  );

  addHeading("Investigation Report", 1);

  addText(`Incident ID: ${id}`, {
    size: 11,
    bold: true,
    color: navy
  });

  addText(`Generated: ${new Date().toLocaleString()}`, {
    size: 9
  });

  addText("Status: Analysis Completed", {
    size: 9,
    color: blue
  });

  // Report sections
  if (report.logs) {
    addSection("01  Original Production Logs", report.logs);
  }

  addSection("02  Log Analysis", report.log_analysis);
  addSection("03  Root Cause Analysis", report.root_cause);
  addSection("04  Recommended Solutions", report.solution);

  if (Array.isArray(report.rag_sources) && report.rag_sources.length) {
    addSection(
      "05  Knowledge Base References",
      report.rag_sources
        .map((source, index) => `${index + 1}. ${source}`)
        .join("\n")
    );
  }

  // Footer on every page
  const pages = pdf.internal.getNumberOfPages();

  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p);

    pdf.setDrawColor(226, 232, 240);
    pdf.line(M, H - 17, W - M, H - 17);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);

    pdf.text(
      "SentinelAI | AI Incident Investigation",
      M,
      H - 11
    );

    pdf.text(
      `Page ${p} of ${pages}`,
      W - M,
      H - 11,
      { align: "right" }
    );
  }

  pdf.save(`SentinelAI_Incident_${id}.pdf`);
}

