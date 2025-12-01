import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Phone,
  // Shield,
  Users,
  ArrowUpCircle,
  ArrowDownCircle,
  Activity,
  Calendar,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  details: string;
}

interface UserData {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  role: "customer" | "staff" | "technician" | "admin";
  avatar?: string;
  joinedDate: string;
  activityLogs: ActivityLog[];
}

interface UserDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserData | null;
  onSave: (user: UserData) => void;
  onPromote: (id: string) => void;
  onDemote: (id: string) => void;
}

export function UserDetailsDialog({
  open,
  onOpenChange,
  user,
  onSave,
  onPromote,
  onDemote,
}: UserDetailsDialogProps) {
  const [editedUser, setEditedUser] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditedUser(user);
    setIsEditing(false);
  }, [user, open]);

  if (!user || !editedUser) return null;

  const handleSave = () => {
    onSave(editedUser);
    setIsEditing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col dark:bg-card dark:text-foreground dark:border-border">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-xl font-bold text-[#0B4F6C] dark:text-primary">
              User Profile
            </DialogTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-[#0B4F6C] dark:bg-sky-600 text-white rounded-lg hover:bg-[#093e54] dark:hover:bg-sky-700 transition-colors text-sm font-medium"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-600 dark:text-muted-foreground hover:bg-gray-100 dark:hover:bg-muted/50 rounded-lg transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition-colors text-sm font-medium"
                  >
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-6 py-4">
          {/* Left Column - Profile Info */}
          <div className="w-full md:w-1/3 space-y-6">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto rounded-full bg-gray-100 dark:bg-muted flex items-center justify-center border-4 border-white dark:border-card shadow-lg mb-4">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-bold text-xl text-foreground dark:text-foreground">
                {user.fullName}
              </h3>
              <p className="text-muted-foreground text-sm">@{user.username}</p>
              <Badge className="mt-2 bg-[#0B4F6C] dark:bg-primary">{user.role}</Badge>
            </div>

            <div className="space-y-4 bg-muted/50 p-4 rounded-xl">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Joined</span>
                <span className="font-medium dark:text-foreground">{user.joinedDate}</span>
              </div>
            </div>

            {/* Role Management */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Role Management
              </p>
              {user.role !== "admin" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onPromote(user.id)}
                    className="flex-1 py-2 px-4 bg-blue-500/10 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500/20 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    Promote
                  </button>
                  <button
                    onClick={() => onDemote(user.id)}
                    className="flex-1 py-2 px-4 bg-red-500/10 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/20 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    Demote
                  </button>
                </div>
              )}
            </div>


          </div>

          {/* Right Column - Details & Activity */}
          <div className="flex-1 flex flex-col min-h-0">
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0B4F6C] dark:text-primary" />
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Full Name</label>
                      <Input
                        disabled={!isEditing}
                        value={editedUser.fullName}
                        onChange={(e) =>
                          setEditedUser({
                            ...editedUser,
                            fullName: e.target.value,
                          })
                        }
                        className="bg-background dark:bg-background dark:border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          disabled={!isEditing}
                          value={editedUser.email}
                          onChange={(e) =>
                            setEditedUser({
                              ...editedUser,
                              email: e.target.value,
                            })
                          }
                          className="pl-10 bg-background dark:bg-background dark:border-border"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">Phone</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          disabled={!isEditing}
                          value={editedUser.phone}
                          onChange={(e) =>
                            setEditedUser({
                              ...editedUser,
                              phone: e.target.value,
                            })
                          }
                          className="pl-10 bg-background dark:bg-background dark:border-border"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border" />

                {/* Activity Log */}
                <div>
                  <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#0B4F6C] dark:text-primary" />
                    Recent Activity
                  </h4>
                  <div className="space-y-4">
                    {user.activityLogs.length > 0 ? (
                      user.activityLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex gap-4 p-3 rounded-lg bg-muted/50 border border-border"
                        >
                          <div className="mt-1">
                            <div className="w-2 h-2 rounded-full bg-[#0B4F6C] dark:bg-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {log.action}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {log.details}
                            </p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {log.timestamp}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground bg-muted/50 rounded-lg border border-dashed border-border">
                        No recent activity
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
