import { useState, useEffect } from 'react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Accordion } from '@/components/ui/accordion';
import { AccountSetup } from '@/components/accordions/AccountSetup';
import { TradingSettings } from '@/components/accordions/TradingSettings';
import { Footer } from '@/components/Footer';
import { checkSetupStatus } from '@/lib/setup-status';

const PopupContent = () => {
  const [openSections, setOpenSections] = useState<string[]>([]);

  useEffect(() => {
    // Only check initial setup status to determine which accordion to open
    chrome.storage.local.get(['profileUrl', 'collection'], (result) => {
      const status = checkSetupStatus(result.profileUrl || null, result.collection || null);
      setOpenSections(status.needsAttention ? ['account'] : ['trading']);
    });
  }, []);

  return (
    <div className="w-[320px] min-h-[300px] bg-background text-foreground flex flex-col">
      <div className="p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2 items-center">
          <h1 className="text-lg font-bold">PTCGP Tracker Tools</h1>
          <p className="text-sm text-muted-foreground">Enhance your trading experience</p>
          <ThemeToggle />
        </div>
        <Accordion 
          type="multiple" 
          value={openSections}
          onValueChange={setOpenSections}
          className="w-full"
        >
          <AccountSetup />
          <TradingSettings />
        </Accordion>
      </div>
      <Footer />
    </div>
  );
};

export default function Popup() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ptcgp-theme">
      <PopupContent />
    </ThemeProvider>
  );
}