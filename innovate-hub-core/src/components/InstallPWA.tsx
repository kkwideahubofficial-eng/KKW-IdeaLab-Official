import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, clear it
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-28 right-6 sm:bottom-12 sm:right-8 z-50">
      <Button 
        onClick={handleInstallClick} 
        className="shadow-lg hover:shadow-xl transition-all duration-300 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center w-12 h-12 rounded-full sm:w-auto sm:h-12 sm:rounded-lg sm:px-4 sm:py-2.5 sm:gap-2"
        size="icon"
      >
        <Download className="w-5 h-5" />
        <span className="hidden sm:inline text-xs font-semibold">Install App</span>
      </Button>
    </div>
  );
};

export default InstallPWA;
