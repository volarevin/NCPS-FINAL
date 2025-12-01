import { useState } from "react";
import { Edit, Mail, Phone, MapPin, Trash2, Save, X, User, Briefcase, FileText, Shield } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { PageHeader } from "./PageHeader";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Separator } from "../../../components/ui/separator";
import { Badge } from "../../../components/ui/badge";

interface TechnicianProfileProps {
  technicianProfile: any;
  setTechnicianProfile: (profile: any) => void;
  updateProfile: (profile: any) => Promise<void>;
  technicianRatings: any[];
  handleDeleteAccount: () => void;
  renderStars: (rating: number) => JSX.Element[];
}

const SPECIALIZATIONS = [
  'Hardware Repair',
  'Software Support',
  'Network Setup',
  'Data Recovery',
  'System Maintenance',
  'Virus Removal',
  'Custom Build',
  'Consultation',
  'General'
];

export function TechnicianProfile({
  technicianProfile,
  // setTechnicianProfile,
  updateProfile,
  handleDeleteAccount,
  renderStars
}: TechnicianProfileProps) {
  const [editingProfile, setEditingProfile] = useState(false);
  const [formData, setFormData] = useState(technicianProfile);

  const handleSave = async () => {
    await updateProfile(formData);
    setEditingProfile(false);
  };

  const handleCancel = () => {
    setFormData(technicianProfile);
    setEditingProfile(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-10">
      <PageHeader 
        title="My Profile"
        description="Manage your personal information and account settings."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-b from-white to-gray-50 dark:from-card dark:to-card/95">
            <div className="h-32 bg-[#0B4F6C] dark:bg-primary relative">
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                <Avatar className="w-32 h-32 border-4 border-white dark:border-card shadow-md">
                  <AvatarFallback className="text-4xl bg-[#E5F4F5] dark:bg-primary/20 text-[#0B4F6C] dark:text-primary font-bold">
                    {technicianProfile.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <CardContent className="pt-20 pb-8 text-center space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground">{technicianProfile.name}</h2>
                <Badge variant="secondary" className="mt-2 bg-[#E5F4F5] dark:bg-primary/20 text-[#0B4F6C] dark:text-primary hover:bg-[#d0eff2] dark:hover:bg-primary/30">
                  {technicianProfile.specialization}
                </Badge>
              </div>
              
              <div className="flex justify-center items-center gap-2 py-2">
                <div className="flex gap-0.5">
                  {renderStars(technicianProfile.rating)}
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                  ({technicianProfile.rating.toFixed(1)})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-100 dark:border-border py-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#0B4F6C] dark:text-primary">{technicianProfile.totalJobs}</p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground uppercase tracking-wide">Jobs Done</p>
                </div>
                <div className="text-center border-l border-gray-100 dark:border-border">
                  <p className="text-2xl font-bold text-[#0B4F6C] dark:text-primary">
                    {new Date().getFullYear() - new Date(technicianProfile.created_at || Date.now()).getFullYear() + 1}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-muted-foreground uppercase tracking-wide">Years Exp.</p>
                </div>
              </div>

              <div className="space-y-3 text-left px-2">
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-muted-foreground">
                  <Mail className="w-4 h-4 text-[#0B4F6C] dark:text-primary" />
                  <span className="truncate">{technicianProfile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-muted-foreground">
                  <Phone className="w-4 h-4 text-[#0B4F6C] dark:text-primary" />
                  <span>{technicianProfile.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-muted-foreground">
                  <MapPin className="w-4 h-4 text-[#0B4F6C] dark:text-primary" />
                  <span className="truncate">{technicianProfile.address || "No address provided"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-100 dark:border-red-900/30 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2 text-base">
                <Shield className="w-4 h-4" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 dark:text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button variant="destructive" onClick={handleDeleteAccount} className="w-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 shadow-none">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="shadow-md border-none">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-50 dark:border-border pb-6">
              <div>
                <CardTitle className="text-xl text-[#0B4F6C] dark:text-primary">Profile Settings</CardTitle>
                <CardDescription>Update your personal details and public profile.</CardDescription>
              </div>
              {!editingProfile ? (
                <Button onClick={() => {
                  setFormData(technicianProfile);
                  setEditingProfile(true);
                }} className="bg-[#0B4F6C] dark:bg-primary hover:bg-[#145A75] dark:hover:bg-primary/90">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              {/* Personal Info Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                  <User className="w-5 h-5 text-[#0B4F6C] dark:text-primary" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={editingProfile ? formData.name : technicianProfile.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!editingProfile}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editingProfile ? formData.email : technicianProfile.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!editingProfile}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={editingProfile ? formData.phone : technicianProfile.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!editingProfile}
                      className="bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={editingProfile ? (formData.address || "") : (technicianProfile.address || "")}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      disabled={!editingProfile}
                      placeholder="Enter your address"
                      className="bg-background"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Professional Info Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                  <Briefcase className="w-5 h-5 text-[#0B4F6C] dark:text-primary" />
                  Professional Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="specialization">Specialization</Label>
                    {editingProfile ? (
                      <Select 
                        value={formData.specialization} 
                        onValueChange={(value) => setFormData({ ...formData, specialization: value })}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPECIALIZATIONS.map((spec) => (
                            <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                        {technicianProfile.specialization}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Bio Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                  <FileText className="w-5 h-5 text-[#0B4F6C] dark:text-primary" />
                  Professional Bio
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="bio">About Me</Label>
                  <Textarea
                    id="bio"
                    value={editingProfile ? (formData.bio || "") : (technicianProfile.bio || "No bio provided yet.")}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={!editingProfile}
                    placeholder="Tell customers about your experience and expertise..."
                    className={`min-h-[150px] resize-none ${!editingProfile ? "bg-muted/50 text-muted-foreground" : "bg-background"}`}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.bio ? formData.bio.length : 0}/500 characters
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
