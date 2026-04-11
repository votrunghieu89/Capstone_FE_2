import { useState } from 'react';
import { HeroSection } from './home/HeroSection';
import { ServiceGrid } from './home/ServiceGrid';
import { ProblemSolutionSection } from './home/ProblemSolutionSection';
import { HowItWorksSection } from './home/HowItWorksSection';
import { SmartMatchingSection } from './home/SmartMatchingSection';
import { FeaturedTechniciansSection } from './home/FeaturedTechniciansSection';
import { SocialProofSection } from './home/SocialProofSection';
import { BecomeTechnicianSection } from './home/BecomeTechnicianSection';
import { AIDiagnosticModal } from '@/components/customer/AIDiagnosticModal';

export default function HomePage() {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [initialAIQuery, setInitialAIQuery] = useState('');

  const triggerAI = (query: string) => {
    setInitialAIQuery(query);
    setIsAIModalOpen(true);
  };

  return (
    <main>
      <HeroSection onDiagnose={triggerAI} />
      <ServiceGrid />
      <ProblemSolutionSection />
      <HowItWorksSection />
      <SmartMatchingSection />
      <FeaturedTechniciansSection />
      <SocialProofSection />
      <BecomeTechnicianSection />

      <AIDiagnosticModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        initialQuery={initialAIQuery}
      />
    </main>
  );
}
