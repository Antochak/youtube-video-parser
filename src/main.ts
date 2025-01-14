import axios from "axios";
import fs from "fs";
import path from "path";
import { YoutubeTranscript } from "youtube-transcript";

const API_KEY = "AIzaSyDFftHSo0xYRK0PAjD5Eoc_fCOtmWflVHc";
const CHANNEL_ID = "UCL-HTw4Wfi9Igh9r1CBrrDA";
const BASE_URL = "https://www.googleapis.com/youtube/v3";

async function getUploadsPlaylistId(channelId) {
    const url = `${BASE_URL}/channels`;
    const params = {
        part: "contentDetails",
        id: channelId,
        key: API_KEY,
    };

    try {
        const response = await axios.get(url, { params });
        if (response.data.items.length === 0) {
            throw new Error("Канал не найден или не содержит видео.");
        }
        const playlistId = response.data.items[0].contentDetails.relatedPlaylists.uploads;
        return playlistId;
    } catch (error) {
        console.error("Ошибка при получении ID плейлиста:", error.message);
        throw error;
    }
}

async function getVideoDetails(videoId) {
    const url = `${BASE_URL}/videos`;
    const params = {
        part: "contentDetails",
        id: videoId,
        key: API_KEY,
    };

    try {
        const response = await axios.get(url, { params });
        if (response.data.items.length === 0) {
            throw new Error("Видео не найдено.");
        }
        const durationISO = response.data.items[0].contentDetails.duration;
        const duration = parseDuration(durationISO);
        return { duration };
    } catch (error) {
        console.error("Ошибка при получении деталей видео:", error.message);
        throw error;
    }
}

function parseDuration(durationISO) {
    const match = durationISO.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;

    return hours * 3600 + minutes * 60 + seconds;
}

async function getVideoTranscription(videoId) {
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId);
        return transcript.map((item) => item.text).join(" ");
    } catch (error) {
        console.error(`Ошибка при получении транскрипции видео ${videoId}:`, error.message);
        return "Транскрипция недоступна.";
    }
}

async function getAllVideosFromPlaylist(playlistId) {
    const url = `${BASE_URL}/playlistItems`;
    const params = {
        part: "snippet",
        playlistId,
        maxResults: 50,
        key: API_KEY,
    };

    let nextPageToken;
    const videos = [];

    try {
        do {
            const response = await axios.get(url, { params: { ...params, pageToken: nextPageToken } });
            const items = response.data.items;
            for (const item of items) {
                const videoId = item.snippet.resourceId.videoId;
                const { duration } = await getVideoDetails(videoId);
                videos.push({
                    title: item.snippet.title,
                    videoId,
                    description: item.snippet.description,
                    publishedAt: item.snippet.publishedAt,
                    duration,
                });
            }
            nextPageToken = response.data.nextPageToken;
        } while (nextPageToken);

        return videos;
    } catch (error) {
        console.error("Ошибка при получении видео из плейлиста:", error.message);
        throw error;
    }
}

async function generateJSON() {
    try {
        console.log("Получение ID плейлиста...");
        const playlistId = await getUploadsPlaylistId(CHANNEL_ID);

        console.log("Получение списка видео...");
        const videos = await getAllVideosFromPlaylist(playlistId);
        console.log("Получено", videos.length, "видео");

        const baseDir = path.join(process.cwd(), "out", "transcriptions");

        // Создаем директорию, если она не существует
        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
        }

        for (const video of videos) {
            console.log(`Обработка видео: ${video.title} (${video.videoId})`);

            const transcription = await getVideoTranscription(video.videoId);

            const videoData = {
                title: video.title,
                videoId: video.videoId,
                description: video.description,
                publishedAt: video.publishedAt,
                url: `https://www.youtube.com/watch?v=${video.videoId}`,
                date: new Date(video.publishedAt).toISOString().split("T")[0],
                duration: video.duration,
                transcription,
            };

            const filename = `${videoData.date}-${videoData.videoId}.json`;
            const filePath = path.join(baseDir, filename);

            // Записываем данные в файл
            fs.writeFileSync(filePath, JSON.stringify(videoData, null, 2));
            console.log(`Файл ${filename} успешно создан.`);
        }

        console.log("Все файлы JSON успешно созданы.");
    } catch (error) {
        console.error("Произошла ошибка:", error.message);
    }
}

async function generateTXT() {
    try {
        console.log("Получение ID плейлиста...");
        const playlistId = await getUploadsPlaylistId(CHANNEL_ID);

        console.log("Получение списка видео...");
        const videos = await getAllVideosFromPlaylist(playlistId);
        console.log("Получено", videos.length, "видео");

        const baseDir = path.join(process.cwd(), "out", "text");

        // Создаем директорию, если она не существует
        if (!fs.existsSync(baseDir)) {
            fs.mkdirSync(baseDir, { recursive: true });
        }

        for (const video of videos) {
            console.log(`Обработка видео: ${video.title} (${video.videoId})`);

            const transcription = await getVideoTranscription(video.videoId);

            const filename = `${new Date(video.publishedAt).toISOString().split("T")[0]}-${video.videoId}.txt`;
            const filePath = path.join(baseDir, filename);

            // Записываем данные в файл
            fs.writeFileSync(filePath, transcription);
            console.log(`Файл ${filename} успешно создан.`);
        }

        console.log("Все текстовые файлы успешно созданы.");
    } catch (error) {
        console.error("Произошла ошибка:", error.message);
    }
}

async function main() {
    const args = process.argv.slice(2); 
    if (args.length === 0) {
        console.log("Please provide a command: 'json' or 'txt'");
        return;
    }

    const command = args[0];

    switch (command) {
        case 'json':
            await generateJSON();
            break;
        case 'txt':
            await generateTXT();
            break;
        default:
            console.log("Unknown command. Use 'json' or 'txt'.");
    }
}

main();
