import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  PlusCircle, Trash2, ArrowLeft, ArrowRight, Save, Check, Upload, Calendar, 
  Clock, ShieldAlert, Award, FileText, User, Users, Server, Database,
  ChevronDown, ChevronUp
} from "lucide-react";
import { formatTime12Hour } from "@/lib/dateUtils";

interface Machine {
  _id: string;
  name: string;
  capacity: number;
}

interface Material {
  _id: string;
  name: string;
  unit: string;
  remainingQuantity: number;
  currentStock: number;
  allocatedQuantity: number;
}

// Helpers for 12-hour time dropdowns
const parseTime24To12 = (time24: string) => {
  if (!time24) return { hour12: '12', minute: '00', period: 'AM' };
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return {
    hour12: String(h12).padStart(2, '0'),
    minute: mStr || '00',
    period
  };
};

const formatTime12To24 = (hour12: string, minute: string, period: string) => {
  let h = parseInt(hour12, 10);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  const hStr = String(h).padStart(2, '0');
  const mStr = minute.padStart(2, '0');
  return `${hStr}:${mStr}`;
};

const TimeSelectGroup = ({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (val: string) => void; 
}) => {
  const { hour12, minute, period } = parseTime24To12(value);

  const handleValChange = (field: 'hour12' | 'minute' | 'period', newVal: string) => {
    let h = hour12;
    let m = minute;
    let p = period;
    if (field === 'hour12') h = newVal;
    if (field === 'minute') m = newVal;
    if (field === 'period') p = newVal;
    onChange(formatTime12To24(h, m, p));
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      <select
        value={hour12}
        onChange={(e) => handleValChange('hour12', e.target.value)}
        className="h-9 flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
      >
        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-muted-foreground">:</span>
      <select
        value={minute}
        onChange={(e) => handleValChange('minute', e.target.value)}
        className="h-9 flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
      >
        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <select
        value={period}
        onChange={(e) => handleValChange('period', e.target.value)}
        className="h-9 w-[60px] rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring cursor-pointer font-bold"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
};

const MachineryRequestForm = () => {
  const { id } = useParams(); // 'new' or request ID to edit
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [availabilityCheck, setAvailabilityCheck] = useState<Record<string, { available: boolean; status: string; message: string; suggestions?: { startTime: string; endTime: string }[] }>>({});

  const checkSlotAvailability = async (mId: string, date: string, start: string, end: string, unitNum?: number) => {
    if (!mId || !date || !start || !end) return;
    try {
      const res = await api.get(`/machinery/check/availability`, {
        params: {
          machineId: mId,
          date,
          startTime: start,
          endTime: end,
          machineUnitNumber: unitNum || machineDetails[mId]?.machineUnitNumber || 1,
          excludeRequestId: id && id !== "new" ? id : undefined
        }
      });
      
      setAvailabilityCheck(prev => ({
        ...prev,
        [mId]: {
          available: res.data.available,
          status: res.data.status,
          message: res.data.message,
          suggestions: res.data.suggestions
        }
      }));

      if (!res.data.available) {
        toast.error(`Slot warning: The selected time slot for "${machinesList.find(m => m._id === mId)?.name || 'the machine'}" is already booked.`);
      }
    } catch (err: any) {
      console.error("Failed to check slot availability:", err);
    }
  };
  const [expandedStudents, setExpandedStudents] = useState<Record<number, boolean>>({ 0: true });
  const [machinesList, setMachinesList] = useState<Machine[]>([]);
  const [materialsList, setMaterialsList] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Success tracking state for guests
  const [isSubmittedSuccessfully, setIsSubmittedSuccessfully] = useState(false);
  const [submittedRequestId, setSubmittedRequestId] = useState("");

  // Applicant Type state
  const [applicantType, setApplicantType] = useState<"Internal" | "External">("Internal");

  // Form State - Internal Student
  const [projectName, setProjectName] = useState("");
  const [projectCategory, setProjectCategory] = useState("Academic Project");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectObjectives, setProjectObjectives] = useState("");
  const [expectedOutcome, setExpectedOutcome] = useState("");

  const [teamName, setTeamName] = useState("");
  const [numberOfStudents, setNumberOfStudents] = useState(1);
  const [students, setStudents] = useState<any[]>([
    { name: "", prn: "", branch: "Computer Engineering", year: "3rd Year", division: "A", mobile: "", email: "" }
  ]);

  const [facultyGuide, setFacultyGuide] = useState({
    name: "",
    department: "Computer Engineering",
    email: "",
    mobile: "",
    designation: "Assistant Professor",
    remarks: ""
  });

  // Form State - External User
  const [externalFullName, setExternalFullName] = useState("");
  const [externalCollegeOrg, setExternalCollegeOrg] = useState("");
  const [externalDept, setExternalDept] = useState("");
  const [externalDesignation, setExternalDesignation] = useState("");
  const [externalWebsite, setExternalWebsite] = useState("");
  const [externalCity, setExternalCity] = useState("");
  const [externalState, setExternalState] = useState("");
  const [externalEmail, setExternalEmail] = useState("");
  const [externalMobile, setExternalMobile] = useState("");
  const [externalIdentityProof, setExternalIdentityProof] = useState("");
  const [externalApplicantType, setExternalApplicantType] = useState<"Individual" | "Team">("Individual");
  const [externalTeamMembers, setExternalTeamMembers] = useState<any[]>([
    { name: "", email: "", mobile: "" }
  ]);
  const [externalTeamCount, setExternalTeamCount] = useState(1);

  const [selectedMachines, setSelectedMachines] = useState<string[]>([]);
  const [machineDetails, setMachineDetails] = useState<Record<string, any>>({});
  
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [materialDetails, setMaterialDetails] = useState<Record<string, any>>({});

  const [uploadedFiles, setUploadedFiles] = useState({
    designFileUrl: "",
    cadFileUrl: "",
    circuitDiagramUrl: "",
    supportingDocsUrl: ""
  });

  const [benefits, setBenefits] = useState({
    researchContribution: "",
    competitionParticipation: "",
    patentPossibility: "",
    startupPotential: "",
    futureScope: "",
    technologyImpact: "",
    expectedDeliverables: "",
    communityImpact: ""
  });

  const [declaration, setDeclaration] = useState({
    infoAccurate: false,
    filesBelongToTeam: false,
    agreeToRules: false,
    acceptResponsibility: false
  });

  useEffect(() => {
    fetchInitialResourceLists();
    
    const userRaw = localStorage.getItem('idea_hub_user');
    const token = localStorage.getItem('idea_hub_token');
    const typeParam = searchParams.get("type");
    
    let resolvedType: "Internal" | "External" = "Internal";
    if (typeParam === "External") {
      resolvedType = "External";
    } else if (typeParam === "Internal") {
      resolvedType = "Internal";
    } else {
      // Default based on login status and user type
      if (userRaw && token) {
        try {
          const u = JSON.parse(userRaw);
          resolvedType = u.userType === "EXTERNAL" ? "External" : "Internal";
        } catch {
          resolvedType = "Internal";
        }
      } else {
        resolvedType = "External";
      }
    }
    
    setApplicantType(resolvedType);
    
    if (resolvedType === "Internal") {
      if (!userRaw || !token) {
        toast.error("You must be logged in as a student to file an internal request.");
        navigate("/login?redirect=" + encodeURIComponent(window.location.pathname + window.location.search));
        return;
      }
      try {
        const u = JSON.parse(userRaw);
        if (u.userType === "EXTERNAL") {
          toast.error("Access Restricted. External users cannot submit Internal student requests.");
          navigate("/machinery");
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (id === "new" && userRaw) {
      try {
        const u = JSON.parse(userRaw);
        if (resolvedType === "Internal") {
          let mappedYear = "3rd Year";
          if (u.year === "FE") mappedYear = "1st Year";
          else if (u.year === "SE") mappedYear = "2nd Year";
          else if (u.year === "TE") mappedYear = "3rd Year";
          else if (u.year === "BE") mappedYear = "4th Year";

          setStudents([{
            name: u.name || "",
            prn: u.prn || "",
            branch: u.branch || "Computer Engineering",
            year: mappedYear,
            division: u.division || "A",
            mobile: u.mobile || "",
            email: u.email || ""
          }]);
        } else {
          setExternalFullName(u.name || "");
          setExternalEmail(u.email || "");
          setExternalMobile(u.externalMobile || u.mobile || "");
          setExternalCollegeOrg(u.externalCollegeOrg || "");
          setExternalDept(u.externalDept || "");
          setExternalCity(u.externalCity || "");
          setExternalState(u.externalState || "");
          setExternalIdentityProof(u.externalIdentityProof || "");
        }
      } catch (e) {
        console.error("Failed to parse user for pre-population:", e);
      }
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    if (externalApplicantType === "Team") {
      const count = Math.max(1, externalTeamCount);
      const nextList = [...externalTeamMembers];
      if (count > nextList.length) {
        for (let i = nextList.length; i < count; i++) {
          nextList.push({ name: "", email: "", mobile: "" });
        }
      } else {
        nextList.length = count;
      }
      setExternalTeamMembers(nextList);
    }
  }, [externalTeamCount, externalApplicantType]);

  const fetchInitialResourceLists = async () => {
    setLoading(true);
    try {
      const [mRes, matRes] = await Promise.all([
        api.get("/machinery"),
        api.get("/materials")
      ]);
      setMachinesList(mRes.data);
      setMaterialsList(matRes.data);

      const targetMachineId = searchParams.get("machineId");
      if (targetMachineId) {
        setSelectedMachines([targetMachineId]);
        const defaultDate = new Date().toISOString().split("T")[0];
        setMachineDetails({
          [targetMachineId]: {
            usageDate: defaultDate,
            startTime: "10:00",
            endTime: "12:00",
            usageHours: 2,
            purposeOfUsage: "",
            specialRequirements: ""
          }
        });
        checkSlotAvailability(targetMachineId, defaultDate, "10:00", "12:00");
      }

      // If editing existing request (non-'new')
      if (id && id !== "new") {
        const reqRes = await api.get(`/machinery/requests/${id}`);
        const rData = reqRes.data;

        setProjectName(rData.projectName || "");
        setProjectCategory(rData.projectCategory || "Academic Project");
        setProjectDescription(rData.projectDescription || "");
        setProjectObjectives(rData.projectObjectives || "");
        setExpectedOutcome(rData.expectedOutcome || "");
        
        setTeamName(rData.teamName || "");
        setNumberOfStudents(rData.numberOfStudents || 1);
        setStudents(rData.students || []);
        
        if (rData.facultyGuide) setFacultyGuide(rData.facultyGuide);

        // Populate machines
        if (rData.requestedMachines?.length > 0) {
          const machIds = rData.requestedMachines.map((m: any) => m.machineId?._id || m.machineId);
          setSelectedMachines(machIds);
          const md: Record<string, any> = {};
          rData.requestedMachines.forEach((m: any) => {
            const mId = m.machineId?._id || m.machineId;
            const usageDateStr = m.usageDate ? new Date(m.usageDate).toISOString().split("T")[0] : "";
            md[mId] = {
              usageDate: usageDateStr,
              machineUnitNumber: m.machineUnitNumber || 1,
              startTime: m.startTime || "",
              endTime: m.endTime || "",
              usageHours: m.usageHours || 0,
              purposeOfUsage: m.purposeOfUsage || "",
              specialRequirements: m.specialRequirements || ""
            };
            if (usageDateStr && m.startTime && m.endTime) {
              checkSlotAvailability(mId, usageDateStr, m.startTime, m.endTime, m.machineUnitNumber || 1);
            }
          });
          setMachineDetails(md);
        }

        // Populate materials
        if (rData.requestedMaterials?.length > 0) {
          const matIds = rData.requestedMaterials.map((m: any) => m.materialId?._id || m.materialId);
          setSelectedMaterials(matIds);
          const matD: Record<string, any> = {};
          rData.requestedMaterials.forEach((m: any) => {
            const mId = m.materialId?._id || m.materialId;
            matD[mId] = {
              quantityRequired: m.quantityRequired || 1,
              purposeOfUsage: m.purposeOfUsage || ""
            };
          });
          setMaterialDetails(matD);
        }

        if (rData.uploadedFiles) setUploadedFiles(rData.uploadedFiles);
        if (rData.benefits) setBenefits(rData.benefits);
        if (rData.declaration) setDeclaration(rData.declaration);
      }
    } catch (error) {
      toast.error("Failed to load initial form metadata.");
    } finally {
      setLoading(false);
    }
  };

  // Adjust students length dynamically
  useEffect(() => {
    const targetCount = Math.max(1, Math.min(4, numberOfStudents));
    if (students.length !== targetCount) {
      const nextList = [...students];
      if (targetCount > nextList.length) {
        const newExpanded = { ...expandedStudents };
        for (let i = nextList.length; i < targetCount; i++) {
          nextList.push({ name: "", prn: "", branch: "Computer Engineering", year: "3rd Year", division: "A", mobile: "", email: "" });
          newExpanded[i] = true; // Auto-expand newly added student cards
        }
        setExpandedStudents(newExpanded);
      } else {
        nextList.length = targetCount;
      }
      setStudents(nextList);
    }
  }, [numberOfStudents]);

  const toggleStudentExpand = (idx: number) => {
    setExpandedStudents(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleStudentFieldChange = (idx: number, field: string, value: string) => {
    const list = [...students];
    list[idx] = { ...list[idx], [field]: value };
    setStudents(list);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);

    setUploadingField(fieldName);
    try {
      const res = await api.post('/machinery/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedFiles(prev => ({ ...prev, [fieldName]: res.data.url }));
      toast.success("File uploaded successfully.");
    } catch {
      toast.error("File upload failed.");
    } finally {
      setUploadingField(null);
    }
  };

  const calculateHours = (mId: string, start: string, end: string) => {
    if (!start || !end) return;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const diffMins = (eh * 60 + em) - (sh * 60 + sm);
    const hours = Number((diffMins / 60).toFixed(1));
    
    setMachineDetails(prev => ({
      ...prev,
      [mId]: {
        ...prev[mId],
        usageHours: Math.max(0, hours)
      }
    }));
  };

  const handleMachineDetailsChange = (mId: string, field: string, value: any) => {
    const details = {
      ...(machineDetails[mId] || {}),
      [field]: value
    };
    const updated = {
      ...machineDetails,
      [mId]: details
    };
    setMachineDetails(updated);

    if (field === 'startTime' || field === 'endTime') {
      calculateHours(mId, details.startTime, details.endTime);
    }

    // Trigger availability check when date, startTime, and endTime are all present
    if (details.usageDate && details.startTime && details.endTime) {
      if (field === 'usageDate' || field === 'startTime' || field === 'endTime' || field === 'machineUnitNumber') {
        checkSlotAvailability(mId, details.usageDate, details.startTime, details.endTime, details.machineUnitNumber || 1);
      }
    }
  };

  const handleMaterialDetailsChange = (mId: string, field: string, value: any) => {
    setMaterialDetails(prev => ({
      ...prev,
      [mId]: {
        ...(prev[mId] || {}),
        [field]: value
      }
    }));
  };

  // Submit request or save draft
  const handleFormSubmit = async (statusType: "Draft" | "Submitted" | "Student Resubmitted") => {
    // Declarations validation
    if (statusType !== "Draft") {
      if (!declaration.agreeToRules || !declaration.acceptResponsibility || !declaration.infoAccurate || !declaration.filesBelongToTeam) {
        toast.error("You must agree to all declaration checkboxes before submitting.");
        return;
      }
      
      // Machine slot availability checks
      for (const mId of selectedMachines) {
        const check = availabilityCheck[mId];
        if (check && !check.available) {
          toast.error(`Submission failed: The slot for "${machinesList.find(m => m._id === mId)?.name || 'the machine'}" is already booked.`);
          return;
        }
      }

      // Stock checks
      for (const mId of selectedMaterials) {
        const matItem = materialsList.find(m => m._id === mId);
        const details = materialDetails[mId] || {};
        if (matItem) {
          const qty = Number(details.quantityRequired) || 1;
          const remaining = Math.max(0, matItem.currentStock - matItem.allocatedQuantity);
          if (qty > remaining) {
            toast.error(`Auto Capacity Validation: Only ${remaining} ${matItem.unit} of "${matItem.name}" available.`);
            return;
          }
        }
      }
    }

    setIsSubmitting(true);

    const payload = {
      projectName,
      projectCategory,
      projectDescription,
      projectObjectives,
      expectedOutcome,
      teamName: applicantType === 'External' ? (externalApplicantType === 'Team' ? teamName : '') : teamName,
      numberOfStudents: applicantType === 'External' ? (externalApplicantType === 'Team' ? externalTeamCount + 1 : 1) : numberOfStudents,
      students: applicantType === 'External' ? [] : students,
      facultyGuide: applicantType === 'External' ? {} : facultyGuide,
      requestedMachines: selectedMachines.map(mId => ({
        machineId: mId,
        machineName: machinesList.find(m => m._id === mId)?.name || "",
        machineUnitNumber: Number(machineDetails[mId]?.machineUnitNumber) || 1,
        usageDate: machineDetails[mId]?.usageDate || "",
        startTime: machineDetails[mId]?.startTime || "",
        endTime: machineDetails[mId]?.endTime || "",
        usageHours: machineDetails[mId]?.usageHours || 0,
        purposeOfUsage: machineDetails[mId]?.purposeOfUsage || "",
        specialRequirements: machineDetails[mId]?.specialRequirements || ""
      })),
      requestedMaterials: selectedMaterials.map(mId => ({
        materialId: mId,
        materialName: materialsList.find(m => m._id === mId)?.name || "",
        quantityRequired: Number(materialDetails[mId]?.quantityRequired) || 1,
        purposeOfUsage: materialDetails[mId]?.purposeOfUsage || ""
      })),
      uploadedFiles,
      benefits,
      declaration,
      status: statusType,
      
      // External applicant fields
      applicantType,
      externalFullName: applicantType === 'External' ? externalFullName : '',
      externalCollegeOrg: applicantType === 'External' ? externalCollegeOrg : '',
      externalDept: applicantType === 'External' ? externalDept : '',
      externalDesignation: applicantType === 'External' ? externalDesignation : '',
      externalWebsite: applicantType === 'External' ? externalWebsite : '',
      externalCity: applicantType === 'External' ? externalCity : '',
      externalState: applicantType === 'External' ? externalState : '',
      externalEmail: applicantType === 'External' ? externalEmail : '',
      externalMobile: applicantType === 'External' ? externalMobile : '',
      externalIdentityProof: applicantType === 'External' ? externalIdentityProof : '',
      externalApplicantType: applicantType === 'External' ? externalApplicantType : 'Individual',
      externalTeamMembers: applicantType === 'External' ? (externalApplicantType === 'Team' ? externalTeamMembers : []) : []
    };

    try {
      let res;
      if (id && id !== "new") {
        res = await api.put(`/machinery/requests/${id}`, payload);
        toast.success(statusType === 'Draft' ? "Draft saved." : "Application resubmitted successfully!");
      } else {
        res = await api.post("/machinery/requests", payload);
        toast.success(statusType === 'Draft' ? "Draft saved." : "Application submitted successfully!");
      }

      if (applicantType === 'External' && statusType !== 'Draft') {
        setSubmittedRequestId(res.data.requestId);
        setIsSubmittedSuccessfully(true);
      } else {
        navigate("/machinery");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    // Step 1: Machine Booking Validation
    if (step === 1) {
      if (selectedMachines.length === 0) {
        toast.error("Please select at least one machine.");
        return;
      }
      for (const mId of selectedMachines) {
        const details = machineDetails[mId];
        if (!details || !details.usageDate || !details.startTime || !details.endTime || !details.purposeOfUsage) {
          toast.error(`Please fill in booking parameters for "${machinesList.find(m => m._id === mId)?.name || 'the machine'}".`);
          return;
        }
        const check = availabilityCheck[mId];
        if (check && !check.available) {
          toast.error(`The selected time slot for "${machinesList.find(m => m._id === mId)?.name || 'the machine'}" is already booked.`);
          return;
        }
      }
    }
    // Step 2: Project & Team Validation
    if (step === 2) {
      if (!projectName || !projectDescription || !projectObjectives || !expectedOutcome) {
        toast.error("Please fill in all project details.");
        return;
      }
      if (applicantType === "External") {
        if (!externalFullName || !externalCollegeOrg || !externalCity || !externalState || !externalEmail || !externalMobile || !externalIdentityProof) {
          toast.error("Please fill in all applicant details and upload your Identity Proof.");
          return;
        }
        if (externalApplicantType === "Team") {
          if (!teamName) {
            toast.error("Please enter your Team Name.");
            return;
          }
          for (let i = 0; i < externalTeamMembers.length; i++) {
            const m = externalTeamMembers[i];
            if (!m.name || !m.email || !m.mobile) {
              toast.error(`Please fill in all details for Team Member ${i + 1}.`);
              return;
            }
          }
        }
      } else {
        // Internal Student
        for (const stud of students) {
          if (!stud.name || !stud.prn || !stud.mobile || !stud.email) {
            toast.error("Please fill in all team student details.");
            return;
          }
        }
      }
    }
    // Step 3: Faculty Guide & Document Validation
    if (step === 3) {
      // Guide/Upload details are optional or have their own handles
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const STEP_LABELS = [
    "Booking & Slots",
    "Project & Team",
    "Faculty & Files",
    "Review & Submit"
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isSubmittedSuccessfully) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-xl font-sans flex flex-col items-center justify-center min-h-[80vh]">
        <Card className="w-full shadow-2xl border border-orange-200 overflow-hidden rounded-2xl">
          <div className="bg-orange-500 p-8 text-center text-white flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-xs rounded-full flex items-center justify-center mb-4 border border-white/30">
              <Check className="w-10 h-10 text-white stroke-[3px]" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Request Submitted Successfully!</h1>
            <p className="text-orange-50/90 text-xs mt-1.5 font-medium">KK Wagh AICTE IDEA Lab External Permission System</p>
          </div>
          
          <CardContent className="p-8 space-y-6 text-xs text-slate-700">
            <div className="bg-orange-50/30 border border-orange-100 rounded-xl p-4 space-y-2 text-center">
              <span className="text-[10px] text-muted-foreground uppercase font-bold block">Your Generated Request ID</span>
              <span className="font-mono text-2xl font-extrabold text-orange-600 block">{submittedRequestId}</span>
              <p className="text-3xs text-muted-foreground leading-normal max-w-xs mx-auto">
                Please save this Request ID. You can use it to check the live status of your application without logging in.
              </p>
            </div>

            <div className="space-y-3 font-medium text-slate-600 border-t pt-4">
              <p className="flex justify-between">
                <span>Applicant Name:</span>
                <span className="font-bold text-slate-800">{externalFullName}</span>
              </p>
              <p className="flex justify-between">
                <span>Institution:</span>
                <span className="font-bold text-slate-800">{externalCollegeOrg}</span>
              </p>
              <p className="flex justify-between">
                <span>Project Name:</span>
                <span className="font-bold text-slate-800">{projectName}</span>
              </p>
              <p className="flex justify-between">
                <span>Verification ID Status:</span>
                <span className="text-blue-600 font-bold uppercase">PENDING REVIEW</span>
              </p>
            </div>

            <div className="pt-4 border-t flex flex-col sm:flex-row gap-3">
              <Link to={`/verify-request/${submittedRequestId}`} className="flex-1">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold h-10">
                  Track Live Status
                </Button>
              </Link>
              <Link to="/" className="flex-1">
                <Button variant="outline" className="w-full font-bold h-10">
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl font-sans">
      {/* Visual Step Progress Bar */}
      <div className="mb-10 border-b pb-8 relative">
        <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase mb-4">
          <span>Apply Permission Form</span>
          <span className="text-primary">Step {step} of 4</span>
        </div>
        
        {/* Progress Line */}
        <div className="relative flex items-center justify-between mt-6 px-4">
          <div className="absolute left-6 right-6 top-4 h-0.5 bg-slate-200 -z-10" />
          <div 
            className="absolute left-6 top-4 h-0.5 bg-primary transition-all duration-300 -z-10" 
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
          {STEP_LABELS.map((label, idx) => {
            const stepNum = idx + 1;
            const isCompleted = step > stepNum;
            const isActive = step === stepNum;
            
            return (
              <div key={idx} className="flex flex-col items-center relative z-10 w-auto flex-1 px-1">
                <button
                  type="button"
                  onClick={() => {
                    if (stepNum < step) setStep(stepNum);
                  }}
                  disabled={stepNum >= step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all font-bold text-xs ${
                    isActive 
                      ? 'bg-primary border-primary text-white shadow-md scale-110' 
                      : isCompleted
                        ? 'bg-primary border-primary text-white hover:bg-primary/90'
                        : 'bg-white border-slate-300 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNum}
                </button>
                <span className={`text-[10px] sm:text-xs font-bold mt-2 text-center leading-tight ${isActive ? 'text-primary' : 'text-muted-foreground font-medium'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="shadow-lg border-border/80">
        <CardContent className="p-8">
          
          {/* STEP 1: MACHINE BOOKING & SLOTS */}
          {step === 1 && (
            <div className="space-y-8">
              {/* Machine Selection Checklist */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-primary flex items-center gap-2"><Server className="w-5 h-5 text-primary" /> Machine Bookings</h2>
                  <p className="text-[11px] text-muted-foreground font-semibold">Select machines you need to book</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {machinesList.map((mach) => (
                      <div 
                        key={mach._id} 
                        className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${selectedMachines.includes(mach._id) ? 'border-primary/50 bg-primary/5' : 'border-border/60'}`}
                        onClick={() => {
                          if (selectedMachines.includes(mach._id)) {
                            setSelectedMachines(prev => prev.filter(id => id !== mach._id));
                          } else {
                            setSelectedMachines(prev => [...prev, mach._id]);
                             setMachineDetails(prev => ({
                               ...prev,
                               [mach._id]: {
                                 usageDate: new Date().toISOString().split("T")[0],
                                 machineUnitNumber: 1,
                                 startTime: "10:00",
                                 endTime: "12:00",
                                 usageHours: 2,
                                 purposeOfUsage: "",
                                 specialRequirements: ""
                               }
                             }));
                          }
                        }}
                      >
                        <Checkbox checked={selectedMachines.includes(mach._id)} />
                        <Label className="cursor-pointer font-semibold text-xs leading-none">{mach.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Machine Details & Slots */}
              {selectedMachines.length > 0 && (
                <div className="space-y-6 pt-6 border-t border-slate-200">
                  <h3 className="font-bold text-slate-800 border-b pb-1 text-xs">Machine Booking Parameters</h3>
                  {selectedMachines.map((mId) => {
                    const machine = machinesList.find(m => m._id === mId);
                    const details = machineDetails[mId] || {};
                    
                    return (
                      <div key={mId} className="p-4 border rounded-xl bg-slate-50/50 space-y-4">
                        <h4 className="font-bold text-primary text-xs">{machine?.name} Details</h4>
                        
                         <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                           <div>
                             <Label className="text-2xs">Requested Date</Label>
                             <Input 
                               type="date" 
                               value={details.usageDate} 
                               min={new Date().toISOString().split("T")[0]}
                               onChange={(e) => handleMachineDetailsChange(mId, 'usageDate', e.target.value)} 
                               className="h-9 mt-1"
                               required 
                             />
                           </div>
                           <div>
                             <Label className="text-2xs">Select Unit Number</Label>
                             <select
                               value={details.machineUnitNumber || 1}
                               onChange={(e) => handleMachineDetailsChange(mId, 'machineUnitNumber', parseInt(e.target.value))}
                               className="h-9 w-full mt-1 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
                             >
                               {Array.from({ length: machine?.capacity || 1 }, (_, i) => i + 1).map(num => (
                                 <option key={num} value={num}>Unit #{num}</option>
                               ))}
                             </select>
                           </div>
                           <div>
                             <Label className="text-2xs">Start Time</Label>
                             <TimeSelectGroup 
                               value={details.startTime} 
                               onChange={(val) => handleMachineDetailsChange(mId, 'startTime', val)} 
                             />
                           </div>
                           <div>
                             <Label className="text-2xs">End Time</Label>
                             <TimeSelectGroup 
                               value={details.endTime} 
                               onChange={(val) => handleMachineDetailsChange(mId, 'endTime', val)} 
                             />
                           </div>
                           <div className="bg-slate-100 p-2 rounded flex flex-col justify-center text-center border h-[52px] mt-1">
                             <span className="text-[10px] text-muted-foreground font-semibold uppercase leading-none">Duration</span>
                             <span className="font-extrabold text-sm text-primary mt-1">{details.usageHours || 0} Hrs</span>
                           </div>
                         </div>

                        {/* Inline Slot Availability Feedback */}
                        {availabilityCheck[mId] && (
                          <div className={`p-3.5 rounded-lg border text-2xs mt-3 ${availabilityCheck[mId].available ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                            <p className="font-bold flex items-center gap-1">
                              {availabilityCheck[mId].available ? (
                                <Check className="w-3.5 h-3.5 text-green-600" />
                              ) : (
                                <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                              )}
                              {availabilityCheck[mId].status}
                            </p>
                            <p className="mt-0.5 text-slate-600">{availabilityCheck[mId].message}</p>
                            {availabilityCheck[mId].suggestions && availabilityCheck[mId].suggestions.length > 0 && (
                              <div className="mt-2">
                                <p className="font-bold text-slate-700">Alternative Available Slots:</p>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {availabilityCheck[mId].suggestions.map((s: any, idx: number) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        handleMachineDetailsChange(mId, 'startTime', s.startTime);
                                        handleMachineDetailsChange(mId, 'endTime', s.endTime);
                                      }}
                                      className="px-2 py-1 bg-white border border-red-200 rounded text-[10px] text-red-700 font-bold hover:bg-red-100 hover:text-red-800 transition-colors cursor-pointer"
                                    >
                                      {s.startTime} - {s.endTime}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-2xs">Purpose of Usage</Label>
                            <Textarea 
                              value={details.purposeOfUsage} 
                              onChange={(e) => handleMachineDetailsChange(mId, 'purposeOfUsage', e.target.value)} 
                              placeholder="Fabricate chassis for rover..." 
                              rows={2}
                              className="mt-1"
                              required
                            />
                          </div>
                          <div>
                            <Label className="text-2xs">Special Requirements / Setups</Label>
                            <Textarea 
                              value={details.specialRequirements} 
                              onChange={(e) => handleMachineDetailsChange(mId, 'specialRequirements', e.target.value)} 
                              placeholder="Requires dual extruder setup..." 
                              rows={2}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PROJECT & TEAM INFORMATION */}
          {step === 2 && (
            <div className="space-y-8">
              {/* Project Details Group */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-primary flex items-center gap-2"><FileText className="w-5 h-5 text-primary" /> Project Information</h2>
                  <p className="text-[11px] text-muted-foreground font-semibold">Define your innovation or academic project specifics</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <Label htmlFor="projectName" className="text-xs font-bold">Project Name</Label>
                    <Input id="projectName" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Smart Autonomous Rover" className="h-10 mt-1" required />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-xs font-bold">Project Category</Label>
                    <Select value={projectCategory} onValueChange={setProjectCategory}>
                      <SelectTrigger className="h-10 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Academic Project">Academic Project</SelectItem>
                        <SelectItem value="Research Project">Research Project</SelectItem>
                        <SelectItem value="Competition Project">Competition Project</SelectItem>
                        <SelectItem value="Startup Project">Startup Project</SelectItem>
                        <SelectItem value="Innovation Project">Innovation Project</SelectItem>
                        <SelectItem value="Prototype Development">Prototype Development</SelectItem>
                        <SelectItem value="Product Development">Product Development</SelectItem>
                        <SelectItem value="Other">Other Category</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="desc" className="text-xs font-bold">Project Description</Label>
                  <Textarea id="desc" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} placeholder="Summarize the core concepts and scope..." rows={4} className="mt-1" required />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="objectives" className="text-xs font-bold">Project Objectives</Label>
                    <Textarea id="objectives" value={projectObjectives} onChange={(e) => setProjectObjectives(e.target.value)} placeholder="What do you plan to achieve?" rows={3} className="mt-1" required />
                  </div>
                  <div>
                    <Label htmlFor="outcome" className="text-xs font-bold">Expected Outcome</Label>
                    <Textarea id="outcome" value={expectedOutcome} onChange={(e) => setExpectedOutcome(e.target.value)} placeholder="What is the final deliverable?" rows={3} className="mt-1" required />
                  </div>
                </div>
              </div>

              {/* Applicant Profile / Team Configuration block */}
              {applicantType === "External" ? (
                <div className="space-y-6 pt-6 border-t border-slate-200">
                  <div>
                    <h2 className="text-lg font-bold text-orange-600 flex items-center gap-2">
                      <User className="w-5 h-5 text-orange-600" /> External Applicant Profile
                    </h2>
                    <p className="text-[11px] text-muted-foreground font-semibold">
                      Please enter your institutional and identity details
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    <div>
                      <Label htmlFor="extFullName" className="font-semibold">Full Name</Label>
                      <Input 
                        id="extFullName" 
                        value={externalFullName} 
                        onChange={(e) => setExternalFullName(e.target.value)} 
                        placeholder="John Doe" 
                        className="h-9 mt-1" 
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="extCollegeOrg" className="font-semibold">College / Organization Name</Label>
                      <Input 
                        id="extCollegeOrg" 
                        value={externalCollegeOrg} 
                        onChange={(e) => setExternalCollegeOrg(e.target.value)} 
                        placeholder="MIT Pune" 
                        className="h-9 mt-1" 
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="extDept" className="font-semibold">Department</Label>
                      <Input 
                        id="extDept" 
                        value={externalDept} 
                        onChange={(e) => setExternalDept(e.target.value)} 
                        placeholder="Mechanical Engineering" 
                        className="h-9 mt-1" 
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="extDesignation" className="font-semibold">Designation</Label>
                      <Input 
                        id="extDesignation" 
                        value={externalDesignation} 
                        onChange={(e) => setExternalDesignation(e.target.value)} 
                        placeholder="Research Scholar" 
                        className="h-9 mt-1" 
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="extWebsite" className="font-semibold">Website (Optional)</Label>
                      <Input 
                        id="extWebsite" 
                        value={externalWebsite} 
                        onChange={(e) => setExternalWebsite(e.target.value)} 
                        placeholder="https://example.com" 
                        className="h-9 mt-1" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="extCity" className="font-semibold">City</Label>
                      <Input 
                        id="extCity" 
                        value={externalCity} 
                        onChange={(e) => setExternalCity(e.target.value)} 
                        placeholder="Nashik" 
                        className="h-9 mt-1" 
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="extState" className="font-semibold">State</Label>
                      <Input 
                        id="extState" 
                        value={externalState} 
                        onChange={(e) => setExternalState(e.target.value)} 
                        placeholder="Maharashtra" 
                        className="h-9 mt-1" 
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="extEmail" className="font-semibold">Email Address</Label>
                      <Input 
                        id="extEmail" 
                        type="email" 
                        value={externalEmail} 
                        onChange={(e) => setExternalEmail(e.target.value)} 
                        placeholder="john.doe@gmail.com" 
                        className="h-9 mt-1" 
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="extMobile" className="font-semibold">Mobile Number</Label>
                      <Input 
                        id="extMobile" 
                        value={externalMobile} 
                        onChange={(e) => setExternalMobile(e.target.value)} 
                        placeholder="9876543210" 
                        className="h-9 mt-1" 
                        required 
                      />
                    </div>
                  </div>

                  {/* ID proof upload block */}
                  <div className="p-4 border rounded-lg bg-orange-50/20 border-orange-100 mt-4">
                    <Label className="font-bold text-xs">Identity Verification Document</Label>
                    <p className="text-[10px] text-muted-foreground leading-normal mb-3">
                      Please upload a valid institutional ID proof, Aadhar Card, or Passport copy (PDF, JPG, PNG, WebP)
                    </p>
                    <div className="flex gap-2">
                      <Input 
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const data = new FormData();
                          data.append('image', file);
                          setUploadingField('externalIdentityProof');
                          try {
                            const res = await api.post('/machinery/upload', data, {
                              headers: { 'Content-Type': 'multipart/form-data' }
                            });
                            setExternalIdentityProof(res.data.url);
                            toast.success("Identity Proof uploaded successfully!");
                          } catch {
                            toast.error("Identity Proof upload failed.");
                          } finally {
                            setUploadingField(null);
                          }
                        }}
                        disabled={uploadingField !== null}
                        className="bg-white h-9 py-0.5 text-xs cursor-pointer mt-1 max-w-sm"
                      />
                    </div>
                    {uploadingField === 'externalIdentityProof' && <span className="text-[10px] text-muted-foreground animate-pulse">Uploading file...</span>}
                    {externalIdentityProof && (
                      <p className="text-[10px] text-green-600 truncate mt-1.5 font-bold">
                        Uploaded ID Proof Link: <a href={externalIdentityProof} target="_blank" rel="noreferrer" className="underline">{externalIdentityProof}</a>
                      </p>
                    )}
                  </div>

                  {/* Individual vs Team configuration */}
                  <div className="space-y-4 pt-4 border-t">
                    <Label className="font-bold text-xs">Applicant Configuration</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          id="appIndividual" 
                          name="extApplicantType" 
                          checked={externalApplicantType === "Individual"} 
                          onChange={() => setExternalApplicantType("Individual")} 
                          className="w-4 h-4 text-orange-600 cursor-pointer"
                        />
                        <Label htmlFor="appIndividual" className="cursor-pointer font-semibold text-xs text-slate-700">Individual Project</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          id="appTeam" 
                          name="extApplicantType" 
                          checked={externalApplicantType === "Team"} 
                          onChange={() => setExternalApplicantType("Team")} 
                          className="w-4 h-4 text-orange-600 cursor-pointer"
                        />
                        <Label htmlFor="appTeam" className="cursor-pointer font-semibold text-xs text-slate-700">Team Project</Label>
                      </div>
                    </div>

                    {externalApplicantType === "Team" && (
                      <div className="space-y-4 pt-3 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="extTeamName" className="font-semibold text-2xs">Team Name</Label>
                            <Input 
                              id="extTeamName" 
                              value={teamName} 
                              onChange={(e) => setTeamName(e.target.value)} 
                              placeholder="Omega Team" 
                              className="h-9 mt-1" 
                              required 
                            />
                          </div>
                          <div>
                            <Label htmlFor="extTeamCount" className="font-semibold text-2xs">Number of Additional Members</Label>
                            <Select value={String(externalTeamCount)} onValueChange={(v) => setExternalTeamCount(Number(v))}>
                              <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 9 }, (_, i) => String(i + 1)).map(num => (
                                  <SelectItem key={num} value={num}>{num} Member{Number(num) > 1 ? 's' : ''}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* List of team members inputs */}
                        <div className="space-y-3 mt-4">
                          <p className="font-bold text-orange-600 text-[10px] uppercase tracking-wider">Team Members Details</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {externalTeamMembers.map((member, idx) => (
                              <Card key={idx} className="border border-orange-100 bg-orange-50/5 p-4 space-y-3 text-xs shadow-2xs">
                                <p className="font-bold text-slate-700">Member #{idx + 1}</p>
                                <div>
                                  <Label className="font-semibold">Full Name</Label>
                                  <Input 
                                    value={member.name} 
                                    onChange={(e) => {
                                      const next = [...externalTeamMembers];
                                      next[idx].name = e.target.value;
                                      setExternalTeamMembers(next);
                                    }} 
                                    className="h-8 mt-1 bg-white" 
                                    required 
                                  />
                                </div>
                                <div>
                                  <Label className="font-semibold">Email Address</Label>
                                  <Input 
                                    type="email"
                                    value={member.email} 
                                    onChange={(e) => {
                                      const next = [...externalTeamMembers];
                                      next[idx].email = e.target.value;
                                      setExternalTeamMembers(next);
                                    }} 
                                    className="h-8 mt-1 bg-white" 
                                    required 
                                  />
                                </div>
                                <div>
                                  <Label className="font-semibold">Mobile Number</Label>
                                  <Input 
                                    value={member.mobile} 
                                    onChange={(e) => {
                                      const next = [...externalTeamMembers];
                                      next[idx].mobile = e.target.value;
                                      setExternalTeamMembers(next);
                                    }} 
                                    className="h-8 mt-1 bg-white" 
                                    required 
                                  />
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 pt-6 border-t border-slate-200">
                  <div>
                    <h2 className="text-lg font-bold text-primary flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Team Information</h2>
                    <p className="text-[11px] text-muted-foreground font-semibold">Add details for team members (Max 4 students)</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="teamName" className="text-xs font-bold">Team Name</Label>
                      <Input id="teamName" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Nikola Team" className="h-10 mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="numStudents" className="text-xs font-bold">Number of Students</Label>
                      <Select value={String(numberOfStudents)} onValueChange={(v) => setNumberOfStudents(Number(v))}>
                        <SelectTrigger className="h-10 mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Student (Individual)</SelectItem>
                          <SelectItem value="2">2 Students</SelectItem>
                          <SelectItem value="3">3 Students</SelectItem>
                          <SelectItem value="4">4 Students (Max Group)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Collapsible Student Cards UI */}
                  <div className="space-y-4 mt-4">
                    {students.map((student, idx) => (
                      <Card key={idx} className="border-primary/20 bg-secondary/5 overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => toggleStudentExpand(idx)}
                          className="w-full bg-primary/5 py-2.5 px-4 border-b border-primary/10 flex items-center justify-between text-left hover:bg-primary/10 transition-colors"
                        >
                          <span className="font-bold text-primary text-xs flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" />
                            Student {idx + 1} Info {student.name ? `(${student.name})` : ""}
                          </span>
                          {expandedStudents[idx] ? (
                            <ChevronUp className="w-4 h-4 text-primary shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </button>
                        
                        {expandedStudents[idx] && (
                          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                            <div>
                              <Label className="font-semibold">Full Name</Label>
                              <Input value={student.name} onChange={(e) => handleStudentFieldChange(idx, 'name', e.target.value)} className="h-9 mt-1" required />
                            </div>
                            <div>
                              <Label className="font-semibold">PRN Number</Label>
                              <Input value={student.prn} onChange={(e) => handleStudentFieldChange(idx, 'prn', e.target.value)} className="h-9 mt-1" required />
                            </div>
                            <div>
                              <Label className="font-semibold">Division</Label>
                              <Input value={student.division} onChange={(e) => handleStudentFieldChange(idx, 'division', e.target.value)} placeholder="A" className="h-9 mt-1" required />
                            </div>
                            <div>
                              <Label className="font-semibold">Branch</Label>
                              <Select value={student.branch} onValueChange={(v) => handleStudentFieldChange(idx, 'branch', v)}>
                                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Computer Engineering">Computer Engineering</SelectItem>
                                  <SelectItem value="AIDS">AIDS</SelectItem>
                                  <SelectItem value="CSD">CSD</SelectItem>
                                  <SelectItem value="ENTC">ENTC</SelectItem>
                                  <SelectItem value="IT">IT</SelectItem>
                                  <SelectItem value="Civil">Civil</SelectItem>
                                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                                  <SelectItem value="Electrical">Electrical</SelectItem>
                                  <SelectItem value="Robotics & Automation">Robotics & Automation</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="font-semibold">Year</Label>
                              <Select value={student.year} onValueChange={(v) => handleStudentFieldChange(idx, 'year', v)}>
                                <SelectTrigger className="h-9 mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1st Year">1st Year</SelectItem>
                                  <SelectItem value="2nd Year">2nd Year</SelectItem>
                                  <SelectItem value="3rd Year">3rd Year</SelectItem>
                                  <SelectItem value="4th Year">4th Year</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="font-semibold">Mobile Number</Label>
                              <Input type="tel" value={student.mobile} onChange={(e) => handleStudentFieldChange(idx, 'mobile', e.target.value)} className="h-9 mt-1" required />
                            </div>
                            <div className="md:col-span-2 lg:col-span-3">
                              <Label className="font-semibold">Email Address</Label>
                              <Input type="email" value={student.email} onChange={(e) => handleStudentFieldChange(idx, 'email', e.target.value)} className="h-9 mt-1" required />
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: FACULTY GUIDE & DOCUMENT UPLOADS */}
          {step === 3 && (
            <div className="space-y-8">
              {/* Faculty Info */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-primary flex items-center gap-2"><Award className="w-5 h-5 text-primary" /> Faculty Guide Information (Record Only)</h2>
                  <p className="text-[11px] text-muted-foreground font-semibold">Faculty Guide details stored for institutional tracking only. No approvals will be routed to faculty.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gName" className="text-xs font-bold">Guide Name</Label>
                    <Input id="gName" value={facultyGuide.name} onChange={(e) => setFacultyGuide({ ...facultyGuide, name: e.target.value })} placeholder="Dr. A. B. Joshi" className="h-10 mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="gDept" className="text-xs font-bold">Department</Label>
                    <Select value={facultyGuide.department} onValueChange={(v) => setFacultyGuide({ ...facultyGuide, department: v })}>
                      <SelectTrigger className="h-10 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Computer Engineering">Computer Engineering</SelectItem>
                        <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                        <SelectItem value="ENTC">ENTC</SelectItem>
                        <SelectItem value="Information Technology">Information Technology</SelectItem>
                        <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                        <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                        <SelectItem value="Robotics & Automation">Robotics & Automation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="gEmail" className="text-xs font-bold">Faculty Email</Label>
                    <Input id="gEmail" type="email" value={facultyGuide.email} onChange={(e) => setFacultyGuide({ ...facultyGuide, email: e.target.value })} placeholder="faculty@kkwagh.edu.in" className="h-10 mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="gMobile" className="text-xs font-bold">Faculty Mobile</Label>
                    <Input id="gMobile" value={facultyGuide.mobile} onChange={(e) => setFacultyGuide({ ...facultyGuide, mobile: e.target.value })} className="h-10 mt-1" />
                  </div>
                  <div className="lg:col-span-2">
                    <Label htmlFor="gDes" className="text-xs font-bold">Designation</Label>
                    <Input id="gDes" value={facultyGuide.designation} onChange={(e) => setFacultyGuide({ ...facultyGuide, designation: e.target.value })} placeholder="Assistant Professor" className="h-10 mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="gRemarks" className="text-xs font-bold">Remarks (If any)</Label>
                  <Textarea id="gRemarks" value={facultyGuide.remarks} onChange={(e) => setFacultyGuide({ ...facultyGuide, remarks: e.target.value })} placeholder="Special guidance notes or parameters..." rows={2} className="mt-1" />
                </div>
              </div>

              {/* File Uploads */}
              <div className="space-y-4 pt-6 border-t border-slate-200">
                <h3 className="font-bold text-slate-800 border-b pb-1 text-xs">Project Document Uploads</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { 
                      label: "Upload Design File", 
                      field: "designFileUrl", 
                      hint: "Accepts PDF, DOCX, or image/screenshot (JPG, JPEG, PNG, GIF, WebP, AVIF, SVG)" 
                    },
                    { 
                      label: "Upload CAD File", 
                      field: "cadFileUrl", 
                      hint: "Accepts STL, STEP, DWG, DXF, or image/screenshot (JPG, JPEG, PNG, GIF, WebP, AVIF, SVG)" 
                    },
                    { 
                      label: "Upload Circuit Diagram", 
                      field: "circuitDiagramUrl", 
                      hint: "Accepts PDF, or image/screenshot (JPG, JPEG, PNG, GIF, WebP, AVIF, SVG)" 
                    },
                    { 
                      label: "Upload Supporting Documents", 
                      field: "supportingDocsUrl", 
                      hint: "Accepts PDF, ZIP, or image/screenshot (JPG, JPEG, PNG, GIF, WebP, AVIF, SVG)" 
                    }
                  ].map((fileObj) => (
                    <div key={fileObj.field} className="p-3.5 border rounded-lg bg-slate-50/40 space-y-2">
                      <Label className="font-semibold text-2xs">{fileObj.label}</Label>
                      <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">
                        {fileObj.hint}
                      </p>
                      <div className="flex gap-2">
                        <Input 
                          type="file" 
                          accept=".pdf,.docx,.stl,.step,.dwg,.dxf,.zip,.jpg,.jpeg,.png,.gif,.webp,.avif,.svg"
                          onChange={(e) => handleFileUpload(e, fileObj.field)}
                          disabled={uploadingField !== null}
                          className="bg-background h-8 py-0.5 text-2xs cursor-pointer mt-1"
                        />
                      </div>
                      {uploadingField === fileObj.field && <span className="text-[10px] text-muted-foreground animate-pulse">Uploading file...</span>}
                      {/* @ts-ignore */}
                      {uploadedFiles[fileObj.field] && (
                        <p className="text-[10px] text-green-600 truncate">
                          Uploaded: {/* @ts-ignore */} {uploadedFiles[fileObj.field]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DECLARATION & REVIEW */}
          {step === 4 && (
            <div className="space-y-8">
              {/* Review Page */}
              <div className="space-y-6 pt-6 border-t border-slate-200">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Application Summary Review</h3>
                  <p className="text-[11px] text-muted-foreground font-semibold font-medium">Please review all information before submitting your application. Click Edit to adjust details.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: Project Details */}
                  <Card className="border border-border/80 shadow-2xs">
                    <CardHeader className="py-2.5 px-4 bg-slate-50 border-b flex flex-row justify-between items-center">
                      <h4 className="font-bold text-xs text-primary flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Project Info</h4>
                      <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="h-6 text-[10px] font-bold text-primary hover:bg-primary/10">Edit</Button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-1.5 text-2xs">
                      <p><strong>Name:</strong> {projectName}</p>
                      <p><strong>Category:</strong> {projectCategory}</p>
                      <p className="line-clamp-2"><strong>Description:</strong> {projectDescription}</p>
                      <p className="line-clamp-2"><strong>Objectives:</strong> {projectObjectives}</p>
                      <p className="line-clamp-2"><strong>Outcome:</strong> {expectedOutcome}</p>
                    </CardContent>
                  </Card>

                  {/* Card 2: External Applicant Profile or Student Team Details */}
                  {applicantType === 'External' ? (
                    <Card className="border border-border/80 shadow-2xs md:col-span-2">
                      <CardHeader className="py-2.5 px-4 bg-slate-50 border-b flex flex-row justify-between items-center">
                        <h4 className="font-bold text-xs text-primary flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> External Applicant Profile</h4>
                        <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="h-6 text-[10px] font-bold text-primary hover:bg-primary/10">Edit</Button>
                      </CardHeader>
                      <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-2xs">
                        <div className="space-y-1">
                          <p><strong>Name:</strong> {externalFullName}</p>
                          <p><strong>Institution/College:</strong> {externalCollegeOrg}</p>
                          <p><strong>Department:</strong> {externalDept || 'N/A'}</p>
                          <p><strong>Designation:</strong> {externalDesignation || 'N/A'}</p>
                          {externalWebsite && <p><strong>Website:</strong> {externalWebsite}</p>}
                        </div>
                        <div className="space-y-1">
                          <p><strong>Location:</strong> {externalCity}, {externalState}</p>
                          <p><strong>Email:</strong> {externalEmail}</p>
                          <p><strong>Mobile:</strong> {externalMobile}</p>
                          <p><strong>Type:</strong> {externalApplicantType} {externalApplicantType === 'Team' && `(${externalTeamCount + 1} Members)`}</p>
                          <p><strong>ID Proof:</strong> {externalIdentityProof ? "Uploaded" : "Not Provided"}</p>
                        </div>
                        {externalApplicantType === 'Team' && externalTeamMembers.length > 0 && (
                          <div className="sm:col-span-2 border-t pt-2 mt-2">
                            <span className="font-bold text-slate-700 block mb-1">Team Members:</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {externalTeamMembers.map((m, i) => (
                                <div key={i} className="bg-slate-50 p-1.5 border rounded">
                                  <p className="font-semibold text-slate-800">{m.name || "N/A"}</p>
                                  <p className="text-[10px] text-muted-foreground">{m.email} | {m.mobile}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Card 2: Team Details */}
                      <Card className="border border-border/80 shadow-2xs">
                        <CardHeader className="py-2.5 px-4 bg-slate-50 border-b flex flex-row justify-between items-center">
                          <h4 className="font-bold text-xs text-primary flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Team Details ({teamName || "N/A"})</h4>
                          <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="h-6 text-[10px] font-bold text-primary hover:bg-primary/10">Edit</Button>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3 text-2xs max-h-[180px] overflow-y-auto">
                          {students.map((s, idx) => (
                            <div key={idx} className="border-b last:border-0 pb-1.5 mb-1.5 last:pb-0 last:mb-0">
                              <p className="font-bold text-slate-800">Student {idx + 1}: {s.name || "N/A"}</p>
                              <p className="text-[10px] text-muted-foreground">PRN: {s.prn} | Div: {s.division} | Year: {s.year} | Mobile: {s.mobile} | Email: {s.email}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Card 3: Faculty Guide */}
                      <Card className="border border-border/80 shadow-2xs">
                        <CardHeader className="py-2.5 px-4 bg-slate-50 border-b flex flex-row justify-between items-center">
                          <h4 className="font-bold text-xs text-primary flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Faculty Guide</h4>
                          <Button variant="ghost" size="sm" onClick={() => setStep(3)} className="h-6 text-[10px] font-bold text-primary hover:bg-primary/10">Edit</Button>
                        </CardHeader>
                        <CardContent className="p-4 space-y-1.5 text-2xs">
                          <p><strong>Name:</strong> {facultyGuide.name || "N/A"}</p>
                          <p><strong>Department:</strong> {facultyGuide.department}</p>
                          <p><strong>Designation:</strong> {facultyGuide.designation}</p>
                          <p><strong>Contact:</strong> {facultyGuide.mobile} | {facultyGuide.email}</p>
                          {facultyGuide.remarks && <p><strong>Remarks:</strong> {facultyGuide.remarks}</p>}
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {/* Card 4: Selected Resources */}
                  <Card className="border border-border/80 shadow-2xs">
                    <CardHeader className="py-2.5 px-4 bg-slate-50 border-b flex flex-row justify-between items-center">
                      <h4 className="font-bold text-xs text-primary flex items-center gap-1.5"><Server className="w-3.5 h-3.5" /> Machine Bookings</h4>
                      <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="h-6 text-[10px] font-bold text-primary hover:bg-primary/10">Edit</Button>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3 text-2xs max-h-[180px] overflow-y-auto">
                      {selectedMachines.length > 0 ? (
                        <div>
                          <p className="font-bold text-slate-700">Machines Booked:</p>
                          {selectedMachines.map(mId => (
                            <p key={mId} className="text-[10px] text-muted-foreground ml-2">
                              - {machinesList.find(m => m._id === mId)?.name}: {machineDetails[mId]?.usageDate} @ {machineDetails[mId]?.startTime}-{machineDetails[mId]?.endTime} ({machineDetails[mId]?.usageHours} hrs)
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground italic">No resources selected.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Card 5: Documents */}
                  <Card className="border border-border/80 shadow-2xs md:col-span-2">
                    <CardHeader className="py-2.5 px-4 bg-slate-50 border-b flex flex-row justify-between items-center">
                      <h4 className="font-bold text-xs text-primary flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Project Documents</h4>
                      <Button variant="ghost" size="sm" onClick={() => setStep(3)} className="h-6 text-[10px] font-bold text-primary hover:bg-primary/10">Edit</Button>
                    </CardHeader>
                    <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                      <div>
                        <span className="font-semibold text-slate-600 block">Design File:</span>{" "}
                        {uploadedFiles.designFileUrl ? (
                          <a href={uploadedFiles.designFileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium break-all">{uploadedFiles.designFileUrl}</a>
                        ) : (
                          <span className="text-muted-foreground italic">None</span>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-600 block">CAD File:</span>{" "}
                        {uploadedFiles.cadFileUrl ? (
                          <a href={uploadedFiles.cadFileUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium break-all">{uploadedFiles.cadFileUrl}</a>
                        ) : (
                          <span className="text-muted-foreground italic">None</span>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-600 block">Circuit Diagram:</span>{" "}
                        {uploadedFiles.circuitDiagramUrl ? (
                          <a href={uploadedFiles.circuitDiagramUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium break-all">{uploadedFiles.circuitDiagramUrl}</a>
                        ) : (
                          <span className="text-muted-foreground italic">None</span>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-600 block">Supporting Documents:</span>{" "}
                        {uploadedFiles.supportingDocsUrl ? (
                          <a href={uploadedFiles.supportingDocsUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium break-all">{uploadedFiles.supportingDocsUrl}</a>
                        ) : (
                          <span className="text-muted-foreground italic">None</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Declarations Group */}
              <div className="space-y-6 pt-6 border-t border-slate-200">
                <div>
                  <h2 className="text-lg font-bold text-primary flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-primary" /> Declaration Agreements</h2>
                  <p className="text-[11px] text-muted-foreground font-semibold">Verify compliance agreements prior to submitting request</p>
                </div>

                <div className="space-y-4 border p-6 rounded-xl bg-slate-50 border-primary/20">
                  {[
                    { label: "I verify that all information provided is accurate and true to our best knowledge.", field: "infoAccurate" },
                    { label: "I confirm that all uploaded design files and CAD schematics belong to our team.", field: "filesBelongToTeam" },
                    { label: "We agree to adhere to all AICTE IDEA Lab guidelines, lab policies, and safety instructions.", field: "agreeToRules" },
                    { label: "We accept full responsibility for resource usage, damages, or proper return of tools.", field: "acceptResponsibility" }
                  ].map((dec) => (
                    <div key={dec.field} className="flex items-start space-x-2.5 p-1">
                      <Checkbox 
                        id={dec.field} 
                        // @ts-ignore
                        checked={declaration[dec.field]}
                        // @ts-ignore
                        onCheckedChange={(c) => setDeclaration({ ...declaration, [dec.field]: !!c })}
                        className="mt-0.5"
                      />
                      <Label htmlFor={dec.field} className="font-semibold text-xs leading-tight cursor-pointer text-slate-700">
                        {dec.label}
                      </Label>
                    </div>
                  ))}
                </div>

                {/* Actions submit/draft */}
                <div className="flex gap-4 pt-4 border-t justify-end">
                  <Button 
                    type="button" 
                    variant="outline" 
                    disabled={isSubmitting} 
                    onClick={() => handleFormSubmit("Draft")}
                    className="gap-2 font-bold text-xs h-10 px-4"
                  >
                    <Save className="w-4 h-4 text-slate-500" /> Save as Draft
                  </Button>
                  <Button 
                    type="button" 
                    disabled={isSubmitting} 
                    onClick={() => handleFormSubmit(id && id !== 'new' ? "Student Resubmitted" : "Submitted")}
                    className="gap-2 font-bold text-xs h-10 px-4 bg-primary hover:bg-primary/90"
                  >
                    <Check className="w-4 h-4" /> {isSubmitting ? "Submitting..." : (id && id !== 'new' ? "Resubmit Application" : "Submit Request")}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex justify-between border-t pt-6 mt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevStep} 
              disabled={step === 1}
              className="gap-1 font-semibold text-xs h-9"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </Button>
            
            {step < 4 ? (
              <Button 
                type="button" 
                onClick={nextStep}
                className="gap-1 font-semibold text-xs h-9 bg-primary"
              >
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <div className="w-20" /> // Spacer
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default MachineryRequestForm;
