import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const API_KEY = "AIzaSyDFftHSo0xYRK0PAjD5Eoc_fCOtmWflVHc";
const CHANNEL_ID = "UCL-HTw4Wfi9Igh9r1CBrrDA";
const BASE_URL = "https://www.googleapis.com/youtube/v3";

// Получаем путь к текущей директории
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Функция для получения ID плейлиста с загруженными видео канала
async function getUploadsPlaylistId(channelId: string): Promise<string> {
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

// Функция для получения всех видео из указанного плейлиста
async function getAllVideosFromPlaylist(playlistId: string): Promise<{ title: string; videoId: string; description: string; publishedAt: string }[]> {
    const url = `${BASE_URL}/playlistItems`;
    const params = {
        part: "snippet",
        playlistId,
        maxResults: 50, // Максимум 50 элементов за один запрос
        key: API_KEY,
    };

    let nextPageToken: string | undefined = undefined;
    const videos: { title: string; videoId: string; description: string; publishedAt: string }[] = [];

    try {
        do {
            const response = await axios.get(url, { params: { ...params, pageToken: nextPageToken } });
            const items = response.data.items;
            items.forEach((item) => {
                videos.push({
                    title: item.snippet.title,
                    videoId: item.snippet.resourceId.videoId,
                    description: item.snippet.description,
                    publishedAt: item.snippet.publishedAt,
                });
            });
            nextPageToken = response.data.nextPageToken;
        } while (nextPageToken);

        return videos;
    } catch (error) {
        console.error("Ошибка при получении видео из плейлиста:", error.message);
        throw error;
    }
}

// Функция для записи данных в CSV
function writeToCSV(videos: { title: string; videoId: string; description: string; publishedAt: string }[], filename: string) {
    const csvRows = videos.map((video, index) => {
        const url = `https://www.youtube.com/watch?v=${video.videoId}`;
        const description = video.description
            .replace(/\n/g, '\n') // сохраняем переносы строк
            .replace(/"/g, '""'); // экранируем кавычки
        const date = new Date(video.publishedAt).toISOString().split('T')[0]; // Форматируем дату в YYYY-MM-DD

        // Возвращаем строку для записи, разделяя элементы
        return `${index + 1} ${url}\n${video.title}\n${date}\n${description}`;
    });

    const csvContent = csvRows.join("\n\n"); // Пустая строка для отступа между видео

    fs.writeFileSync(filename, csvContent);
}

(async () => {
    try {
        console.log("Получение ID плейлиста...");
        const playlistId = await getUploadsPlaylistId(CHANNEL_ID);

        console.log("Получение списка видео...");
        const videos = await getAllVideosFromPlaylist(playlistId);

        console.log("Запись в файл...");
        const filename = path.join(__dirname, "list.csv");
        writeToCSV(videos, filename);

        console.log("Файл list.csv успешно создан!");
    } catch (error) {
        console.error("Произошла ошибка:", error.message);
    }
})();
