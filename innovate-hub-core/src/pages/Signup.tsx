import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

const Signup = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<"coordinator" | "team" | "head">("team");
  const [isInternalEmail, setIsInternalEmail] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    teamName: "",
    mobile: "",
    year: "",
    branch: "",
    prn: "",
    division: "",
    externalMobile: "",
    externalCollegeOrg: "",
    externalDept: "",
    externalCity: "",
    externalState: "",
    externalIdentityProof: "",
  });

  const handleEmailChange = (val: string) => {
    handleChange("email", val);
    const domain = import.meta.env.VITE_INTERNAL_EMAIL_DOMAIN || "kkwagh.edu.in";
    const internal = val.toLowerCase().endsWith("@" + domain.toLowerCase());
    setIsInternalEmail(internal);
  };

  const handleIdProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size exceeds 5MB limit.");
      e.target.value = ""; // clear input
      return;
    }

    // Check file type: pdf, jpg, jpeg, png
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file format. Only PDF, JPG, JPEG, and PNG are allowed.");
      e.target.value = ""; // clear input
      return;
    }

    setUploadingId(true);
    const formDataUpload = new FormData();
    formDataUpload.append("image", file);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/upload-id`, {
        method: "POST",
        body: formDataUpload,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "File upload failed");
      }

      handleChange("externalIdentityProof", data.url);
      toast.success("Identity Proof uploaded successfully");
    } catch (err: any) {
      toast.error(err?.message || "File upload failed");
      e.target.value = "";
    } finally {
      setUploadingId(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!formData.name || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Type-specific validation checks
    if (isInternalEmail) {
      if (role === "team") {
        if (!formData.prn || !formData.division || !formData.year || !formData.branch || !formData.mobile) {
          toast.error("Please fill in all internal student fields (PRN, Division, Year, Branch, Mobile)");
          return;
        }
      } else {
        if (!formData.mobile) {
          toast.error("Please provide your mobile number");
          return;
        }
      }
    } else {
      if (role !== "team") {
        toast.error("Only internal users with a @kkwagh.edu.in email can register as Coordinator or Idea Lab Head.");
        return;
      }
      if (!formData.externalMobile || !formData.externalCollegeOrg || !formData.externalDept || !formData.externalCity || !formData.externalState || !formData.externalIdentityProof) {
        toast.error("Please fill in all external fields and upload your Identity Proof");
        return;
      }
    }

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role,
        teamName: role === "team" ? formData.teamName : "",
        prn: isInternalEmail ? formData.prn : "",
        division: isInternalEmail ? formData.division : "",
        year: isInternalEmail ? formData.year : "",
        branch: isInternalEmail ? formData.branch : "",
        mobile: isInternalEmail ? formData.mobile : "",
        externalMobile: !isInternalEmail ? formData.externalMobile : "",
        externalCollegeOrg: !isInternalEmail ? formData.externalCollegeOrg : "",
        externalDept: !isInternalEmail ? formData.externalDept : "",
        externalCity: !isInternalEmail ? formData.externalCity : "",
        externalState: !isInternalEmail ? formData.externalState : "",
        externalIdentityProof: !isInternalEmail ? formData.externalIdentityProof : "",
      };

      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Signup failed");
      }
      toast.success("Account created");
      navigate("/login");
    } catch (err: any) {
      toast.error(err?.message || "Signup failed");
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 py-12 px-4">
      <Card className="w-full max-w-md my-8">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-2">
            <img src="/logo.svg" alt="AICTE IDEA Lab Logo" className="h-32 w-auto object-contain drop-shadow-sm" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
          <CardDescription className="text-center">
            Join AICTE IDEA Lab to start your innovation journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(e) => handleEmailChange(e.target.value)}
                required
              />
              {formData.email && (
                <p className="text-xs font-semibold mt-1">
                  Detected User Type:{" "}
                  <span className={isInternalEmail ? "text-blue-600" : "text-orange-600"}>
                    {isInternalEmail ? "KK Wagh Student (Internal)" : "External User (External)"}
                  </span>
                </p>
              )}
            </div>

            {/* Role Selection (Only shown/available for internal emails) */}
            {isInternalEmail && (
              <div className="space-y-2">
                <Label>Register as</Label>
                <RadioGroup value={role} onValueChange={(value: string) => setRole(value as "coordinator" | "team" | "head")}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="team" id="team" />
                    <Label htmlFor="team" className="font-normal cursor-pointer">Team Member / Student</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="coordinator" id="coordinator" />
                    <Label htmlFor="coordinator" className="font-normal cursor-pointer">Coordinator</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="head" id="head" />
                    <Label htmlFor="head" className="font-normal cursor-pointer">Idea Lab Head</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            {/* Team Name (only for internal team members) */}
            {isInternalEmail && role === "team" && (
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  type="text"
                  placeholder="Innovation Squad"
                  value={formData.teamName}
                  onChange={(e) => handleChange("teamName", e.target.value)}
                  required
                />
              </div>
            )}

            {/* --- INTERNAL STUDENT FIELDS --- */}
            {isInternalEmail && (
              <>
                {role === "team" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="prn">PRN</Label>
                        <Input
                          id="prn"
                          type="text"
                          placeholder="e.g. 71234567A"
                          value={formData.prn}
                          onChange={(e) => handleChange("prn", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="division">Division</Label>
                        <Input
                          id="division"
                          type="text"
                          placeholder="e.g. A"
                          value={formData.division}
                          onChange={(e) => handleChange("division", e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="year">Year</Label>
                        <Select value={formData.year} onValueChange={(val) => handleChange("year", val)}>
                          <SelectTrigger id="year">
                            <SelectValue placeholder="Select Year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FE">First Year (FE)</SelectItem>
                            <SelectItem value="SE">Second Year (SE)</SelectItem>
                            <SelectItem value="TE">Third Year (TE)</SelectItem>
                            <SelectItem value="BE">Fourth Year (BE)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="branch">Branch</Label>
                        <Select value={formData.branch} onValueChange={(val) => handleChange("branch", val)}>
                          <SelectTrigger id="branch">
                            <SelectValue placeholder="Select Branch" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Computer Engineering">Computer Engineering</SelectItem>
                            <SelectItem value="Information Technology">Information Technology</SelectItem>
                            <SelectItem value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</SelectItem>
                            <SelectItem value="Electronics & Telecommunication">Electronics & Telecommunication</SelectItem>
                            <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                            <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                            <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                            <SelectItem value="Chemical Engineering">Chemical Engineering</SelectItem>
                            <SelectItem value="Robotics & Automation">Robotics & Automation</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={formData.mobile}
                    onChange={(e) => handleChange("mobile", e.target.value)}
                    required
                  />
                </div>
              </>
            )}

            {/* --- EXTERNAL USER FIELDS --- */}
            {!isInternalEmail && formData.email && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="externalCollegeOrg">College / Organization Name</Label>
                  <Input
                    id="externalCollegeOrg"
                    type="text"
                    placeholder="e.g. MIT University"
                    value={formData.externalCollegeOrg}
                    onChange={(e) => handleChange("externalCollegeOrg", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="externalDept">Department / Domain</Label>
                  <Select value={formData.externalDept} onValueChange={(val) => handleChange("externalDept", val)}>
                    <SelectTrigger id="externalDept">
                      <SelectValue placeholder="Select Department / Domain" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Computer Science / Engineering">Computer Science / Engineering</SelectItem>
                      <SelectItem value="Information Technology">Information Technology</SelectItem>
                      <SelectItem value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</SelectItem>
                      <SelectItem value="Electronics & Telecommunication">Electronics & Telecommunication</SelectItem>
                      <SelectItem value="Electronics / Robotics">Electronics / Robotics</SelectItem>
                      <SelectItem value="Mechanical Engineering">Mechanical Engineering</SelectItem>
                      <SelectItem value="Civil Engineering">Civil Engineering</SelectItem>
                      <SelectItem value="Electrical Engineering">Electrical Engineering</SelectItem>
                      <SelectItem value="Chemical Engineering">Chemical Engineering</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="externalCity">City</Label>
                    <Input
                      id="externalCity"
                      type="text"
                      placeholder="Nashik"
                      value={formData.externalCity}
                      onChange={(e) => handleChange("externalCity", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="externalState">State</Label>
                    <Input
                      id="externalState"
                      type="text"
                      placeholder="Maharashtra"
                      value={formData.externalState}
                      onChange={(e) => handleChange("externalState", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="externalMobile">Mobile Number</Label>
                  <Input
                    id="externalMobile"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={formData.externalMobile}
                    onChange={(e) => handleChange("externalMobile", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="externalIdentityProof">Upload Identity Proof (PDF, JPG, PNG - Max 5MB)</Label>
                  <Input
                    id="externalIdentityProof"
                    type="file"
                    accept=".pdf,image/jpeg,image/png"
                    onChange={handleIdProofUpload}
                    required={!formData.externalIdentityProof}
                  />
                  {uploadingId && <p className="text-xs text-muted-foreground animate-pulse">Uploading file...</p>}
                  {formData.externalIdentityProof && (
                    <p className="text-xs text-green-600 font-semibold">✓ Document Uploaded Successfully</p>
                  )}
                </div>
              </>
            )}

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={uploadingId}>
              {uploadingId ? "Uploading Document..." : "Create Account"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;
