export interface ImageData {
  id: string;
  name: string;
  filename: string;
  title: string;
  url: {
    original: string,
    thumbnail: string,
    medium: string
  };
  tags: string[];
  description?: string;
  category?: string[];
}
