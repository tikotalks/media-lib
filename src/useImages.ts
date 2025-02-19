import { images } from "./data/images";
import { ImageData } from "./types";




export const useImages = () => {

  const findImageById = (id: string): ImageData | null => {
    return images.find(image => image.id === id) || null;
  };

  const findImageByName = (name: string): ImageData | null => {
    return images.find(image => image.name.toLowerCase() === name.toLowerCase()) || null;
  };

  const findImage = (value: string): ImageData | null => {
    const image = findImageById(value);
    if (image) {
      return image;
    } else {
      return findImageByName(value);
    }
  };

  const findImagesByTag = (tag: string): ImageData[] => {
    return images.filter(image =>
      image.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
  };

  const searchImages = (tags: string[]): ImageData[] => {
    if (!tags.length) return images;

    return images.filter(image =>
      tags.some(tag =>
        image.tags.some(t => t.toLowerCase() === tag.toLowerCase()) ||
        image.name.toLowerCase().includes(tag.toLowerCase()) ||
        (image.description && image.description.toLowerCase().includes(tag.toLowerCase())) ||
        (image.category && image.category.some(cat => cat.toLowerCase() === tag.toLowerCase()))
      )
    );
  };

  const getImageUrl = (idOrName: string, type?: 'thumbnail' | 'original' | 'medium'): string | null => {
    const image = findImage(idOrName);
    if (type === 'thumbnail') return image? image.url.thumbnail : null;
    if (type === 'original') return image? image.url.original : null;
    return image ? image.url.medium : null;
  };


  return {
    findImageByName,
    findImageById,
    findImage,
    findImagesByTag,
    searchImages,
    getImageUrl
  };
};
