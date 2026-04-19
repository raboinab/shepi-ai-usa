import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Info, TrendingUp, TrendingDown, Minus, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DealParameters,
  NWCExtractedMetrics,
  calculatePegAmount,
  calculatePriceAdjustment,
  formatCurrencyDisplay,
} from '@/lib/nwcDataUtils';

interface DealParametersCardProps {
  metrics: NWCExtractedMetrics;
  dealParameters: DealParameters;
  onUpdateDealParameters: (params: DealParameters) => void;
}

export const DealParametersCard = ({
  metrics,
  dealParameters,
  onUpdateDealParameters,
}: DealParametersCardProps) => {
  const [customAmount, setCustomAmount] = useState<string>(
    dealParameters.customPegAmount?.toString() || ''
  );
  const [estimatedClose, setEstimatedClose] = useState<string>(
    dealParameters.estimatedNWCAtClose?.toString() || ''
  );

  // Sync local state when props change
  useEffect(() => {
    if (dealParameters.customPegAmount !== null) {
      setCustomAmount(dealParameters.customPegAmount.toString());
    }
    if (dealParameters.estimatedNWCAtClose !== null) {
      setEstimatedClose(dealParameters.estimatedNWCAtClose.toString());
    }
  }, [dealParameters.customPegAmount, dealParameters.estimatedNWCAtClose]);

  const pegAmount = calculatePegAmount(metrics, dealParameters);
  const adjustment = calculatePriceAdjustment(
    dealParameters.estimatedNWCAtClose,
    pegAmount
  );

  const handleMethodChange = (value: string) => {
    onUpdateDealParameters({
      ...dealParameters,
      pegMethod: value as DealParameters['pegMethod'],
    });
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
    onUpdateDealParameters({
      ...dealParameters,
      customPegAmount: isNaN(parsed) ? null : parsed,
    });
  };

  const handleEstimatedCloseChange = (value: string) => {
    setEstimatedClose(value);
    const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
    onUpdateDealParameters({
      ...dealParameters,
      estimatedNWCAtClose: isNaN(parsed) ? null : parsed,
    });
  };

  // Pre-populate estimated NWC at close with current NWC if not set
  useEffect(() => {
    if (dealParameters.estimatedNWCAtClose === null && metrics.currentNWC !== 0) {
      onUpdateDealParameters({
        ...dealParameters,
        estimatedNWCAtClose: metrics.currentNWC,
      });
    }
  }, [metrics.currentNWC]);

  const hasAnyAverages = metrics.t3mAvg !== 0 || metrics.t6mAvg !== 0 || metrics.t12mAvg !== 0;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Deal Parameters
              <Badge variant="secondary" className="font-normal">Editable</Badge>
            </CardTitle>
            <CardDescription>
              Set the working capital target for transaction modeling
            </CardDescription>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs" side="left">
              <p className="font-medium mb-1">What is the NWC Peg?</p>
              <p className="text-sm">
                The agreed working capital target for the transaction. At closing, actual NWC
                is compared to the Peg, resulting in a dollar-for-dollar purchase price adjustment.
              </p>
              <p className="text-sm mt-2 text-muted-foreground">
                T12M average is most common as it smooths seasonal fluctuations.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Working Capital Peg Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Working Capital Peg (Target)</Label>
          
          {hasAnyAverages ? (
            <RadioGroup
              value={dealParameters.pegMethod}
              onValueChange={handleMethodChange}
              className="space-y-2"
            >
              {metrics.t3mAvg !== 0 && (
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="t3m" id="t3m" />
                  <Label htmlFor="t3m" className="flex-1 cursor-pointer">
                    <span className="font-medium">T3M Average</span>
                    <span className="ml-2 text-muted-foreground">{formatCurrencyDisplay(metrics.t3mAvg)}</span>
                  </Label>
                </div>
              )}
              
              {metrics.t6mAvg !== 0 && (
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="t6m" id="t6m" />
                  <Label htmlFor="t6m" className="flex-1 cursor-pointer">
                    <span className="font-medium">T6M Average</span>
                    <span className="ml-2 text-muted-foreground">{formatCurrencyDisplay(metrics.t6mAvg)}</span>
                  </Label>
                </div>
              )}
              
              {metrics.t12mAvg !== 0 && (
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-primary/5 hover:bg-primary/10 transition-colors">
                  <RadioGroupItem value="t12m" id="t12m" />
                  <Label htmlFor="t12m" className="flex-1 cursor-pointer">
                    <span className="font-medium">T12M Average</span>
                    <span className="ml-2 text-muted-foreground">{formatCurrencyDisplay(metrics.t12mAvg)}</span>
                    <Badge variant="outline" className="ml-2 text-xs">Recommended</Badge>
                  </Label>
                </div>
              )}
              
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom" className="flex-1 cursor-pointer">
                  <span className="font-medium">Custom Amount</span>
                </Label>
                {dealParameters.pegMethod === 'custom' && (
                  <Input
                    type="text"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    placeholder="Enter amount"
                    className="w-40"
                  />
                )}
              </div>
            </RadioGroup>
          ) : (
            <div className="space-y-3">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Sync from the spreadsheet to see suggested peg values based on calculated averages.
                </AlertDescription>
              </Alert>
              <div className="flex items-center gap-3">
                <Label htmlFor="custom-only">Custom Peg Amount</Label>
                <Input
                  id="custom-only"
                  type="text"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="$0"
                  className="w-40"
                />
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Estimated NWC at Close */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="nwc-close" className="text-sm font-medium">
              Estimated NWC at Close
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  Enter your estimated working capital at closing for "what-if" analysis.
                  Pre-populated with current NWC.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="nwc-close"
            type="text"
            value={estimatedClose}
            onChange={(e) => handleEstimatedCloseChange(e.target.value)}
            placeholder={formatCurrencyDisplay(metrics.currentNWC)}
            className="w-full"
          />
        </div>

        {/* Purchase Price Adjustment */}
        {adjustment !== null && (
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Purchase Price Adjustment</span>
              {adjustment > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : adjustment < 0 ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : (
                <Minus className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${
                adjustment > 0 ? 'text-green-600' : adjustment < 0 ? 'text-red-600' : ''
              }`}>
                {adjustment >= 0 ? '+' : ''}{formatCurrencyDisplay(adjustment)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {adjustment > 0 
                ? 'Buyer pays additional amount at close' 
                : adjustment < 0 
                  ? 'Seller credits buyer at close'
                  : 'No adjustment needed'}
            </p>
            <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Est. NWC at Close:</span>
                <span>{formatCurrencyDisplay(dealParameters.estimatedNWCAtClose)}</span>
              </div>
              <div className="flex justify-between">
                <span>Less: Peg Amount:</span>
                <span>{formatCurrencyDisplay(pegAmount)}</span>
              </div>
              <div className="flex justify-between font-medium pt-1 border-t border-border">
                <span>Adjustment:</span>
                <span>{adjustment >= 0 ? '+' : ''}{formatCurrencyDisplay(adjustment)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
