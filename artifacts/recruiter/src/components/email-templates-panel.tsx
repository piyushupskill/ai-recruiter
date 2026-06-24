import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGenerateEmailTemplate } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Copy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

const TEMPLATE_TYPES = [
  { id: 'advancement', label: 'Advancement', icon: Mail },
  { id: 'rejection', label: 'Rejection', icon: Mail },
  { id: 'hold_waitlist', label: 'Hold/Waitlist', icon: Mail },
  { id: 'offer', label: 'Offer', icon: Mail },
  { id: 'interview_invite', label: 'Interview Invite', icon: Mail },
  { id: 'cold_outreach', label: 'Cold Outreach', icon: Mail },
  { id: 'follow_up', label: 'Follow-up', icon: Mail },
];

export function EmailTemplatesPanel({ applicationId, children }: { applicationId: number, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const { toast } = useToast();

  const generateTemplate = useGenerateEmailTemplate();

  const handleGenerate = (typeId: string) => {
    setSelectedType(typeId);
    generateTemplate.mutate({ id: applicationId, data: { type: typeId as any } });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard.` });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Email Templates</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {TEMPLATE_TYPES.map(type => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              return (
                <Card 
                  key={type.id} 
                  className={`cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}`}
                  onClick={() => handleGenerate(type.id)}
                >
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2 h-full">
                    <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-slate-500'}`} />
                    <span className="text-sm font-medium">{type.label}</span>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {generateTemplate.isPending && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Generating template...</p>
            </div>
          )}

          {generateTemplate.data && !generateTemplate.isPending && (
            <div className="space-y-4 border-t pt-6 animate-in fade-in">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Subject</label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generateTemplate.data.subject, 'Subject')}>
                    <Copy className="w-4 h-4 mr-2" /> Copy
                  </Button>
                </div>
                <Input readOnly value={generateTemplate.data.subject} className="bg-slate-50 font-medium" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Body</label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(generateTemplate.data.body, 'Body')}>
                    <Copy className="w-4 h-4 mr-2" /> Copy
                  </Button>
                </div>
                <Textarea 
                  readOnly 
                  value={generateTemplate.data.body} 
                  className="bg-slate-50 min-h-[250px]" 
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
