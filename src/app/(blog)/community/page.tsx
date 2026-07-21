import { Metadata } from "next";
import { CommunityClient } from "./community-client";

export const metadata: Metadata = {
  title: "Community Voice — Share Your Story",
  description:
    "Have a perspective on arts and culture in East Africa? We want to hear from you. Submit your story for our Community Voice section.",
  openGraph: {
    title: "Community Voice — Share Your Story | Sanaa Through My Lens",
    description:
      "Have a perspective on arts and culture in East Africa? We want to hear from you. Submit your story for our Community Voice section.",
  },
};

export default function CommunityPage() {
  return <CommunityClient />;
}
