import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { EdgeFilterType } from "@/lib/edgeDetection";

interface FilterSelectorProps {
  selectedFilter: EdgeFilterType;
  onFilterSelect: (filter: EdgeFilterType) => void;
}

export const FilterSelector = ({ selectedFilter, onFilterSelect }: FilterSelectorProps) => {
  const filters: { name: string; value: EdgeFilterType; description: string }[] = [
    { name: 'Canny', value: 'canny', description: 'Multi-stage edge detection' },
    { name: 'Sobel', value: 'sobel', description: 'Gradient-based detection' },
    { name: 'Laplacian', value: 'laplacian', description: 'Second derivative method' },
  ];

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          Edge Detection Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {filters.map((filter) => (
          <Button
            key={filter.value}
            variant={selectedFilter === filter.value ? "default" : "outline"}
            className="w-full justify-start"
            onClick={() => onFilterSelect(filter.value)}
          >
            <div className="text-left">
              <div className="font-semibold">{filter.name}</div>
              <div className="text-xs text-muted-foreground">{filter.description}</div>
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};
