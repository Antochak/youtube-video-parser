import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const downloadAudio = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const baseDir = path.join(process.cwd(), 'out', 'mp3');

    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    const command = `yt-dlp -x --audio-format mp3 --cookies-from-browser chrome "${url}"`;

    console.log(`🎵 Downloading audio: ${url}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${stderr}`);
        reject(error);
        return;
      }
      console.log(`Done:\n${stdout}`);

      const match = stdout.match(/\[ExtractAudio\] Destination: (.+)/);
      if (match) {
        resolve(match[1]);
      } else {
        reject('Failed to determine the file path.');
      }
    });
  });
};

(async () => {
  try {
    const videoUrl = 'https://www.youtube.com/shorts/IPKJudxu8VI';
    const filePath = await downloadAudio(videoUrl);
    console.log(`🎧 Аудио сохранено в: ${filePath}`);
  } catch (error) {
    console.error('Ошибка при скачивании:', error);
  }
})();
