import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, BarChart3, Settings, Download, RotateCcw } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  onExport?: () => void;
  hasData?: boolean;
  onReset?: () => void;
}

export function DashboardLayout({ children, onExport, hasData = false, onReset }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">
                    Dashboard Valenty
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Pesquisa de Satisfação — Vendas, Valor & Influência
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-end">
              {hasData && (
                <>
                  <Button 
                    onClick={onExport}
                    variant="outline"
                    size="sm"
                    className="bg-card border-border/50 hover:bg-accent-light transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                  <Button 
                    onClick={onReset}
                    variant="outline"
                    size="sm"
                    className="bg-card border-border/50 hover:bg-accent-light transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Resetar
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/30 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2025 Valenty — School of Business. Dashboard desenvolvido para análise de satisfação das capacitações.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}