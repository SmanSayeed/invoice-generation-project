import { LandingPage } from "@/components/landing-page";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic"; // Ensure directory is read at request time if new images are added

export default function HomePage() {
  const galleryDir = path.join(process.cwd(), "public", "images", "gallery");
  let files: string[] = [];

  try {
    if (fs.existsSync(galleryDir)) {
      files = fs.readdirSync(galleryDir).filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
    } else {
      console.warn("Gallery directory not found:", galleryDir);
    }
  } catch (error) {
    console.error("Error reading gallery directory:", error);
  }

  return <LandingPage galleryFiles={files} />;
}
