import type { ComponentType } from "react";
import {
  CoverSlide,
  HuffmanSlide,
  RedundancySlide,
  TermsSlide,
  WhySlide,
} from "./CmpA";
import {
  BlocksSlide,
  LosslessSlide,
  ModelSlide,
  PsychSlide,
  RleSlide,
} from "./CmpB";
import {
  AppsSlide,
  JpegSlide,
  StandardsSlide,
  SummarySlide,
  VsSlide,
} from "./CmpC";

export type SlideDef = {
  id: string;
  label: string;
  Component: ComponentType;
};

export const SLIDES: SlideDef[] = [
  { id: "cover", label: "Cover", Component: CoverSlide },
  { id: "why", label: "Why compression", Component: WhySlide },
  { id: "terms", label: "Key terms · CR / RD / H", Component: TermsSlide },
  { id: "redundancy", label: "Three redundancies", Component: RedundancySlide },
  { id: "huffman", label: "Coding · Huffman", Component: HuffmanSlide },
  { id: "rle", label: "Spatial · RLE", Component: RleSlide },
  { id: "psych", label: "Psychovisual", Component: PsychSlide },
  { id: "model", label: "The compression model", Component: ModelSlide },
  { id: "blocks", label: "The three blocks", Component: BlocksSlide },
  { id: "lossless", label: "Error-free compression", Component: LosslessSlide },
  { id: "jpeg", label: "Lossy · JPEG", Component: JpegSlide },
  { id: "vs", label: "Lossless vs lossy", Component: VsSlide },
  { id: "standards", label: "Standards + quiz", Component: StandardsSlide },
  { id: "apps", label: "Applications", Component: AppsSlide },
  { id: "summary", label: "Summary", Component: SummarySlide },
];
