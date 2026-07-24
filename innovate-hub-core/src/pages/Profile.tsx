import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile: string;
  year: string;
  branch: string;
  role: string;
  userType: 'INTERNAL' | 'EXTERNAL';
  prn: string;
  division: string;
  externalMobile: string;
  externalCollegeOrg: string;
  externalDept: string;
  externalCity: string;
  externalState: string;
  externalIdentityProof: string;
}

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    name: "",
    email: "",
    mobile: "",
    year: "",
    branch: "",
    role: "",
    userType: "INTERNAL",
    prn: "",
    division: "",
    externalMobile: "",
    externalCollegeOrg: "",
    externalDept: "",
    externalCity: "",
    externalState: "",
    externalIdentityProof: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get("/auth/profile");
      const user = response.data.user;
      setProfile({
        ...user,
        mobile: user.mobile || "",
        year: user.year || "",
        branch: user.branch || "",
        prn: user.prn || "",
        division: user.division || "",
        externalMobile: user.externalMobile || "",
        externalCollegeOrg: user.externalCollegeOrg || "",
        externalDept: user.externalDept || "",
        externalCity: user.externalCity || "",
        externalState: user.externalState || "",
        externalIdentityProof: user.externalIdentityProof || "",
      });
    } catch (error) {
      toast.error("Failed to fetch profile data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateProfile = async () => {
    if (!profile.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSubmitting(true);
    try {
      const {
        name, email, mobile, year, branch, prn, division,
        externalMobile, externalCollegeOrg, externalDept, externalCity,
        externalState, externalIdentityProof
      } = profile;
      
      const response = await axios.put("/auth/profile", {
        name, email, mobile, year, branch, prn, division,
        externalMobile, externalCollegeOrg, externalDept, externalCity,
        externalState, externalIdentityProof
      });
      
      // Update local storage user data
      const rawUser = localStorage.getItem("idea_hub_user");
      if (rawUser) {
        const user = JSON.parse(rawUser);
        user.name = name;
        user.mobile = mobile;
        user.year = year;
        user.branch = branch;
        user.prn = prn;
        user.division = division;
        user.externalMobile = externalMobile;
        user.externalCollegeOrg = externalCollegeOrg;
        user.externalDept = externalDept;
        user.externalCity = externalCity;
        user.externalState = externalState;
        user.externalIdentityProof = externalIdentityProof;
        if (response.data.user?.userType) {
          user.userType = response.data.user.userType;
        }
        localStorage.setItem("idea_hub_user", JSON.stringify(user));
      }

      toast.success("Profile updated successfully");
      setIsEditing(false);
      fetchProfile();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      toast.success("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isInternal = profile.userType === "INTERNAL" || profile.role !== "team";

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        {profile.userType && (
          <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm w-fit ${
            profile.userType === 'INTERNAL'
              ? 'bg-blue-100 text-blue-800 border border-blue-200'
              : 'bg-orange-100 text-orange-800 border border-orange-200'
          }`}>
            {profile.userType === 'INTERNAL' 
              ? (profile.role === 'team' || !profile.role ? '🟦 KK Wagh Student' : `🟦 KK Wagh ${profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}`)
              : '🟧 External User'}
          </span>
        )}
      </div>

      {/* Profile Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Manage your personal details and contact info.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profile.name}
                disabled={!isEditing}
                onChange={(e) => handleProfileChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                value={profile.email} 
                disabled={!isEditing} 
                className={isEditing ? "" : "bg-muted"}
                onChange={(e) => handleProfileChange("email", e.target.value)} 
              />
              {isEditing && (
                <p className="text-[11px] text-muted-foreground">
                  Updating email will automatically recalculate user type and badge.
                </p>
              )}
            </div>

            {/* --- INTERNAL STUDENT FIELDS --- */}
            {isInternal && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number</Label>
                  <Input
                    id="mobile"
                    value={profile.mobile}
                    disabled={!isEditing}
                    onChange={(e) => handleProfileChange("mobile", e.target.value)}
                    placeholder="+91 9999999999"
                  />
                </div>

                {profile.role === 'team' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="prn">PRN</Label>
                      <Input
                        id="prn"
                        value={profile.prn}
                        disabled={!isEditing}
                        onChange={(e) => handleProfileChange("prn", e.target.value)}
                        placeholder="Ex. 71234567A"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="division">Division</Label>
                      <Input
                        id="division"
                        value={profile.division}
                        disabled={!isEditing}
                        onChange={(e) => handleProfileChange("division", e.target.value)}
                        placeholder="Ex. A"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch</Label>
                      <Input
                        id="branch"
                        value={profile.branch}
                        disabled={!isEditing}
                        onChange={(e) => handleProfileChange("branch", e.target.value)}
                        placeholder="Ex. Computer Engineering"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Engineering Year</Label>
                      {isEditing ? (
                        <Select
                          value={profile.year}
                          onValueChange={(value) => handleProfileChange("year", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FE">FE (First Year)</SelectItem>
                            <SelectItem value="SE">SE (Second Year)</SelectItem>
                            <SelectItem value="TE">TE (Third Year)</SelectItem>
                            <SelectItem value="BE">BE (Final Year)</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={profile.year || "Not set"} disabled />
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {/* --- EXTERNAL USER FIELDS --- */}
            {!isInternal && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="externalMobile">Mobile Number</Label>
                  <Input
                    id="externalMobile"
                    value={profile.externalMobile}
                    disabled={!isEditing}
                    onChange={(e) => handleProfileChange("externalMobile", e.target.value)}
                    placeholder="+91 9999999999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="externalCollegeOrg">College / Organization Name</Label>
                  <Input
                    id="externalCollegeOrg"
                    value={profile.externalCollegeOrg}
                    disabled={!isEditing}
                    onChange={(e) => handleProfileChange("externalCollegeOrg", e.target.value)}
                    placeholder="Ex. MIT Nashik"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="externalDept">Department / Domain</Label>
                  <Input
                    id="externalDept"
                    value={profile.externalDept}
                    disabled={!isEditing}
                    onChange={(e) => handleProfileChange("externalDept", e.target.value)}
                    placeholder="Ex. Robotics & Automation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="externalCity">City</Label>
                  <Input
                    id="externalCity"
                    value={profile.externalCity}
                    disabled={!isEditing}
                    onChange={(e) => handleProfileChange("externalCity", e.target.value)}
                    placeholder="Nashik"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="externalState">State</Label>
                  <Input
                    id="externalState"
                    value={profile.externalState}
                    disabled={!isEditing}
                    onChange={(e) => handleProfileChange("externalState", e.target.value)}
                    placeholder="Maharashtra"
                  />
                </div>

                {profile.externalIdentityProof && (
                  <div className="space-y-2">
                    <Label>Uploaded Identity Proof</Label>
                    <div className="pt-2">
                      <a
                        href={profile.externalIdentityProof}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline text-sm font-semibold"
                      >
                        Click to view Identity Proof Document
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 border-t pt-4">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => {
                  fetchProfile(); // Reset changes
                  setIsEditing(false);
              }} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleUpdateProfile} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Profile
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          )}
        </CardFooter>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password securely.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                title={showCurrentPassword ? "Hide password" : "Show password"}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                title={showNewPassword ? "Hide password" : "Show password"}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-start border-t pt-4">
          <Button onClick={handleChangePassword} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Change Password
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Profile;
