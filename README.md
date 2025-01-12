# YouTube Video Transcription and Metadata Fetcher

This project is a Node.js application that fetches video metadata and transcriptions from a specified YouTube channel. It utilizes the YouTube Data API and a transcript fetching library to gather and store video information in JSON format.

## Features

- Fetches video metadata including title, description, publication date, and duration.
- Retrieves video transcriptions using the `youtube-transcript` library.
- Stores the fetched data in JSON files for easy access and analysis.

## Technology Stack

- **Node.js**: JavaScript runtime environment.
- **TypeScript**: Superset of JavaScript that adds static typing.
- **Axios**: Promise-based HTTP client for making API requests.
- **YouTube Data API**: Used to fetch video metadata.
- **youtube-transcript**: Library for fetching YouTube video transcriptions.

## Prerequisites

- Node.js (latest LTS version recommended)
- npm (Node package manager)

## Setup and Installation

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Set up API Key**:

   - Ensure you have a valid YouTube Data API key.
   - Replace the `API_KEY` constant in `src/main.ts` with your API key.

4. **Run the application**:

   ```bash
   npm start
   ```

   This will execute the script and generate JSON files containing video metadata and transcriptions in the `out/transcriptions` directory.

## Usage

- The application fetches all videos from the specified YouTube channel and stores their metadata and transcriptions.
- JSON files are named using the format `YYYY-MM-DD-videoId.json`.

## License

This project is licensed under the MIT License.
