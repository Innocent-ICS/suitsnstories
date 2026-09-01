import { Hero } from "@/components/marketing/Hero";
import { WhatWeDo } from "@/components/marketing/WhatWeDo";
import { Problem } from "@/components/marketing/Problem";
import { SocialProof } from "@/components/marketing/SocialProof";
import { Testimonials } from "@/components/marketing/Testimonials";
import { testimonials, type Testimonial } from "@/data/testimonials";
import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";

export const revalidate = 300;

const getApprovedRecommendations = unstable_cache(
  async () => db.recommendation.findMany({
    where: { status: "APPROVED" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
          profile: {
            select: {
              company: true,
              industry: true,
            },
          },
        },
      },
    },
    orderBy: [{ featured: "desc" }, { reviewedAt: "desc" }, { createdAt: "desc" }],
    take: 12,
  }),
  ["marketing-approved-recommendations"],
  { revalidate: 300, tags: ["marketing-recommendations"] }
);

export default async function Home() {
  const approvedRecommendations = await getApprovedRecommendations().catch(() => {
    return [];
  });

  const communityTestimonials: Testimonial[] = approvedRecommendations.map((recommendation) => ({
    id: `recommendation-${recommendation.id}`,
    stars: recommendation.stars,
    text: recommendation.text,
    name:
      recommendation.user.name ||
      recommendation.user.email?.split("@")[0] ||
      "Suits & Stories client",
    role:
      recommendation.role ||
      recommendation.user.profile?.company ||
      recommendation.user.profile?.industry ||
      "Suits & Stories client",
    image: recommendation.user.image,
    featured: recommendation.featured,
  }));

  return (
    <>
      <Hero />
      <Problem />
      <SocialProof />
      <WhatWeDo />
      <Testimonials items={[...testimonials, ...communityTestimonials]} />
    </>
  );
}
