import { useListApplications, useUpdateApplication, useBulkUpdateStage } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Star, GripVertical, Building2, Mail, FileText, CheckSquare, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmailTemplatesPanel } from "@/components/email-templates-panel";
import { CvScreeningPanel } from "@/components/cv-screening-panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";

const STAGES = [
  { id: 'applied', label: 'Applied' },
  { id: 'screening', label: 'Screening' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offer' },
  { id: 'hired', label: 'Hired' }
];

export default function Pipeline() {
  const { data: applications, isLoading } = useListApplications();
  const updateApplication = useUpdateApplication();
  const bulkUpdateStage = useBulkUpdateStage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Simple local state for drag and drop preview before server confirms
  const [draggedAppId, setDraggedAppId] = useState<number | null>(null);
  
  // Bulk selection state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkStage, setBulkStage] = useState<string>("");

  const handleDragStart = (e: React.DragEvent, appId: number) => {
    if (selectMode) {
      e.preventDefault();
      return;
    }
    setDraggedAppId(appId);
    e.dataTransfer.setData("appId", appId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    if (selectMode) return;
    
    const appId = Number(e.dataTransfer.getData("appId"));
    setDraggedAppId(null);
    
    if (!appId) return;

    const app = applications?.find(a => a.id === appId);
    if (app && app.stage !== targetStage) {
      updateApplication.mutate(
        { id: appId, data: { stage: targetStage as any } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
            queryClient.invalidateQueries({ queryKey: ['/api/stats/pipeline'] });
            queryClient.invalidateQueries({ queryKey: ['/api/stats/funnel'] });
          },
          onError: () => {
            toast({ title: "Failed to move candidate", variant: "destructive" });
          }
        }
      );
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkMove = () => {
    if (!bulkStage || selectedIds.length === 0) return;
    bulkUpdateStage.mutate({
      data: { applicationIds: selectedIds, stage: bulkStage as any }
    }, {
      onSuccess: () => {
        toast({ title: `Moved ${selectedIds.length} candidates` });
        setSelectedIds([]);
        setSelectMode(false);
        queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
        queryClient.invalidateQueries({ queryKey: ['/api/stats/pipeline'] });
        queryClient.invalidateQueries({ queryKey: ['/api/stats/funnel'] });
      },
      onError: (err) => {
        toast({ title: "Bulk move failed", description: err.message, variant: "destructive" });
      }
    });
  };

  // Filter out rejected for the main pipeline view
  const activeApps = applications?.filter(a => a.stage !== 'rejected') || [];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-500 relative">
      <div className="mb-6 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Pipeline Board</h1>
          <p className="text-slate-500 mt-1">Drag and drop candidates across all open positions.</p>
        </div>
        <Toggle 
          pressed={selectMode} 
          onPressedChange={(v) => { setSelectMode(v); if(!v) setSelectedIds([]); }}
          variant="outline"
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          <CheckSquare className="w-4 h-4 mr-2" />
          Select mode
        </Toggle>
      </div>

      {isLoading ? (
        <div className="flex gap-6 h-full overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-1 min-w-[280px] bg-slate-100 rounded-xl p-4">
              <Skeleton className="h-6 w-24 mb-4" />
              <Skeleton className="h-32 w-full mb-3" />
              <Skeleton className="h-32 w-full mb-3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-6 h-full overflow-x-auto pb-4 items-stretch">
          {STAGES.map(stage => {
            const stageApps = activeApps.filter(a => a.stage === stage.id);
            
            return (
              <div 
                key={stage.id}
                className="flex flex-col min-w-[320px] w-[320px] bg-slate-100/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-950/50 rounded-t-xl">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">{stage.label}</h3>
                  <Badge variant="secondary" className="bg-white dark:bg-slate-800">{stageApps.length}</Badge>
                </div>
                
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {stageApps.map(app => (
                    <Card 
                      key={app.id} 
                      className={`cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors shadow-sm ${
                        draggedAppId === app.id ? 'opacity-50' : ''
                      } ${updateApplication.isPending && updateApplication.variables?.id === app.id ? 'animate-pulse' : ''} ${
                        selectedIds.includes(app.id) ? 'ring-2 ring-primary border-primary' : ''
                      }`}
                      draggable={!selectMode}
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      onClick={() => selectMode && toggleSelection(app.id)}
                    >
                      <CardContent className="p-4 relative group">
                        {!selectMode && <GripVertical className="absolute right-3 top-4 w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        {selectMode && (
                          <div className="absolute right-3 top-4 z-10">
                            <Checkbox checked={selectedIds.includes(app.id)} />
                          </div>
                        )}
                        
                        <div className="absolute top-2 right-8 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-950 p-1 rounded shadow-sm z-20">
                          <EmailTemplatesPanel applicationId={app.id}>
                            <Button size="icon" variant="ghost" className="w-6 h-6"><Mail className="w-3 h-3" /></Button>
                          </EmailTemplatesPanel>
                          <CvScreeningPanel applicationId={app.id}>
                            <Button size="icon" variant="ghost" className="w-6 h-6"><FileText className="w-3 h-3" /></Button>
                          </CvScreeningPanel>
                        </div>
                        
                        <Link href={`/candidates/${app.candidateId}`} className="block" onClick={e => selectMode && e.preventDefault()}>
                          <div className="flex items-center gap-3 mb-3">
                            <Avatar className="w-8 h-8 rounded border border-slate-200">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold rounded">
                                {app.candidate?.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="font-medium text-sm text-slate-900 dark:text-white truncate pr-6">
                              {app.candidate?.name}
                            </div>
                          </div>
                          
                          <div className="bg-slate-50 dark:bg-slate-900 rounded p-2 mb-3">
                            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 truncate">
                              {app.job?.title}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 truncate">
                              <Building2 className="w-3 h-3" /> {app.job?.department}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            {app.fitScore !== null && app.fitScore !== undefined ? (
                              <div className="flex items-center gap-1 text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                <Star className="w-3 h-3 fill-current" />
                                {app.fitScore}% Match
                              </div>
                            ) : (
                              <div />
                            )}
                            <div className="text-[10px] text-slate-400">
                              {new Date(app.updatedAt || app.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                  {stageApps.length === 0 && (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-400">
                      Drop candidates here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selectMode && selectedIds.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-full px-6 py-3 shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-4">
          <span className="font-medium">{selectedIds.length} selected</span>
          <div className="w-px h-4 bg-slate-700 mx-2" />
          <span className="text-sm">Move to:</span>
          <Select value={bulkStage} onValueChange={setBulkStage}>
            <SelectTrigger className="w-[140px] h-8 bg-slate-800 border-slate-700 text-white focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            size="sm" 
            variant="default" 
            onClick={handleBulkMove}
            disabled={!bulkStage || bulkUpdateStage.isPending}
            className="ml-2"
          >
            {bulkUpdateStage.isPending && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
            Move
          </Button>
        </div>
      )}
    </div>
  );
}
