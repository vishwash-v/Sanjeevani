import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanjeevani — Pharmacogenomic Risk Prediction System",
  description:
    "AI-powered pharmacogenomic analysis. Upload your VCF file to predict drug-specific risks and receive personalized clinical recommendations based on CPIC guidelines.",
  keywords: [
    "pharmacogenomics",
    "precision medicine",
    "VCF analysis",
    "drug metabolism",
    "CPIC guidelines",
    "CYP2D6",
    "CYP2C19",
    "CYP2C9",
    "SLCO1B1",
    "TPMT",
    "DPYD",
    "adverse drug reactions",
    "codeine",
    "warfarin",
    "clopidogrel",
    "simvastatin",
    "azathioprine",
    "fluorouracil",
    "star allele",
    "genotype phenotype",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
