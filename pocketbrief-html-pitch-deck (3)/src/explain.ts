export type SlideExplanation = {
  say: string;
  show: string;
  ask: string;
};

export const EXPLANATIONS: SlideExplanation[] = [
  {
    say: "Good morning everyone. I'll present Image Compression Models and Types from Unit V.",
    show: "the title.",
    ask: "Which book? Gonzalez and Woods, Digital Image Processing.",
  },
  {
    say: "One raw HD frame is about 6 MB, and one minute of video is about 11 GB. Compression makes storage and transmission practical.",
    show: "the shrinking bar.",
    ask: "Why not just buy more storage? Bandwidth and streaming still need small files.",
  },
  {
    say: "Compression ratio is n1 by n2. Relative redundancy is 1 minus 1 by CR. Entropy is the minimum average bits per symbol.",
    show: "the 10 MB to 2 MB example, CR 5:1, RD 80%.",
    ask: "What is redundancy? Repeated or unnecessary data.",
  },
  {
    say: "We remove three kinds of redundancy: coding, spatial or temporal, and irrelevant information.",
    show: "tap each card in turn.",
    ask: "Another name for irrelevant information? Psychovisual redundancy.",
  },
  {
    say: "Common symbols get short codes. This is Huffman coding, and the average drops from 2 bits to 1.75.",
    show: "the tree building step by step.",
    ask: "Is Huffman lossless? Yes.",
  },
  {
    say: "Neighbouring pixels are often equal, so five blue pixels are stored as 5 times Blue. This is run-length encoding.",
    show: "the merging blocks.",
    ask: "Where does RLE fail? Noisy images with few repeats.",
  },
  {
    say: "The eye cannot notice some details, so we can delete them and the image still looks the same.",
    show: "the red faded details and the file size drop.",
    ask: "Is this reversible? No.",
  },
  {
    say: "The source encoder has three blocks: mapper, quantizer and symbol encoder. The decoder reverses them.",
    show: "tap each block as the data packet passes.",
    ask: "Which block loses data? Only the quantizer.",
  },
  {
    say: "Mapper removes spatial redundancy and is reversible. Quantizer removes irrelevant information and is irreversible. Symbol encoder removes coding redundancy and is reversible.",
    show: "the Lossless mode toggle that removes the quantizer.",
    ask: "Why does lossless skip the quantizer? Because it is the only step that loses information.",
  },
  {
    say: "In lossless compression there is no quantizer, so the output is identical to the input.",
    show: "the \"difference = 0\" badge.",
    ask: "Examples? PNG, TIFF, GIF, medical scans.",
  },
  {
    say: "JPEG splits the image into 8 by 8 blocks, applies DCT, quantizes, then entropy codes. Lower quality means a smaller file but visible blocks.",
    show: "drag the quality slider.",
    ask: "Which step loses data? Quantization.",
  },
  {
    say: "Lossless is exact but larger. Lossy is much smaller but not exact.",
    show: "tap each table row.",
    ask: "JPEG vs PNG? JPEG is lossy and good for photos, PNG is lossless and good for graphics and text.",
  },
  {
    say: "JPEG is lossy, PNG is lossless, and JPEG 2000 supports both. Pick the format based on whether exactness matters.",
    show: "the mini quiz.",
    ask: "Which standard for video? MPEG or H.264.",
  },
  {
    say: "Compression powers medical imaging, satellite sensing, video streaming and cloud storage.",
    show: "tap each card to play its animation.",
    ask: "Why lossless for medical? A lost detail could change a diagnosis.",
  },
  {
    say: "In summary, compression removes redundancy, and the quantizer is where loss happens. Thank you, I am open to questions.",
    show: "the four takeaways.",
    ask: "Name the three redundancies, the three blocks, and the two types.",
  },
];