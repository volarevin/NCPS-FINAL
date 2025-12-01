import { useState } from 'react';
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../../../components/ui/avatar";
import { useFeedback } from "@/context/FeedbackContext";
import { User, Mail, Phone, MapPin, Lock, Camera } from 'lucide-react';
import { PageHeader } from './PageHeader';

export function MyAccount() {
  const { showPromise } = useFeedback();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Receptionist Name',
    email: 'receptionist@ncps.com',
    phone: '+63 912 345 6789',
    address: '123 Main St, City, Country',
    role: 'Receptionist',
    employeeId: 'REC-2024-001',
    joinDate: 'January 15, 2024'
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleSaveProfile = () => {
    const promise = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        setIsEditing(false);
        return "Profile updated successfully";
    };

    showPromise(promise(), {
        loading: 'Updating profile...',
        success: (data) => data,
        error: 'Failed to update profile',
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    
    const promise = async () => {
        if (passwords.new !== passwords.confirm) {
            throw new Error('New passwords do not match');
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        setPasswords({ current: '', new: '', confirm: '' });
        return "Password updated successfully";
    };

    showPromise(promise(), {
        loading: 'Updating password...',
        success: (data) => data,
        error: (err) => err instanceof Error ? err.message : 'Failed to update password',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="My Account" 
        description="Manage your profile settings and preferences."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 text-center">
            <div className="relative inline-block mb-4">
              <Avatar className="h-32 w-32 mx-auto border-4 border-[#E5F4F5]">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>RN</AvatarFallback>
              </Avatar>
              <Button 
                size="icon" 
                variant="secondary" 
                className="absolute bottom-0 right-0 rounded-full shadow-lg"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-xl font-bold text-[#0B4F6C]">{profile.name}</h2>
            <p className="text-gray-500 mb-4">{profile.role}</p>
            <div className="text-sm text-left space-y-3 bg-[#E5F4F5] p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">Employee ID:</span>
                <span className="font-medium text-[#0B4F6C]">{profile.employeeId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Joined Date:</span>
                <span className="font-medium text-[#0B4F6C]">{profile.joinDate}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[#0B4F6C]">Personal Information</CardTitle>
            <Button 
              variant={isEditing ? "destructive" : "outline"}
              onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[#0B4F6C]">
                  <User className="h-4 w-4" /> Full Name
                </Label>
                <Input 
                  value={profile.name}
                  disabled={!isEditing}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({...profile, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[#0B4F6C]">
                  <Mail className="h-4 w-4" /> Email Address
                </Label>
                <Input 
                  value={profile.email}
                  disabled={!isEditing}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({...profile, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[#0B4F6C]">
                  <Phone className="h-4 w-4" /> Phone Number
                </Label>
                <Input 
                  value={profile.phone}
                  disabled={!isEditing}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({...profile, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-[#0B4F6C]">
                  <MapPin className="h-4 w-4" /> Address
                </Label>
                <Input 
                  value={profile.address}
                  disabled={!isEditing}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfile({...profile, address: e.target.value})}
                />
              </div>
            </div>
            {isEditing && (
              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveProfile} className="bg-[#0B4F6C]">
                  Save Changes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-[#0B4F6C] flex items-center gap-2">
              <Lock className="h-5 w-5" /> Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input 
                  type="password" 
                  value={passwords.current}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswords({...passwords, current: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input 
                  type="password" 
                  value={passwords.new}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswords({...passwords, new: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input 
                  type="password" 
                  value={passwords.confirm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswords({...passwords, confirm: e.target.value})}
                />
              </div>
              <Button type="submit" variant="outline" className="w-full md:w-auto">
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
