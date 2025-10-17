'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  Search,
  Star,
  TrendingUp,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TemplateBrowserProps {
  onSelectTemplate?: (templateId: string) => void;
  trigger?: React.ReactNode;
}

export function TemplateBrowser({
  onSelectTemplate,
  trigger,
}: TemplateBrowserProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  const { data: categories } = trpc.template.getCategories.useQuery(undefined, {
    enabled: isOpen,
  });

  const { data: templates, isLoading } = trpc.template.getAll.useQuery(
    {
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      search: search || undefined,
    },
    { enabled: isOpen }
  );

  const { data: popularTemplates } = trpc.template.getPopular.useQuery(
    { limit: 5 },
    { enabled: isOpen }
  );

  const createFromTemplate = trpc.template.createFromTemplate.useMutation({
    onSuccess: (prompt) => {
      toast({
        title: 'Success',
        description: 'Prompt created from template',
      });
      setIsOpen(false);
      router.push(`/editor/${prompt.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleUseTemplate = (templateId: string) => {
    if (onSelectTemplate) {
      onSelectTemplate(templateId);
      setIsOpen(false);
    } else {
      createFromTemplate.mutate({ templateId });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Browse Templates
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Prompt Templates</DialogTitle>
          <DialogDescription>
            Start with a pre-made template to speed up your workflow
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-6 flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="col-span-1 space-y-4 overflow-y-auto pr-2">
            {/* Search */}
            <div className="space-y-2">
              <Label className="text-sm">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search templates..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label className="text-sm">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((category: any) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name} ({category.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Popular Templates */}
            {popularTemplates && popularTemplates.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Popular
                </Label>
                <div className="space-y-1">
                  {popularTemplates.map((template: any) => (
                    <Button
                      key={template.id}
                      variant={
                        selectedTemplate?.id === template.id ? 'secondary' : 'ghost'
                      }
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <Star className="h-3 w-3 mr-2" />
                      {template.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="col-span-3 flex flex-col overflow-hidden">
            {/* Template Grid */}
            {!selectedTemplate && (
              <div className="overflow-y-auto pr-2">
                {isLoading && (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">
                      Loading templates...
                    </p>
                  </div>
                )}

                {!isLoading && (!templates || templates.length === 0) && (
                  <Card className="p-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No templates found
                    </p>
                  </Card>
                )}

                {templates && templates.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {templates.map((template: any) => (
                      <Card
                        key={template.id}
                        className="p-4 cursor-pointer hover:border-blue-500 transition-colors"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-sm line-clamp-1">
                              {template.name}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              {template.usageCount} uses
                            </span>
                            {template.targetLlm && (
                              <Badge variant="outline" className="text-xs">
                                {template.targetLlm}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Template Detail View */}
            {selectedTemplate && (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold">
                        {selectedTemplate.name}
                      </h3>
                      <Badge>{selectedTemplate.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedTemplate.description}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTemplate(null)}
                  >
                    Back
                  </Button>
                </div>

                {/* Template Content */}
                <Card className="p-4 flex-1 overflow-y-auto mb-4">
                  <Label className="text-sm font-semibold mb-2 block">
                    Template Content
                  </Label>
                  <div className="bg-muted/50 p-4 rounded text-sm whitespace-pre-wrap font-mono">
                    {selectedTemplate.content}
                  </div>
                </Card>

                {/* Variables */}
                {selectedTemplate.variables &&
                  Array.isArray(selectedTemplate.variables) &&
                  selectedTemplate.variables.length > 0 && (
                    <Card className="p-4 mb-4">
                      <Label className="text-sm font-semibold mb-2 block">
                        Variables
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.variables.map((variable: any, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {'{{'} {variable.name} {'}}'}
                          </Badge>
                        ))}
                      </div>
                    </Card>
                  )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>{selectedTemplate.usageCount} people used this</span>
                  </div>
                  <Button
                    onClick={() => handleUseTemplate(selectedTemplate.id)}
                    disabled={createFromTemplate.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {createFromTemplate.isPending ? 'Creating...' : 'Use This Template'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
