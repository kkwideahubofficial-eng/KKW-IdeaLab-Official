import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Loader2, FileDown, RefreshCw } from "lucide-react";

interface BookingHistoryEntry {
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  by?: string;
  at: string;
}

interface Booking {
  _id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  history?: BookingHistoryEntry[];
}

interface MachineryRequest {
  _id: string;
  projectName: string;
  projectDescription: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  rejectionReason?: string;
  requestedMachines?: {
    machineId: any;
    machineName: string;
    machineUnitNumber?: number;
    usageDate: string;
    startTime: string;
    endTime: string;
    purposeOfUsage: string;
  }[];
}

const MyBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [machineryRequests, setMachineryRequests] = useState<MachineryRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const downloadPdf = async (type: 'room' | 'machinery', id: string, name: string) => {
    setDownloadingId(id);
    try {
      const endpoint = type === 'room' ? `/bookings/${id}/pdf` : `/machinery/requests/${id}/pdf`;
      const response = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${name}_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully!');
    } catch {
      toast.error('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHistoryData = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const [bookingsRes, machineryRes] = await Promise.all([
        api.get("/bookings/my-history"),
        api.get("/machinery/requests") // Student gets their own requests
      ]);
      setBookings(bookingsRes.data.bookings || []);
      setMachineryRequests(machineryRes.data || []);
    } catch (error) {
      if (!isSilent) toast.error("Failed to fetch some history data.");
      console.error("Error fetching historyData:", error);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchHistoryData(true);
      toast.success("History data refreshed!");
    } catch {
      toast.error("Failed to refresh data");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchHistoryData(true).catch(err => console.error("Auto refresh history failed", err));
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const getNormalizedDate = (item: any): Date => {
    if ('slotDate' in item) return new Date(item.slotDate);
    if ('requestedMachines' in item && item.requestedMachines?.length > 0) return new Date(item.requestedMachines[0].usageDate);
    return new Date();
  };

  const isPast = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const filterData = <T extends { status: string }>(data: T[], status: string) => {
      if (status === 'all') return data;
      
      return data.filter(item => {
          const matchesStatus = item.status === status;
          if (!matchesStatus) return false;

          // For Approved and Pending, render only upcoming (or today's) items
          if (status === 'approved' || status === 'pending') {
              return !isPast(getNormalizedDate(item));
          }
          
          return true;
      });
  };

  const StatusTabs = ({ type }: { type: 'room' | 'machinery' }) => (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-4 max-w-[400px] mb-4">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="approved">Approved</TabsTrigger>
        <TabsTrigger value="rejected">Rejected</TabsTrigger>
      </TabsList>

      {(['all', 'pending', 'approved', 'rejected'] as const).map((key) => (
        <TabsContent key={key} value={key}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {type === 'room' ? (
                     filterData(bookings, key).length === 0 ? <p className="text-muted-foreground p-4">No {key === 'all' ? '' : key} bookings found.</p> :
                     filterData(bookings, key).map((booking) => (
                        <Card key={booking._id} className="overflow-hidden border-none shadow-sm ring-1 ring-border/50 h-full">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <Badge variant={getStatusVariant(booking.status)} className="capitalize px-3 py-1 rounded-full text-[10px] sm:text-xs">
                                        {booking.status}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Loader2 className="w-3 h-3" /> {format(new Date(booking.slotDate), 'dd/MM/yyyy')}
                                    </span>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-xl font-bold tracking-tight text-foreground">Room Booking</h3>
                                    <p className="text-sm text-muted-foreground">Coordinator Review</p>
                                </div>

                                <div className="bg-muted/30 rounded-lg p-4 grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Date</p>
                                        <p className="text-sm font-medium">{format(new Date(booking.slotDate), 'dd/MM/yyyy')}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Time</p>
                                        <p className="text-sm font-medium">{booking.startTime} - {booking.endTime}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Purpose</p>
                                    <p className="text-sm text-foreground italic">"{booking.purpose}"</p>
                                </div>

                                {booking.status === 'rejected' && booking.reason && (
                                    <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
                                        <strong>Rejection Reason:</strong> {booking.reason}
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2"
                                    disabled={downloadingId === booking._id}
                                    onClick={() => downloadPdf('room', booking._id, 'RoomBooking')}
                                  >
                                    {downloadingId === booking._id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <FileDown className="w-4 h-4" />
                                    )}
                                    Download Application PDF
                                  </Button>
                                </div>
                            </CardContent>
                        </Card>
                     ))
                ) : (
                    filterData(machineryRequests, key).length === 0 ? <p className="text-muted-foreground p-4">No {key === 'all' ? '' : key} requests found.</p> :
                    filterData(machineryRequests, key).map((req) => {
                        const machine = req.requestedMachines?.[0];
                        const usageDate = machine?.usageDate ? new Date(machine.usageDate) : new Date();
                        const machineName = machine?.machineName || req.projectName || 'Machinery Request';
                        const purpose = machine?.purposeOfUsage || req.projectDescription || '';

                        return (
                        <Card key={req._id} className="overflow-hidden border-none shadow-sm ring-1 ring-border/50 h-full">
                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <Badge variant={getStatusVariant(req.status)} className="capitalize px-3 py-1 rounded-full text-[10px] sm:text-xs">
                                        {req.status}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Loader2 className="w-3 h-3" /> {format(usageDate, 'dd/MM/yyyy')}
                                    </span>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-xl font-bold tracking-tight text-foreground">{machineName}</h3>
                                    <p className="text-sm text-muted-foreground">Machinery Request</p>
                                </div>

                                <div className="bg-muted/30 rounded-lg p-4 grid grid-cols-3 gap-2 mb-6">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Date</p>
                                        <p className="text-sm font-medium">{format(usageDate, 'dd/MM/yyyy')}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Unit</p>
                                        <p className="text-sm font-medium">Unit #{machine?.machineUnitNumber || 1}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Time</p>
                                        <p className="text-sm font-medium">{machine?.startTime || 'N/A'} - {machine?.endTime || 'N/A'}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Purpose</p>
                                    <p className="text-sm text-foreground italic">"{purpose}"</p>
                                </div>

                                {req.status === 'rejected' && req.rejectionReason && (
                                    <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
                                        <strong>Rejection Reason:</strong> {req.rejectionReason}
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full gap-2"
                                    disabled={downloadingId === req._id}
                                    onClick={() => downloadPdf('machinery', req._id, machineName)}
                                  >
                                    {downloadingId === req._id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <FileDown className="w-4 h-4" />
                                    )}
                                    Download Application PDF
                                  </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )})
                )}
            </div>
        </TabsContent>
        ))}
    </Tabs>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold">My Bookings & Requests</h1>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 shadow-xs bg-white border border-border text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="machinery" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="machinery">Machinery Requests</TabsTrigger>
            <TabsTrigger value="rooms">Room Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="rooms" className="mt-4">
           <StatusTabs type="room" />
        </TabsContent>

        <TabsContent value="machinery" className="mt-4">
           <StatusTabs type="machinery" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyBookings;
