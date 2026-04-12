import { HeroSection } from './home/HeroSection';
import { ProblemSolutionSection } from './home/ProblemSolutionSection';
import { HowItWorksSection } from './home/HowItWorksSection';
import { SmartMatchingSection } from './home/SmartMatchingSection';
import { FeaturedTechniciansSection } from './home/FeaturedTechniciansSection';
import { SocialProofSection } from './home/SocialProofSection';
import { BecomeTechnicianSection } from './home/BecomeTechnicianSection';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <ProblemSolutionSection />
      <HowItWorksSection />
      <SmartMatchingSection />
      <FeaturedTechniciansSection />
      <SocialProofSection />
      <BecomeTechnicianSection />
    </main>
  );
}
