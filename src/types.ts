export interface ClassificationResult {
  type: string;
  title: string;
  confidence: number;
  reasoning: string;
}

export interface NoteMetadata extends ClassificationResult {
  id: string;
  sprint: string; // handmatig meegegeven, niet door het model bepaald
  originalText: string;
  createdAt: string;
  reviewed: boolean; // true zodra het type handmatig bevestigd/aangepast is
  filePath: string;
}
