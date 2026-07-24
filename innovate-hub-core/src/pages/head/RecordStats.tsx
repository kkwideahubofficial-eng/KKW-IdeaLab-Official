import { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Download } from "lucide-react";
import { toast } from "sonner";

interface MachineryRecord {
  _id: string;
  machineryId: {
    _id: string;
    name: string;
  };
  studentId: {
    name: string;
    email: string;
    teamName?: string;
  };
  teamMembers: { name: string; branch: string; year: string; mobile?: string; email?: string }[];
  usageDate: string;
  startTime: string;
  endTime: string;
  actualEntryTime?: string;
  actualExitTime?: string;
  status: string;
}

const RecordStats = () => {
  const [records, setRecords] = useState<MachineryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("daily");

  const filters = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Last 3 Months", value: "last3months" },
    { label: "Last 6 Months", value: "last6months" },
    { label: "Last 9 Months", value: "last9months" },
    { label: "Last 12 Months", value: "last12months" },
    { label: "Yearly", value: "yearly" },
  ];

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/machinery/records?filter=${filter}`);
      setRecords(res.data);
    } catch (error) {
      console.error("Failed to fetch records", error);
      toast.error("Failed to fetch records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [filter]);



  const loadImage = (url: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  };

  const handleDownload = async () => {
    if (records.length === 0) return toast.error("No records to export");

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const filterLabel = filters.find(f => f.value === filter)?.label || filter;
    const generatedAt = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

    // Load Logo dynamically
    let logoImg = await loadImage("/uploaded-logo.png");
    if (!logoImg) logoImg = await loadImage("/uploaded-logo.jpg");
    if (!logoImg) logoImg = await loadImage("/logo.png");

    // Top Institutional Header Bar (Slate 900)
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 36, "F");

    // Amber Accent Divider Line
    doc.setFillColor(217, 119, 6);
    doc.rect(0, 36, 210, 2, "F");

    // Render Right-Side Logo Badge
    if (logoImg) {
      try {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(172, 5, 24, 24, 3, 3, "F");
        doc.addImage(logoImg, "PNG", 173, 6, 22, 22);
      } catch (e) {
        console.error("Failed to render right-side logo:", e);
      }
    }

    // Header Titles & AICTE IDEA Lab Branding
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.text("K. K. WAGH INSTITUTE OF ENGINEERING EDUCATION & RESEARCH", 14, 13);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(251, 191, 36); // Amber-400
    doc.text("AICTE IDEA LAB — MACHINERY USAGE & ATTENDANCE REPORT", 14, 21);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(203, 213, 225);
    doc.text("Center for Prototyping, Innovation & Multi-Disciplinary Fabrication", 14, 27);

    // Summary Info Card Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 43, 182, 22, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`REPORT FILTER: ${filterLabel.toUpperCase()}`, 18, 51);
    doc.text(`TOTAL LOGGED RECORDS: ${records.length}`, 18, 59);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`GENERATED ON: ${generatedAt}`, 110, 51);
    doc.text(`STATUS: OFFICIAL AUDIT RECORD`, 110, 59);

    // Define Columns
    const tableColumn = ["Date", "Machine Name", "Student Name", "Team", "Slot Time", "Entry", "Exit", "Status"];
    
    // Define Rows
    const tableRows = records.map(record => [
      format(new Date(record.usageDate), 'dd/MM/yyyy'),
      record.machineryId?.name || "N/A",
      record.studentId?.name || "N/A",
      record.studentId?.teamName || "-",
      `${record.startTime} - ${record.endTime}`,
      record.actualEntryTime ? new Date(record.actualEntryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-",
      record.actualExitTime ? new Date(record.actualExitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "-",
      record.status
    ]);

    // Generate Table
    autoTable(doc, {
      startY: 71,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
        cellPadding: 2.5
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 35 },
        2: { cellWidth: 32 },
        3: { cellWidth: 22 },
        4: { cellWidth: 24, halign: 'center' },
        5: { cellWidth: 15, halign: 'center' },
        6: { cellWidth: 15, halign: 'center' },
        7: { cellWidth: 27, halign: 'center', fontStyle: 'bold' }
      },
      didDrawPage: (data) => {
        const totalPages = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          "Official Audit Document • AICTE IDEA Lab • KKWIEER Nashik",
          14,
          doc.internal.pageSize.height - 10
        );
        doc.text(
          `Page ${data.pageNumber} of ${totalPages}`,
          doc.internal.pageSize.width - 28,
          doc.internal.pageSize.height - 10
        );
      }
    });

    // Save PDF
    doc.save(`AICTE_IDEALab_Machinery_Records_${filter}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight">Machinery Records & Attendance</h1>
           <p className="text-muted-foreground">View machinery usage logs and student attendance.</p>
        </div>
        <Button variant="outline" onClick={handleDownload} disabled={loading || records.length === 0}>
            <Download className="w-4 h-4 mr-2" /> Download PDF
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => (
            <Button 
                key={f.value} 
                variant={filter === f.value ? "default" : "secondary"}
                onClick={() => setFilter(f.value)}
                size="sm"
            >
                {f.label}
            </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
           <CardTitle>{filters.find(f => f.value === filter)?.label} Records</CardTitle>
           <CardDescription>Showing {records.length} records found for this period.</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : records.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">No records found for this period.</div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Machine</TableHead>
                                <TableHead>Student / Team</TableHead>
                                <TableHead>Slot Time</TableHead>
                                <TableHead>Entry / Exit</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {records.map((record) => (
                                <TableRow key={record._id}>
                                    <TableCell className="whitespace-nowrap font-medium">
                                        {format(new Date(record.usageDate), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-semibold">{record.machineryId?.name || 'Unknown Machine'}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium text-sm">{record.studentId?.name || 'Unknown Student'}</div>
                                        {record.studentId?.teamName && <div className="text-xs text-muted-foreground">{record.studentId.teamName}</div>}
                                        <div className="text-xs text-muted-foreground mt-0.5">{record.teamMembers?.length || 0} Members</div>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">
                                        {record.startTime} - {record.endTime}
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs">
                                            <span className="text-green-600 font-medium">In:</span> {record.actualEntryTime ? new Date(record.actualEntryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                        </div>
                                        <div className="text-xs">
                                             <span className="text-red-500 font-medium">Out:</span> {record.actualExitTime ? new Date(record.actualExitTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={record.status === 'approved' ? 'default' : record.status === 'pending' ? 'outline' : 'secondary'}>
                                            {record.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecordStats;
