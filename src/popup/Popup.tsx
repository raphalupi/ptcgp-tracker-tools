import { useState, useEffect } from 'react';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Accordion } from '@/components/ui/accordion';
import { MyProfile } from '@/components/accordions/MyProfile';
import { TradingSettings } from '@/components/accordions/TradingSettings';
import { Footer } from '@/components/Footer';
import { getTradingData } from '@/lib/trading-utils';

const PopupContent = () => {
  const [openSections, setOpenSections] = useState<string[]>([]);

  useEffect(() => {
    // Check if we have profile data to determine which accordion to open
    const loadData = async () => {
      const tradingData = await getTradingData();
      setOpenSections(tradingData?.profile ? ['trading'] : ['profile']);
    };
    loadData();
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
          <MyProfile />
          <TradingSettings />
        </Accordion>
      </div>
      <Footer />
    </div>
  );
};

export default function Popup() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="ptcgp-theme">
      <PopupContent />
    </ThemeProvider>
  );
}