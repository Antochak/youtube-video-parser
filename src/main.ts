import axios from "axios";

const API_KEY = "AIzaSyDFftHSo0xYRK0PAjD5Eoc_fCOtmWflVHc";
const CHANNEL_ID = "UCL-HTw4Wfi9Igh9r1CBrrDA";
const BASE_URL = "https://www.googleapis.com/youtube/v3";

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
async function getAllVideosFromPlaylist(playlistId: string): Promise<{ title: string; videoId: string }[]> {
    const url = `${BASE_URL}/playlistItems`;
    const params = {
        part: "snippet",
        playlistId,
        maxResults: 50, // Максимум 50 элементов за один запрос
        key: API_KEY,
    };

    let nextPageToken: string | undefined = undefined;
    const videos: { title: string; videoId: string }[] = [];

    try {
        do {
            const response = await axios.get(url, { params: { ...params, pageToken: nextPageToken } });
            const items = response.data.items;
            items.forEach((item: any) => {
                videos.push({
                    title: item.snippet.title,
                    videoId: item.snippet.resourceId.videoId,
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

        console.log("Список видео:");
        videos.forEach((video, index) => {
            console.log(`${index + 1}. ${video.title} (https://www.youtube.com/watch?v=${video.videoId})`);
        });
    } catch (error) {
        console.error("Произошла ошибка:", error.message);
    }
})();
