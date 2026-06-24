import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useScreenApplication } from "@workspace/api-client-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function CvScreeningPanel({ applicationId, children }: { applicationId: number, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const screenApp = useScreenApplication();

  const [fitScore, setFitScore] = useState<number>(50);
  const [recommendation, setRecommendation] = useState<string>("hold");
  const [mustHaveScore, setMustHaveScore] = useState<string>("");
  const [strengths, setStrengths] = useState<string>("");
  const [gaps, setGaps] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const handleSubmit = () => {
    screenApp.mutate({
      id: applicationId,
      data: {
        fitScore,
        recommendation: recommendation as 'advance' | 'hold' | 'reject',
        mustHaveScore,
        strengths: strengths.split('\n').map(s => s.trim()).filter(Boolean),
        gaps: gaps.split('\n').map(s => s.trim()).filter(Boolean),
        notes
      }
    }, {
      onSuccess: () => {
        toast({ title: "Screening completed", description: "The application has been updated." });
        queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
        setOpen(false);
      },
      onError: (error) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Screen CV</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Fit Score ({fitScore}/100)</Label>
              <Input 
                type="number" 
                min={0} max={100} 
                value={fitScore} 
                onChange={(e) => setFitScore(Number(e.target.value))}
                className="w-20"
              />
            </div>
            <Slider 
              value={[fitScore]} 
              onValueChange={(val) => setFitScore(val[0])} 
              max={100} 
              step={1} 
            />
          </div>

          <div className="space-y-3">
            <Label>Recommendation</Label>
            <ToggleGroup type="single" value={recommendation} onValueChange={(val) => { if(val) setRecommendation(val) }} className="justify-start">
              <ToggleGroupItem value="advance" className="data-[state=on]:bg-green-100 data-[state=on]:text-green-700">Advance</ToggleGroupItem>
              <ToggleGroupItem value="hold" className="data-[state=on]:bg-amber-100 data-[state=on]:text-amber-700">Hold</ToggleGroupItem>
              <ToggleGroupItem value="reject" className="data-[state=on]:bg-red-100 data-[state=on]:text-red-700">Reject</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-3">
            <Label>Must-have Score</Label>
            <Input 
              placeholder="e.g. 3/4 met" 
              value={mustHaveScore}
              onChange={(e) => setMustHaveScore(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <Label>Strengths (one per line)</Label>
            <Textarea 
              placeholder="Strong React skills..."
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Gaps (one per line)</Label>
            <Textarea 
              placeholder="Lacks backend experience..."
              value={gaps}
              onChange={(e) => setGaps(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Notes</Label>
            <Textarea 
              placeholder="Additional comments..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSubmit} disabled={screenApp.isPending}>
              {screenApp.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Screening
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
