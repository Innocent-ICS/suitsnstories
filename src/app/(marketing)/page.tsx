import { Hero } from "@/components/marketing/Hero";
import { WhatWeDo } from "@/components/marketing/WhatWeDo";
import { Problem } from "@/components/marketing/Problem";
import { SocialProof } from "@/components/marketing/SocialProof";
import { Testimonials } from "@/components/marketing/Testimonials";

export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <SocialProof />
      <WhatWeDo />
      <Testimonials />
    </>
  );
}
