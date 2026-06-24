import { useListCandidates } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Mail, Building2, MapPin, Github, Linkedin, Star, Briefcase, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function CandidatesList() {
  const [search, setSearch] = useState("");
  
  const { data: candidates, isLoading } = useListCandidates();

  const filteredCandidates = candidates?.filter(c => 
    !search || 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.currentTitle?.toLowerCase().includes(search.toLowerCase()) ||
    c.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Talent Pool</h1>
          <p className="text-slate-500 mt-1">Browse and manage all candidates in your database.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(import.meta.env.BASE_URL + 'api/candidates/export', '_blank')}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button asChild>
            <Link href="/candidates/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Candidate
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search candidates by name, email, role, or tags..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredCandidates?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No candidates found</h3>
            <p className="text-slate-500 mt-1 mb-4">Try adjusting your search or add a new candidate manually.</p>
            <Button asChild variant="outline">
              <Link href="/candidates/new">Add Candidate</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCandidates?.map((candidate) => (
            <Card key={candidate.id} className="hover:border-primary/50 transition-colors group">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <Avatar className="w-12 h-12 rounded-lg border border-slate-200">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold rounded-lg">
                    {candidate.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/candidates/${candidate.id}`} className="text-lg font-semibold text-slate-900 dark:text-white hover:text-primary transition-colors truncate">
                      {candidate.name}
                    </Link>
                    {candidate.tags?.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-1 shrink-0">
                      <Mail className="w-3.5 h-3.5" />
                      {candidate.email}
                    </div>
                    {candidate.currentTitle && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Briefcase className="w-3.5 h-3.5" />
                        {candidate.currentTitle} {candidate.currentCompany && `at ${candidate.currentCompany}`}
                      </div>
                    )}
                    {candidate.location && (
                      <div className="flex items-center gap-1 shrink-0">
                        <MapPin className="w-3.5 h-3.5" />
                        {candidate.location}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {candidate.linkedinUrl && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-600" asChild>
                      <a href={candidate.linkedinUrl} target="_blank" rel="noreferrer"><Linkedin className="w-4 h-4" /></a>
                    </Button>
                  )}
                  {candidate.githubUrl && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-slate-600" asChild>
                      <a href={candidate.githubUrl} target="_blank" rel="noreferrer"><Github className="w-4 h-4" /></a>
                    </Button>
                  )}
                  <Button asChild variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                    <Link href={`/candidates/${candidate.id}`}>View Profile</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Users(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
