import axios from "axios";
import fs from "fs";
import path from "path";

const API_KEY = "AIzaSyDFftHSo0xYRK0PAjD5Eoc_fCOtmWflVHc";
const CHANNEL_ID = "UCL-HTw4Wfi9Igh9r1CBrrDA";
const BASE_URL = "https://www.googleapis.com/youtube/v3";

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

async function getAllVideosFromPlaylist(playlistId: string): Promise<{ title: string; videoId: string; description: string; publishedAt: string }[]> {
    const url = `${BASE_URL}/playlistItems`;
    const params = {
        part: "snippet",
        playlistId,
        maxResults: 50,
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

(async () => {
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

        videos.forEach((video) => {
            const videoData = {
                title: video.title,
                videoId: video.videoId,
                description: video.description,
                publishedAt: video.publishedAt,
                url: `https://www.youtube.com/watch?v=${video.videoId}`,
                date: new Date(video.publishedAt).toISOString().split("T")[0],
            };

            const filename = `${videoData.date}-${videoData.videoId}.json`;
            const filePath = path.join(baseDir, filename);

            // Записываем данные в файл
            fs.writeFileSync(filePath, JSON.stringify(videoData, null, 2));
        });

        console.log("Файлы успешно созданы в директории:", baseDir);
    } catch (error) {
        console.error("Произошла ошибка:", error.message);
    }
})();
