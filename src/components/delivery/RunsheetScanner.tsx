import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Scan, X, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ScannedOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total_amount: number;
}

interface RunsheetScannerProps {
  onOrderScanned: (orderId: string) => void;
  scannedOrders: ScannedOrder[];
  onRemoveOrder: (orderId: string) => void;
}

const RunsheetScanner = ({ onOrderScanned, scannedOrders, onRemoveOrder }: RunsheetScannerProps) => {
  const [scanInput, setScanInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-focus on scanner input
    if (isScanning && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isScanning]);

  const handleScan = async (input: string) => {
    if (!input.trim()) return;

    try {
      // Validate order exists
      // In real implementation, this would query the database
      onOrderScanned(input.trim());
      
      toast({
        title: "Order Added",
        description: `Order ${input.trim()} scanned successfully`,
      });

      setScanInput("");
      
      // Keep focus for continuous scanning
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error) {
      toast({
        title: "Scan Error",
        description: "Invalid order ID or order not found",
        variant: "destructive"
      });
      setScanInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleScan(scanInput);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Scan or enter order ID / barcode..."
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-12 text-lg font-mono"
                  disabled={!isScanning}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isScanning 
                  ? "Ready to scan - Use barcode scanner or type order ID and press Enter" 
                  : "Click 'Start Scanning' to begin"}
              </p>
            </div>
            <Button
              variant={isScanning ? "destructive" : "default"}
              onClick={() => setIsScanning(!isScanning)}
            >
              {isScanning ? "Stop Scanning" : "Start Scanning"}
            </Button>
          </div>

          {scannedOrders.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Scanned Orders: {scannedOrders.length}</p>
                <Badge variant="secondary">{scannedOrders.length} orders</Badge>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {scannedOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <div>
                        <p className="font-medium text-sm">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">₹{order.total_amount}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveOrder(order.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RunsheetScanner;

