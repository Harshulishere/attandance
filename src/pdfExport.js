import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Builds and downloads a spreadsheet-style attendance PDF for one class,
// for whichever month is passed in (year, month are 1-based month).
export function exportAttendancePDF({ className, year, month, roster, sessions }) {
  const monthSessions = sessions
    .filter((s) => {
      const d = new Date(s.date + "T00:00:00");
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const doc = new jsPDF({ orientation: monthSessions.length > 6 ? "landscape" : "portrait" });

  doc.setFontSize(16);
  doc.text(`${className} — Attendance`, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(monthLabel, 14, 22);

  if (monthSessions.length === 0) {
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.text("No sessions logged for this month.", 14, 34);
    doc.save(`${className.replace(/\s+/g, "-")}-${year}-${String(month).padStart(2, "0")}-attendance.pdf`);
    return;
  }

  const dateCols = monthSessions.map((s) => {
    const d = new Date(s.date + "T00:00:00");
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  });

  const head = [["Player", ...dateCols, "Total"]];
  const body = roster.map((student) => {
    let total = 0;
    const marks = monthSessions.map((s) => {
      const present = s.presentIds.includes(student.id);
      if (present) total += 1;
      return present ? "\u2713" : "";
    });
    return [student.name, ...marks, String(total)];
  });

  const totalsRow = [
    "Present",
    ...monthSessions.map((s) => String(s.presentIds.length)),
    String(body.reduce((sum, row) => sum + Number(row[row.length - 1]), 0)),
  ];
  body.push(totalsRow);

  autoTable(doc, {
    head,
    body,
    startY: 28,
    styles: { fontSize: 9, cellPadding: 3, halign: "center" },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 }, // blue-600
    columnStyles: { 0: { halign: "left", fontStyle: "bold" } },
    didParseCell: (data) => {
      if (data.row.index === body.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [239, 246, 255]; // blue-50
      }
    },
  });

  doc.save(`${className.replace(/\s+/g, "-")}-${year}-${String(month).padStart(2, "0")}-attendance.pdf`);
}
