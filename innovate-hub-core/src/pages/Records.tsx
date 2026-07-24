import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import axios from "../lib/axios";
import { FileDown } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface BookingRecord {
  _id: string;
  team: {
    _id: string;
    name: string;
    teamName: string;
    email: string;
  };
  room: {
    _id: string;
    name: string;
  };
  teamSize: number;
  slotDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
  actualEntryTime?: string | null;
  actualExitTime?: string | null;
}

const filters = [
  { value: "daily", label: "Daily (Today)" },
  { value: "weekly", label: "Last 7 Days" },
  { value: "monthly", label: "Last 30 Days" },
  { value: "last3months", label: "Last 3 Months" },
  { value: "last6months", label: "Last 6 Months" },
  { value: "last9months", label: "Last 9 Months" },
  { value: "last12months", label: "Last 12 Months" },
  { value: "yearly", label: "Yearly" },
];

const Records = () => {
  const [filter, setFilter] = useState("daily");
  const [records, setRecords] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [filter]);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`/bookings/records?filter=${filter}`);
      setRecords(res.data);
    } catch (error) {
      console.error("Failed to fetch records", error);
      toast.error("Failed to fetch booking records");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDuration = (record: BookingRecord) => {
    // For now, based on scheduled time. Actual duration calc would require valid actualEntry/Exit times.
    const start = parseInt(record.startTime.split(':')[0]) * 60 + parseInt(record.startTime.split(':')[1]);
    const end = parseInt(record.endTime.split(':')[0]) * 60 + parseInt(record.endTime.split(':')[1]);
    const diff = end - start;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return "-";
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text("AICTE IDEA Lab - Booking Records Report", 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Report Filter: ${filters.find(f => f.value === filter)?.label}`, 14, 30);
    doc.text(`Generated On: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 36);
    
    doc.text(`Total Bookings: ${records.length}`, 14, 44);

    const tableColumn = [
        "Team", "Size", "Room", "Date", "Time", "Status", "Entry", "Exit"
    ];

    const tableRows = records.map(record => [
        record.team.teamName || record.team.name,
        record.teamSize,
        record.room?.name || 'Unknown',
        record.slotDate,
        `${record.startTime} - ${record.endTime}`,
        record.status,
        formatTime(record.actualEntryTime),
        formatTime(record.actualExitTime)
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 50,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [66, 66, 66] }
    });

    doc.save(`booking_records_${filter}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
           <h1 className="text-3xl font-bold">Booking Records</h1>
           <p className="text-muted-foreground mt-1">View and export detailed team activity reports.</p>
        </div>
        <div className="flex gap-2 items-center">
            <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Duration" />
                </SelectTrigger>
                <SelectContent>
                    {filters.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Button onClick={handleExportPDF} variant="outline" className="gap-2">
                <FileDown className="h-4 w-4" />
                Export PDF
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
           <CardTitle className="text-lg">Detailed Records</CardTitle>
        </CardHeader>
        <CardContent>
           {isLoading ? (
               <div className="text-center py-8">Loading records...</div>
           ) : records.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground">No records found for this time period.</div>
           ) : (
               <div className="rounded-md border">
                   <Table>
                       <TableHeader>
                           <TableRow>
                               <TableHead>Team Name</TableHead>
                               <TableHead>Members</TableHead>
                               <TableHead>Room</TableHead>
                               <TableHead>Project</TableHead>
                               <TableHead>Date & Time</TableHead>
                               <TableHead>Duration</TableHead>
                               <TableHead>Status</TableHead>
                               <TableHead>Actual Entry</TableHead>
                               <TableHead>Actual Exit</TableHead>
                           </TableRow>
                       </TableHeader>
                       <TableBody>
                           {records.map((record) => (
                               <TableRow key={record._id}>
                                   <TableCell className="font-medium">
                                       <div>{record.team.teamName}</div>
                                       <div className="text-xs text-muted-foreground">{record.team.email}</div>
                                   </TableCell>
                                   <TableCell>{record.teamSize}</TableCell>
                                   <TableCell>{record.room?.name}</TableCell>
                                   <TableCell className="max-w-[150px] truncate" title={record.purpose}>{record.purpose}</TableCell>
                                   <TableCell>
                                       <div className="whitespace-nowrap">{record.slotDate}</div>
                                       <div className="text-xs text-muted-foreground">{record.startTime} - {record.endTime}</div>
                                   </TableCell>
                                   <TableCell>{calculateDuration(record)}</TableCell>
                                   <TableCell>
                                       <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize
                                           ${record.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                             record.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                                             record.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                             record.status === 'overstayed' ? 'bg-orange-100 text-orange-800' :
                                             'bg-yellow-100 text-yellow-800'}`}
                                        >
                                           {record.status}
                                       </span>
                                   </TableCell>
                                   <TableCell>{formatTime(record.actualEntryTime)}</TableCell>
                                   <TableCell>{formatTime(record.actualExitTime)}</TableCell>
                               </TableRow>
                           ))}
                       </TableBody>
                   </Table>
               </div>
           )}
        </CardContent>
      </Card>
      <div className="mt-4 text-xs text-muted-foreground text-center">
         Use filters above to view historical data. Secure PDF export available.
      </div>
    </div>
  );
};

export default Records;
