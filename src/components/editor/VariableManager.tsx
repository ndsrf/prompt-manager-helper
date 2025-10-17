'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Variable {
  name: string;
  type: 'text' | 'number' | 'select';
  default?: string;
  options?: string[];
}

interface VariableManagerProps {
  variables: Variable[];
  onChange: (variables: Variable[]) => void;
}

export function VariableManager({ variables, onChange }: VariableManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const addVariable = () => {
    const newVariable: Variable = {
      name: `variable${variables.length + 1}`,
      type: 'text',
      default: '',
    };
    onChange([...variables, newVariable]);
    setShowAddForm(true);
  };

  const removeVariable = (index: number) => {
    const newVariables = variables.filter((_, i) => i !== index);
    onChange(newVariables);
  };

  const updateVariable = (index: number, field: keyof Variable, value: any) => {
    const newVariables = [...variables];
    newVariables[index] = { ...newVariables[index], [field]: value };
    onChange(newVariables);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-base font-semibold">Variables</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Define variables to use in your prompt with {'{{'} name {'}}'}
          </p>
        </div>
        <Button size="sm" onClick={addVariable} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Variable
        </Button>
      </div>

      {variables.length === 0 && (
        <Card className="p-6 text-center">
          <Info className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No variables defined. Variables allow you to create reusable prompt templates.
          </p>
          <Button size="sm" onClick={addVariable} variant="outline" className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Variable
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        {variables.map((variable, index) => (
          <Card key={index} className="p-4">
            <div className="grid grid-cols-12 gap-3 items-start">
              {/* Variable Name */}
              <div className="col-span-4">
                <Label className="text-xs">Name</Label>
                <Input
                  value={variable.name}
                  onChange={(e) => updateVariable(index, 'name', e.target.value)}
                  placeholder="variableName"
                  className="h-9 mt-1"
                />
              </div>

              {/* Variable Type */}
              <div className="col-span-3">
                <Label className="text-xs">Type</Label>
                <Select
                  value={variable.type}
                  onValueChange={(value) => updateVariable(index, 'type', value)}
                >
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="select">Select</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Default Value */}
              <div className="col-span-4">
                <Label className="text-xs">Default Value</Label>
                <Input
                  value={variable.default || ''}
                  onChange={(e) => updateVariable(index, 'default', e.target.value)}
                  placeholder="Optional"
                  className="h-9 mt-1"
                />
              </div>

              {/* Delete Button */}
              <div className="col-span-1 flex items-end justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeVariable(index)}
                  className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Options for Select Type */}
              {variable.type === 'select' && (
                <div className="col-span-11">
                  <Label className="text-xs">Options (comma-separated)</Label>
                  <Input
                    value={variable.options?.join(', ') || ''}
                    onChange={(e) =>
                      updateVariable(
                        index,
                        'options',
                        e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                      )
                    }
                    placeholder="option1, option2, option3"
                    className="h-9 mt-1"
                  />
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
