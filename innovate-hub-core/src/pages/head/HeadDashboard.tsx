import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Settings, ListTodo, CheckCircle, XCircle, AlertTriangle, TrendingUp, 
  BarChart4, DollarSign, PieChart, Layers, Calendar, Activity, Key, ClipboardList
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/axios";

const HeadDashboard = () => {
  const [stats, setStats] = useState({
    machinesCount: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    conditionalCount: 0,
    budgetUsed: 24500, // Mock budget tracking
    allocatedMaterials: 0,
    machineUtilization: 78 // Mock utilization %
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [mRes, rRes] = await Promise.all([
          api.get('/machinery'),
          api.get('/machinery/requests')
        ]);
        
        const reqs = rRes.data;
        const pending = reqs.filter((r: any) => ['Submitted', 'Coordinator Review', 'Head Review', 'Student Resubmitted'].includes(r.status)).length;
        const approved = reqs.filter((r: any) => ['Approved', 'Material Allocated', 'Machine Scheduled', 'Completed'].includes(r.status)).length;
        const rejected = reqs.filter((r: any) => ['Rejected', 'Coordinator Rejected'].includes(r.status)).length;
        const conditional = reqs.filter((r: any) => r.status === 'Approved With Conditions').length;

        // Sum allocated materials count
        let allocatedMatsCount = 0;
        reqs.forEach((r: any) => {
          if (r.requestedMaterials) {
            r.requestedMaterials.forEach((m: any) => {
              allocatedMatsCount += m.quantityRequired;
            });
          }
        });

        setStats({
          machinesCount: mRes.data.length,
          pendingCount: pending,
          approvedCount: approved,
          rejectedCount: rejected,
          conditionalCount: conditional,
          budgetUsed: 24500 + (approved * 120), // Dynamically increments budget as simulation
          allocatedMaterials: allocatedMatsCount,
          machineUtilization: 78 + (approved > 0 ? 2 : 0)
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Idea Lab Head Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Review student prototype proposals, track resource allocations, and audit project deliverables.</p>
      </div>

      {/* Main Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Pending Reviews", value: stats.pendingCount, icon: ListTodo, color: "text-blue-600", bg: "bg-blue-50/50" },
          { label: "Approved Permissions", value: stats.approvedCount, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50/50" },
          { label: "Rejected Requests", value: stats.rejectedCount, icon: XCircle, color: "text-red-600", bg: "bg-red-50/50" },
          { label: "Conditional Approvals", value: stats.conditionalCount, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50/50" }
        ].map((card, idx) => (
          <Card key={idx} className="shadow-sm border-border/60 hover:shadow-md transition-shadow">
            <CardContent className="pt-6 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{card.label}</p>
                <p className="text-2xl font-extrabold text-foreground mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.bg}`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>



      {/* Quick Actions */}
      <Card className="shadow-sm border-border/80 w-full mb-8">
        <CardHeader><CardTitle className="text-base font-bold">Quick Actions</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/head/requests" className="block">
            <Button size="lg" className="w-full h-16 text-sm gap-2 font-semibold bg-primary hover:bg-primary/95 text-white shadow-sm">
              <ListTodo className="h-5 w-5" /> Review Requests ({stats.pendingCount})
            </Button>
          </Link>
          <Link to="/head/room-permissions" className="block">
            <Button size="lg" className="w-full h-16 text-sm gap-2 font-semibold bg-primary hover:bg-primary/95 text-white shadow-sm">
              <Key className="h-5 w-5" /> Room Permissions
            </Button>
          </Link>
          <Link to="/manage-machinery" className="block">
            <Button size="lg" className="w-full h-16 text-sm gap-2 font-semibold" variant="outline">
              <Settings className="h-5 w-5" /> Manage Machinery
            </Button>
          </Link>
          <Link to="/head/records" className="block">
            <Button size="lg" className="w-full h-16 text-sm gap-2 font-semibold" variant="outline">
              <ClipboardList className="h-5 w-5" /> Records & Attendance
            </Button>
          </Link>
        </CardContent>
      </Card>

    </div>
  );
};

export default HeadDashboard;
