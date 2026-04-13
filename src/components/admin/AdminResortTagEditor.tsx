import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Save, Search } from "lucide-react";
import { ATTRACTION_TAG_VALUES, type AttractionTag } from "@/lib/attractionTags";

interface ResortRow {
  id: string;
  resort_name: string;
  brand: string;
  location: { city?: string; state?: string } | null;
  attraction_tags: string[];
}

export default function AdminResortTagEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchFilter, setSearchFilter] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTags, setEditTags] = useState<Set<string>>(new Set());

  const { data: resorts = [], isLoading } = useQuery({
    queryKey: ["admin-resorts-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resorts")
        .select("id, resort_name, brand, location, attraction_tags")
        .order("resort_name");
      if (error) throw error;
      return (data || []) as ResortRow[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      const { error } = await supabase
        .from("resorts")
        .update({ attraction_tags: tags })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-resorts-tags"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      toast({ title: "Tags updated", description: "Resort attraction tags saved." });
      setEditingId(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update tags: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const filteredResorts = resorts.filter((r) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      r.resort_name.toLowerCase().includes(q) ||
      r.brand.replace(/_/g, " ").toLowerCase().includes(q) ||
      (r.location?.city || "").toLowerCase().includes(q) ||
      (r.location?.state || "").toLowerCase().includes(q)
    );
  });

  const startEdit = (resort: ResortRow) => {
    setEditingId(resort.id);
    setEditTags(new Set(resort.attraction_tags || []));
  };

  const toggleTag = (tag: string) => {
    setEditTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateMutation.mutate({ id: editingId, tags: Array.from(editTags) });
  };

  const taggedCount = resorts.filter((r) => r.attraction_tags?.length > 0).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resort Attraction Tags</CardTitle>
        <CardDescription>
          Manage activity tags for resort-based filtering. {taggedCount} of {resorts.length} resorts tagged.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search resorts..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="border rounded-lg overflow-auto max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Resort</TableHead>
                  <TableHead className="w-[120px]">Location</TableHead>
                  <TableHead>Attraction Tags</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResorts.map((resort) => (
                  <TableRow key={resort.id}>
                    <TableCell className="font-medium text-sm">{resort.resort_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {resort.location?.city}, {resort.location?.state}
                    </TableCell>
                    <TableCell>
                      {editingId === resort.id ? (
                        <div className="flex flex-wrap gap-1">
                          {ATTRACTION_TAG_VALUES.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => toggleTag(tag)}
                              className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                                editTags.has(tag)
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-muted text-muted-foreground border-border hover:bg-accent"
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {(resort.attraction_tags || []).length > 0 ? (
                            resort.attraction_tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No tags</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === resort.id ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={saveEdit}
                            disabled={updateMutation.isPending}
                          >
                            {updateMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(resort)}
                        >
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
