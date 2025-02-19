# Tiko Media

A TypeScript package for managing and accessing image data from a Google Sheets source, specifically designed for the Yes-No app. This package provides utilities to fetch, search, and filter images based on various criteria such as tags, categories, and names.

## Features

- Fetch and sync image data from Google Sheets
- Search images by tags, categories, or text
- Get image URLs in different sizes (thumbnail, medium, original)
- TypeScript support with full type definitions
- Easy-to-use composable functions

## Installation

```bash
npm install @tikotalks/media
```

## Usage

### Basic Usage

```typescript
import { useImages } from '@tikotalks/media';

const { findImage, searchImages, getImageUrl } = useImages();

// Find a single image by ID or name
const image = findImage('my-image-name');

// Search images by tags
const results = searchImages(['nature', 'animals']);

// Get image URL by ID/name and size
const imageUrl = getImageUrl('my-image-name', 'medium');
```

### Available Functions

- `findImageByName(name: string)`: Find an image by its name
- `findImageById(id: string)`: Find an image by its ID
- `findImage(value: string)`: Find an image by either ID or name
- `findImagesByTag(tag: string)`: Find all images with a specific tag
- `searchImages(tags: string[])`: Search images by multiple tags/categories/text
- `getImageUrl(idOrName: string, type?: 'thumbnail' | 'original' | 'medium')`: Get image URL by size

## Google Sheets Integration

### Setup

1. Create a Google Cloud Project and enable the Google Sheets API
2. Create a service account and download the credentials
3. Create a `.env` file with the following variables:

```env
GOOGLE_SERVICE_TYPE=service_account
GOOGLE_PROJECT_ID=your-project-id
GOOGLE_PRIVATE_KEY_ID=your-private-key-id
GOOGLE_PRIVATE_KEY=your-private-key
GOOGLE_CLIENT_EMAIL=your-service-account-email
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
GOOGLE_TOKEN_URI=https://oauth2.googleapis.com/token
GOOGLE_AUTH_PROVIDER_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
GOOGLE_CLIENT_CERT_URL=your-client-cert-url
```

### Fetching Data

Run the fetch script to sync data from Google Sheets:

```bash
npm run fetch
```

This will update the local image data in `src/data/images.ts`.

## Development

```bash
# Install dependencies
npm install

# Fetch latest data
npm run fetch

# Build the package
npm run build

# Run tests
npm test

# Development mode with watch
npm run dev
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.
