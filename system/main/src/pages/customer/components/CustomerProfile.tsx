import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Lock, Trash2, Save } from 'lucide-react';
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { PageHeader } from './PageHeader';
import { useFeedback } from "@/context/FeedbackContext";

export function CustomerProfile() {
  const { showPromise } = useFeedback();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/customer/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setFormData(prev => ({
          ...prev,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phone: data.phone_number,
          address: data.address || ''
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSave = async () => {
    const promise = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error("No token found");

      const response = await fetch('http://localhost:5000/api/customer/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to update profile');

      setIsEditing(false);
      // Update local storage user info if needed
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      sessionStorage.setItem('user', JSON.stringify({ ...user, firstName: formData.firstName, lastName: formData.lastName }));
      return "Profile updated successfully";
    };

    showPromise(promise(), {
      loading: 'Updating profile...',
      success: (data) => data,
      error: 'Failed to update profile',
    });
  };

  const handlePasswordChange = async () => {
    const promise = async () => {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error('New passwords do not match');
      }

      const token = sessionStorage.getItem('token');
      if (!token) throw new Error("No token found");

      const response = await fetch('http://localhost:5000/api/customer/change-password', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to update password');

      setShowPasswordDialog(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      return "Password updated successfully";
    };

    showPromise(promise(), {
      loading: 'Updating password...',
      success: (data) => data,
      error: (err) => err instanceof Error ? err.message : 'Failed to update password',
    });
  };

  const handleDeleteAccount = async () => {
    const promise = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) throw new Error("No token found");

      const response = await fetch('http://localhost:5000/api/customer/account', {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Failed to delete account');
      return 'Account deleted successfully';
    };

    try {
      await showPromise(promise(), {
        loading: 'Deleting account...',
        success: (data) => data,
        error: (err) => err.message || 'Failed to delete account'
      });
      sessionStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error deleting account:', error);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="p-3 md:p-8 animate-fade-in max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <PageHeader 
        title="My Account"
        description="Manage your account information and settings."
        action={
          !isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-[#3FA9BC] hover:bg-[#2A6570] transition-colors duration-200 w-full sm:w-auto h-9 text-sm"
            >
              Edit Profile
            </Button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="border-[#1A5560] text-[#1A5560] hover:bg-[#1A5560]/10 h-9 text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#3FA9BC] hover:bg-[#2A6570] transition-colors duration-200 h-9 text-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 bg-white dark:bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow duration-200">
          <h2 className="text-[#1A5560] dark:text-primary mb-4 md:mb-6 text-base md:text-xl">Profile Information</h2>
          
          <div className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="firstName" className="text-[#1A5560] dark:text-foreground text-xs md:text-sm">
                  First Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-muted-foreground" />
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                    className="pl-9 border-[#1A5560]/20 dark:border-input focus:border-[#3FA9BC] dark:focus:border-primary h-9 text-sm dark:bg-background"
                  />
                </div>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="lastName" className="text-[#1A5560] dark:text-foreground text-xs md:text-sm">
                  Last Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-muted-foreground" />
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!isEditing}
                    className="pl-9 border-[#1A5560]/20 dark:border-input focus:border-[#3FA9BC] dark:focus:border-primary h-9 text-sm dark:bg-background"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="email" className="text-[#1A5560] dark:text-foreground text-xs md:text-sm">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="pl-9 border-[#1A5560]/20 dark:border-input focus:border-[#3FA9BC] dark:focus:border-primary h-9 text-sm dark:bg-background"
                  />
                </div>
              </div>
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="phone" className="text-[#1A5560] dark:text-foreground text-xs md:text-sm">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-muted-foreground" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="pl-9 border-[#1A5560]/20 dark:border-input focus:border-[#3FA9BC] dark:focus:border-primary h-9 text-sm dark:bg-background"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="address" className="text-[#1A5560] dark:text-foreground text-xs md:text-sm">
                Address
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400 dark:text-muted-foreground" />
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!isEditing}
                  className="pl-9 border-[#1A5560]/20 dark:border-input focus:border-[#3FA9BC] dark:focus:border-primary min-h-[80px] text-sm dark:bg-background"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="space-y-3 md:space-y-6">
          {/* Security */}
          <div className="bg-white dark:bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow duration-200">
            <h2 className="text-[#1A5560] dark:text-primary mb-4 text-base md:text-xl">Security</h2>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full">
                    <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[#1A5560] dark:text-foreground font-medium text-sm">Password</p>
                    <p className="text-xs text-[#1A5560]/60 dark:text-muted-foreground">Last changed 3 months ago</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPasswordDialog(true)}
                  className="text-[#3FA9BC] dark:text-primary border-[#3FA9BC] dark:border-primary hover:bg-[#3FA9BC]/10 dark:hover:bg-primary/10 h-8 text-xs"
                >
                  Change
                </Button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white dark:bg-card rounded-xl shadow-sm p-4 md:p-6 hover:shadow-md transition-shadow duration-200 border border-red-100 dark:border-red-900/20">
            <h2 className="text-red-600 dark:text-red-400 mb-4 text-base md:text-xl">Danger Zone</h2>
            <p className="text-xs md:text-sm text-gray-600 dark:text-muted-foreground mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button
              variant="destructive"
              className="w-full bg-red-500 hover:bg-red-600 h-9 text-sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and new password below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current Password</Label>
              <Input 
                type="password" 
                id="current" 
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <Input 
                type="password" 
                id="new" 
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <Input 
                type="password" 
                id="confirm" 
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
            <Button onClick={handlePasswordChange} className="bg-[#3FA9BC] hover:bg-[#2A6570]">
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
