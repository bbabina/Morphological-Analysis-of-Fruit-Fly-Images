"use client";

import { createContext, useContext, useState } from "react";

type AnalysisResult = {
  measurement?: {
    length_px?: number;
    length_mm?: number;
    pixels_per_mm?: number;
  };
  point_8?: {
    x: number;
    y: number;
    confidence: number;
  };
  point_13?: {
    x: number;
    y: number;
    confidence: number;
  };
  metadata?: {
    analysis_id?: string;
    original_filename?: string;
    width?: number;
    height?: number;
    model_version?: string;
    task?: string;
    method?: string;
  };
  overlay_path?: string;
  error?: string;
  details?: string;
};

type ImageContextType = {
  image: string | null;
  setImage: (img: string | null) => void;
  result: AnalysisResult | null;
  setResult: (res: AnalysisResult | null) => void;
};

const ImageContext = createContext<ImageContextType>({
  image: null,
  setImage: () => {},
  result: null,
  setResult: () => {},
});

export const ImageProvider = ({ children }: { children: React.ReactNode }) => {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  return (
    <ImageContext.Provider value={{ image, setImage, result, setResult }}>
      {children}
    </ImageContext.Provider>
  );
};

export const useImage = () => useContext(ImageContext);