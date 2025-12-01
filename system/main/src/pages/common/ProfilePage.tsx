import { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Lock, Plus, Trash2, Star, Edit2, Save, X, Camera } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useFeedback } from "@/context/FeedbackContext";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Address {
  address_id: number;
  address_line: string;
  is_primary: boolean;
}

interface UserProfile {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  role: string;
  profile_picture?: string;
  addresses: Address[];
}

export default function ProfilePage() {
  const { showPromise } = useFeedback();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: '', firstName: '', lastName: '', email: '', phone: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Address Dialog State
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({ id: 0, addressLine: '' });
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Password Dialog State
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });

  // Crop State
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);

  // Login History State
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);

  useEffect(() => {
    fetchProfile();
    fetchLoginHistory();
  }, []);

  const fetchLoginHistory = async (page = 1) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/profile/login-history?page=${page}&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLoginHistory(data.history);
        setHistoryTotalPages(data.totalPages);
        setHistoryPage(data.page);
      }
    } catch (error) {
      console.error('Error fetching login history:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditForm({
          username: data.username,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phone: data.phone_number
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleUpdateProfile = async () => {
    const promise = async () => {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(editForm)
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update profile');
      }
      
      await fetchProfile();
      setIsEditing(false);

      // Update session storage and notify components
      const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
      currentUser.firstName = editForm.firstName;
      currentUser.lastName = editForm.lastName;
      currentUser.email = editForm.email;
      currentUser.username = editForm.username;
      sessionStorage.setItem('user', JSON.stringify(currentUser));
      window.dispatchEvent(new Event('user-profile-updated'));

      return 'Profile updated successfully';
    };

    showPromise(promise(), {
      loading: 'Updating profile...',
      success: (data) => data,
      error: (err) => err.message
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageSrc(reader.result as string);
      setIsCropDialogOpen(true);
    });
    reader.readAsDataURL(file);
    
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onCropComplete = (_croppedArea: any, _croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    rotation = 0
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    canvas.width = safeArea;
    canvas.height = safeArea;

    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    ctx.drawImage(
      image,
      safeArea / 2 - image.width * 0.5,
      safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.putImageData(
      data,
      0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x,
      0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((file) => {
        if (file) resolve(file);
        else reject(new Error('Canvas is empty'));
      }, 'image/jpeg');
    });
  };

  const handleSaveCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([croppedImageBlob], "profile_picture.jpg", { type: "image/jpeg" });

      const formData = new FormData();
      formData.append('profilePicture', file);

      const promise = async () => {
        const token = sessionStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/profile/picture', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (!response.ok) throw new Error('Failed to upload image');
        await fetchProfile();
        
        // Update session storage user object to reflect new picture immediately
        const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
        // We need to get the new path. Since the API might not return it directly in the simple response,
        // we rely on fetchProfile updating the state, but for the sidebar to update, we need to update session storage.
        // Ideally the API should return the new path.
        // For now, let's assume fetchProfile will get the new data, but we might need to reload or update context.
        // Let's check what fetchProfile does. It setsProfile.
        // We should also update the session storage if we can get the new URL.
        // Let's just rely on the page refresh or context update if available.
        // Actually, the sidebar reads from sessionStorage. We should update it.
        // Let's fetch the profile again and update session storage.
        
        const profileResponse = await fetch('http://localhost:5000/api/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const profileData = await profileResponse.json();
        
        currentUser.profile_picture = profileData.profile_picture;
        sessionStorage.setItem('user', JSON.stringify(currentUser));
        
        // Notify other components
        window.dispatchEvent(new Event('user-profile-updated'));

        return 'Profile picture updated';
      };

      await showPromise(promise(), {
        loading: 'Uploading image...',
        success: (data) => data,
        error: 'Failed to upload image'
      });

      setIsCropDialogOpen(false);
      setImageSrc(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddressSubmit = async () => {
    const promise = async () => {
      const token = sessionStorage.getItem('token');
      const url = isEditingAddress 
        ? `http://localhost:5000/api/profile/addresses/${addressForm.id}`
        : 'http://localhost:5000/api/profile/addresses';
      
      const method = isEditingAddress ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ addressLine: addressForm.addressLine })
      });

      if (!response.ok) throw new Error('Failed to save address');
      
      await fetchProfile();
      setIsAddressDialogOpen(false);
      return isEditingAddress ? 'Address updated' : 'Address added';
    };

    showPromise(promise(), {
      loading: 'Saving address...',
      success: (data) => data,
      error: 'Failed to save address'
    });
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;

    const promise = async () => {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/profile/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete address');
      await fetchProfile();
      return 'Address deleted';
    };

    showPromise(promise(), {
      loading: 'Deleting address...',
      success: (data) => data,
      error: 'Failed to delete address'
    });
  };

  const handleSetPrimaryAddress = async (id: number) => {
    const promise = async () => {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/profile/addresses/${id}/primary`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to set primary address');
      await fetchProfile();
      return 'Primary address updated';
    };

    showPromise(promise(), {
      loading: 'Updating primary address...',
      success: (data) => data,
      error: 'Failed to update primary address'
    });
  };

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
        showPromise(Promise.reject(new Error("Passwords do not match")), {
            loading: 'Validating...',
            success: () => '',
            error: (err) => err.message
        });
        return; 
    }

    const promise = async () => {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile/password', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
            currentPassword: passwordForm.current,
            newPassword: passwordForm.new
        })
      });

      if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to change password');
      }
      
      setIsPasswordDialogOpen(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
      return 'Password changed successfully';
    };

    showPromise(promise(), {
      loading: 'Changing password...',
      success: (data) => data,
      error: (err) => err.message
    });
  };

  if (!profile) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0B4F6C] dark:text-primary">My Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your personal information and account settings</p>
        </div>
        <Badge variant="outline" className="px-4 py-1 text-sm border-primary text-primary bg-primary/10">
          {profile.role} Account
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border shadow-md bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl text-foreground flex items-center gap-2">
                <User className="w-5 h-5" /> Personal Information
              </CardTitle>
              {!isEditing ? (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-primary hover:text-primary/80">
                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-muted-foreground">
                    <X className="w-4 h-4 mr-2" /> Cancel
                  </Button>
                  <Button size="sm" onClick={handleUpdateProfile} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Save className="w-4 h-4 mr-2" /> Save
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture Section */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
                    <AvatarImage src={profile.profile_picture ? `http://localhost:5000${profile.profile_picture}` : undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {profile.first_name[0]}{profile.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/png, image/jpeg"
                    onChange={handleImageUpload}
                  />
                </div>
                <div>
                  <h3 className="font-medium text-lg text-foreground">{profile.first_name} {profile.last_name}</h3>
                  <p className="text-muted-foreground text-sm">@{profile.username}</p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary mt-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Change Profile Picture
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Username</Label>
                  {isEditing ? (
                    <Input 
                      value={editForm.username} 
                      onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                    />
                  ) : (
                    <div className="font-medium text-lg text-foreground">{profile.username}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">First Name</Label>
                  {isEditing ? (
                    <Input 
                      value={editForm.firstName} 
                      onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                    />
                  ) : (
                    <div className="font-medium text-lg text-foreground">{profile.first_name}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Last Name</Label>
                  {isEditing ? (
                    <Input 
                      value={editForm.lastName} 
                      onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                    />
                  ) : (
                    <div className="font-medium text-lg text-foreground">{profile.last_name}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email Address</Label>
                  {isEditing ? (
                    <Input 
                      value={editForm.email} 
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <Mail className="w-4 h-4 text-muted-foreground" /> {profile.email}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Phone Number</Label>
                  {isEditing ? (
                    <Input 
                      value={editForm.phone} 
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <Phone className="w-4 h-4 text-muted-foreground" /> {profile.phone_number}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-md bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl text-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Address Book
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setAddressForm({ id: 0, addressLine: '' });
                  setIsEditingAddress(false);
                  setIsAddressDialogOpen(true);
                }}
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Address
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.addresses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-lg border border-dashed border-border">
                  No addresses found. Add one to get started.
                </div>
              ) : (
                profile.addresses.map((addr) => (
                  <div 
                    key={addr.address_id} 
                    className={`p-4 rounded-lg border transition-all ${
                      addr.is_primary 
                        ? 'bg-primary/10 border-primary shadow-sm' 
                        : 'bg-card border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{addr.address_line}</span>
                          {addr.is_primary && (
                            <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground text-[10px]">Primary</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!addr.is_primary && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Set as Primary"
                            onClick={() => handleSetPrimaryAddress(addr.address_id)}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setAddressForm({ id: addr.address_id, addressLine: addr.address_line });
                            setIsEditingAddress(true);
                            setIsAddressDialogOpen(true);
                          }}
                          className="text-muted-foreground hover:text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteAddress(addr.address_id)}
                          className="text-muted-foreground hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Security */}
        <div className="space-y-6">
          <Card className="border-border shadow-md bg-card">
            <CardHeader>
              <CardTitle className="text-xl text-foreground flex items-center gap-2">
                <Lock className="w-5 h-5" /> Security
              </CardTitle>
              <CardDescription>Manage your password and account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg border border-border">
                <h3 className="font-medium text-foreground mb-1">Password</h3>
                <p className="text-sm text-muted-foreground mb-4">Last changed: Never</p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setIsPasswordDialogOpen(true)}
                >
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Address Dialog */}
      <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Address Line</Label>
              <Textarea 
                placeholder="Enter full address..." 
                value={addressForm.addressLine}
                onChange={(e) => setAddressForm({...addressForm, addressLine: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddressDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddressSubmit} className="bg-[#3FA9BC] hover:bg-[#2A6570]">Save Address</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login History Section */}
      <Card className="mt-6 border-border bg-card">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">Login History</CardTitle>
          <CardDescription>Recent login activity for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loginHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No login history found.</p>
            ) : (
              <div className="space-y-2">
                {loginHistory.map((log) => (
                  <div key={log.history_id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg text-sm">
                    <div>
                      <div className="font-medium text-foreground">{new Date(log.created_at).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">{log.ip_address || 'Unknown IP'} • {log.user_agent ? log.user_agent.substring(0, 30) + '...' : 'Unknown Device'}</div>
                    </div>
                    <Badge variant={log.success ? "outline" : "destructive"} className={log.success ? "text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400" : ""}>
                      {log.success ? "Success" : "Failed"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            
            {historyTotalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchLoginHistory(historyPage - 1)}
                  disabled={historyPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm flex items-center">Page {historyPage} of {historyTotalPages}</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchLoginHistory(historyPage + 1)}
                  disabled={historyPage === historyTotalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input 
                type="password"
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input 
                type="password"
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input 
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} className="bg-[#3FA9BC] hover:bg-[#2A6570]">Update Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Crop Dialog */}
      <Dialog open={isCropDialogOpen} onOpenChange={setIsCropDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crop Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[400px] bg-black rounded-md overflow-hidden">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="py-4 space-y-2">
             <Label>Zoom</Label>
             <input
               type="range"
               value={zoom}
               min={1}
               max={3}
               step={0.1}
               aria-labelledby="Zoom"
               onChange={(e) => setZoom(Number(e.target.value))}
               className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
             />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCropDialogOpen(false); setImageSrc(null); }}>Cancel</Button>
            <Button onClick={handleSaveCroppedImage} className="bg-[#3FA9BC] hover:bg-[#2A6570]">Save Picture</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
