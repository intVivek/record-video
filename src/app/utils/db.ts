export interface VideoRecord {
    id: string;
    blob: Blob;
    createdAt: number;
}

const DB_NAME = "VideoStore";
const STORE_NAME = "videos";
const DB_VERSION = 1;

export const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("IndexedDB error:", event);
            reject("Error opening database");
        };

        request.onsuccess = (event) => {
            resolve((event.target as IDBOpenDBRequest).result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id" });
            }
        };
    });
};

export const saveVideo = async (blob: Blob): Promise<VideoRecord> => {
    const db = await initDB();
    const id = crypto.randomUUID();
    const video: VideoRecord = {
        id,
        blob,
        createdAt: Date.now(),
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(video);

        request.onsuccess = () => resolve(video);
        request.onerror = () => reject("Error saving video");
    });
};

export const getAllVideos = async (): Promise<VideoRecord[]> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            // Sort by newest first
            const videos = request.result as VideoRecord[];
            resolve(videos.sort((a, b) => b.createdAt - a.createdAt));
        };
        request.onerror = () => reject("Error fetching videos");
    });
};

export const deleteVideo = async (id: string): Promise<void> => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject("Error deleting video");
    });
};
