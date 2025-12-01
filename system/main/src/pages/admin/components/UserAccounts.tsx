import { PageHeader } from "./PageHeader";
import { useState, useEffect } from "react";
import { UserCard } from "./UserCard";
import { UserDetailsDialog } from "./UserDetailsDialog";
import { Search, Users, Shield, UserPlus, UserCheck, Activity, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getProfilePictureUrl } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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

export function UserAccounts() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:5000/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        const formatted = data.map((user: any) => {
          let role = "customer";
          const dbRole = user.role.toLowerCase();
          
          if (dbRole === "technician") role = "technician";
          else if (dbRole === "admin") role = "admin";
          else if (dbRole === "receptionist") role = "staff";
          else if (dbRole === "customer") role = "customer";

          return {
            id: user.user_id.toString(),
            fullName: `${user.first_name} ${user.last_name}`,
            username: user.username,
            email: user.email,
            phone: user.phone_number,
            role: role,
            avatar: getProfilePictureUrl(user.profile_picture),
            joinedDate: new Date(user.created_at).toLocaleDateString(),
            activityLogs: [], // Fetched on demand
          };
        });

        setUsers(formatted);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleViewDetails = async (user: UserData) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);

    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`http://localhost:5000/api/admin/users/${user.id}/logs`, {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      const logs = await response.json();
      
      const formattedLogs = logs.map((log: any) => {
        let details = '';
        try {
           const changes = typeof log.changes === 'string' ? JSON.parse(log.changes) : log.changes;
           if (changes?.note) details = changes.note;
           else if (changes?.meta) details = changes.meta;
           else if (log.table_name) details = `${log.action} on ${log.table_name}`;
           else details = JSON.stringify(changes);
        } catch {
           details = 'Details unavailable';
        }

        return {
          id: log.log_id.toString(),
          action: log.action,
          timestamp: new Date(log.created_at).toLocaleString(),
          details: details
        };
      });
      
      setSelectedUser({ ...user, activityLogs: formattedLogs });
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleClearAllNotifications = async () => {
    try {
        const token = sessionStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/admin/notifications', {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            // Optional: Show a toast or success message
            console.log('All notifications cleared successfully.');
        } else {
            console.error('Failed to clear notifications.');
        }
    } catch (error) {
        console.error('Error clearing notifications:', error);
    }
  };

  const stats = [
    {
      label: "Total Users",
      value: users.length,
      icon: Users,
      color: "bg-blue-500",
    },
    {
      label: "Customers",
      value: users.filter((u) => u.role === "customer").length,
      icon: UserCheck,
      color: "bg-green-500",
    },
    {
      label: "Technicians",
      value: users.filter((u) => u.role === "technician").length,
      icon: Shield,
      color: "bg-purple-500",
    },
    {
      label: "Active Now",
      value: 12,
      icon: Activity,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="User Accounts" 
        description="Manage system users, roles, and permissions."
        action={
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button 
                    className="bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-600 transition-colors shadow-sm"
                >
                    <Trash2 className="w-4 h-4" />
                    Empty Notifications
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete ALL notifications for ALL users from the system database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAllNotifications} className="bg-red-500 hover:bg-red-600">
                    Yes, clear all
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <button className="bg-[#0B4F6C] dark:bg-sky-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#093e54] dark:hover:bg-sky-700 transition-colors shadow-sm">
                <UserPlus className="w-4 h-4" />
                Add New User
            </button>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-card dark:bg-card p-4 rounded-xl shadow-sm border border-border dark:border-border flex items-center gap-4"
          >
            <div
              className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center text-white`}
            >
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground dark:text-foreground">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card dark:bg-card p-4 rounded-xl shadow-sm border border-border dark:border-border flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by name, email, or username..."
            className="pl-10 dark:bg-background dark:border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {["all", "customer", "technician", "staff", "admin"].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
                roleFilter === role
                  ? "bg-[#0B4F6C] dark:bg-sky-600 text-white"
                  : "bg-gray-100 dark:bg-muted text-gray-600 dark:text-muted-foreground hover:bg-gray-200 dark:hover:bg-muted/80"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <UserCard
            key={user.id}
            {...user}
            onClick={() => handleViewDetails(user)}
          />
        ))}
      </div>

      <UserDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        user={selectedUser}
        onSave={(updatedUser: UserData) => {
          setUsers(users.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
          setIsDetailsOpen(false);
        }}
        onPromote={(id: string) => console.log("Promote", id)}
        onDemote={(id: string) => console.log("Demote", id)}
      />
    </div>
  );
}
