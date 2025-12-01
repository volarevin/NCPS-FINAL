import { useState, useEffect } from 'react';
import { PageHeader } from "./PageHeader";
import { Search, ChevronLeft, ChevronRight, Eye, Download, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";

interface AuditLog {
  log_id: number;
  user_id: number;
  actor_username_real: string;
  actor_first_name: string;
  actor_last_name: string;
  actor_avatar: string;
  actor_role: string;
  action: string;
  table_name: string;
  record_id: number;
  changes: any;
  ip_address: string;
  created_at: string;
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [page, search, actionFilter, dateRange]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        ...(actionFilter !== 'all' && { action: actionFilter }),
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end })
      });

      const response = await fetch(`http://localhost:5000/api/admin/audit-logs?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLogs(data.data);
        setTotalPages(data.pagination.pages);
        setTotalRecords(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const queryParams = new URLSearchParams({
        search,
        ...(actionFilter !== 'all' && { action: actionFilter }),
        ...(dateRange.start && { startDate: dateRange.start }),
        ...(dateRange.end && { endDate: dateRange.end })
      });

      const response = await fetch(`http://localhost:5000/api/admin/audit-logs/export?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case 'CREATE': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900';
      case 'UPDATE': return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900';
      case 'LOGIN': return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-900';
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-muted dark:text-muted-foreground dark:border-border';
    }
  };

  const formatChanges = (changes: any) => {
    if (!changes) return <span className="text-gray-400 italic">No details recorded</span>;
    
    let parsed = changes;
    if (typeof changes === 'string') {
      try { parsed = JSON.parse(changes); } catch { return changes; }
    }

    // Handle simple meta/note structure (from migration)
    if (parsed.meta && parsed.note) {
      return (
        <div className="text-sm text-gray-600 dark:text-muted-foreground">
          <p>{parsed.note}</p>
          {parsed.meta !== parsed.note && <p className="text-xs mt-1 opacity-75">{parsed.meta}</p>}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4">
        {parsed.old && (
          <div className="border rounded-md p-3 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30">
            <h4 className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2 uppercase tracking-wider">Previous State</h4>
            <div className="space-y-1">
              {Object.entries(parsed.old).map(([key, value]) => (
                <div key={key} className="text-xs grid grid-cols-3 gap-2">
                  <span className="font-medium text-gray-600 dark:text-muted-foreground">{key}:</span>
                  <span className="col-span-2 text-gray-800 dark:text-foreground break-all">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {parsed.new && (
          <div className="border rounded-md p-3 bg-green-50/50 dark:bg-green-900/10 dark:border-green-900/30">
            <h4 className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2 uppercase tracking-wider">New State</h4>
            <div className="space-y-1">
              {Object.entries(parsed.new).map(([key, value]) => (
                <div key={key} className="text-xs grid grid-cols-3 gap-2">
                  <span className="font-medium text-gray-600 dark:text-muted-foreground">{key}:</span>
                  <span className="col-span-2 text-gray-800 dark:text-foreground break-all">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Track system changes and user activities."
        action={
          <Button onClick={handleExport} variant="outline" className="gap-2 dark:bg-card dark:text-foreground dark:border-border dark:hover:bg-muted">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <Card className="dark:bg-card dark:border-border">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-8 dark:bg-background dark:border-input dark:text-foreground"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[140px] dark:bg-background dark:border-input dark:text-foreground">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent className="dark:bg-popover dark:text-popover-foreground">
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-background dark:bg-muted/50 dark:border-border">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <input 
                  type="date" 
                  className="bg-transparent text-sm outline-none w-32 dark:text-foreground"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
                <span className="text-muted-foreground">-</span>
                <input 
                  type="date" 
                  className="bg-transparent text-sm outline-none w-32 dark:text-foreground"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">Loading logs...</TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">No logs found matching your criteria.</TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.log_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`http://localhost:5000${log.actor_avatar}`} />
                            <AvatarFallback>{(log.actor_first_name?.[0] || log.actor_username_real?.[0] || '?').toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{log.actor_first_name ? `${log.actor_first_name} ${log.actor_last_name}` : (log.actor_username_real || 'System')}</span>
                            <span className="text-xs text-muted-foreground">{log.actor_role || 'Unknown'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{log.table_name}</span>
                          <span className="text-xs text-muted-foreground">ID: {log.record_id || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {logs.length} of {totalRecords} records
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col dark:bg-card dark:text-foreground dark:border-border">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Transaction ID: #{selectedLog?.log_id} • {selectedLog && format(new Date(selectedLog.created_at), 'PPpp')}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">Actor</h4>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={`http://localhost:5000${selectedLog?.actor_avatar}`} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {selectedLog?.actor_first_name ? `${selectedLog.actor_first_name} ${selectedLog.actor_last_name}` : selectedLog?.actor_username_real}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-muted-foreground">IP Address</h4>
                  <p className="text-sm">{selectedLog?.ip_address || 'Unknown'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">Changes</h4>
                {selectedLog && formatChanges(selectedLog.changes)}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}