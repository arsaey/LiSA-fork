import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import server from 'src/utils/axios';

export type TDownload = {
    title: string;
    type: 'anime' | 'manga';
    episodes: TDownloadAnimeEpisode[];
    chapters: TDownloadMangaChapter[];
};

type TDownloadBase = {
    id: number;
    series_name: string;
    file_name: string;
    status: 'downloaded' | 'paused' | 'started' | 'scheduled';
    created_on: string;
    total_size: number;
    downloaded: number;
    speed: number;
};

export type TDownloadAnimeEpisode = TDownloadBase & {
    type: 'video';
    file_location: string;
};

export type TDownloadMangaChapter = TDownloadBase & {
    type: 'image';
    file_location: string | string[];
};

export type TDownloadItem = TDownloadAnimeEpisode | TDownloadMangaChapter;

export type TSocketEventDownloading = {
    data: TDownloadItem;
    type: 'downloads';
};

async function getDownloads(url: string): Promise<TDownload[]> {
    const { data } = await server.get(url);
    return data;
}

export const RQKEY_GET_DOWNLOADS_HISTORY = 'download-history';
export const RQKEY_GET_DOWNLOADS_ACTIVE = 'downloads-active';

export function useGetActiveDownloads() {
    return useQuery({
        queryKey: [RQKEY_GET_DOWNLOADS_ACTIVE],
        queryFn: () => getDownloads('/library?status=downloading'),
        initialData: [],
        placeholderData: [],
    });
}

export function useGetDownloadsHistory() {
    return useQuery({
        queryKey: [RQKEY_GET_DOWNLOADS_HISTORY],
        queryFn: () => getDownloads('/library?status=downloaded'),
        initialData: [],
        placeholderData: [],
    });
}

export function useDownloadingActions(id: TDownloadItem['id'][]) {
    // Get QueryClient from the context
    const queryClient = useQueryClient();

    const cancelDownload = useCallback(async () => {
        try {
            const res = await server.post(
                `/download/cancel`,
                {
                    id,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );

            if (res.status === 200) {
            }
        } catch (error) {
            console.log(error);
        } finally {
            queryClient.invalidateQueries({
                queryKey: [RQKEY_GET_DOWNLOADS_ACTIVE],
            });
        }
    }, [queryClient, id]);

    const pauseDownload = useCallback(async () => {
        try {
            const res = await server.post(
                `/download/pause`,
                {
                    id,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );

            if (res.status === 200) {
                queryClient.invalidateQueries({
                    queryKey: [RQKEY_GET_DOWNLOADS_ACTIVE],
                });
                return true;
            }
        } catch (error) {
            console.log(error);
        }
    }, [queryClient, id]);

    const resumeDownload = useCallback(async () => {
        try {
            const res = await server.post(
                `/download/resume`,
                {
                    id,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );

            if (res.status === 200) {
                queryClient.invalidateQueries({
                    queryKey: [RQKEY_GET_DOWNLOADS_ACTIVE],
                });
                return true;
            }
        } catch (error) {
            console.log(error);
        }
    }, [queryClient, id]);

    return { cancelDownload, pauseDownload, resumeDownload };
}
