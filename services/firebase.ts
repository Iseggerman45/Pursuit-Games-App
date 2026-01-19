
import * as firebaseAppModule from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc, deleteDoc, enableIndexedDbPersistence } from 'firebase/firestore';
import { FirebaseConfig, ExportData, GroupMessage, GameResult, Game } from '../types';

const firebaseApp = firebaseAppModule as any;

let db: any = null;
let unsubMain: any = null;
let unsubMsgs: any = null;
let unsubRes: any = null;
let persistenceAttempted = false;

export const cleanData = (data: any): any => {
    const seen = new WeakSet();
    const sanitize = (obj: any, depth: number = 0): any => {
        if (depth > 15) return null;
        if (obj === null || typeof obj !== 'object') return obj;
        if (seen.has(obj)) return "[Circular]";
        if (obj.$$typeof || obj._owner || obj.nodeType || obj.window === obj) return null;
        
        seen.add(obj);

        if (Array.isArray(obj)) {
            return obj.map(v => sanitize(v, depth + 1));
        }

        const newObj: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                if (key.startsWith('_') && key !== '_id') continue; 
                newObj[key] = sanitize(obj[key], depth + 1);
            }
        }
        return newObj;
    };
    return sanitize(data);
};

export const initFirebase = (config: FirebaseConfig): void => {
    try {
        if (!config || !config.apiKey) return;
        let app = firebaseApp.getApps().length === 0 ? firebaseApp.initializeApp(config) : firebaseApp.getApp();
        if (!db) {
            db = getFirestore(app);
        }
        if (db && !persistenceAttempted) {
            persistenceAttempted = true;
            enableIndexedDbPersistence(db).catch((err) => {
                console.warn("Firestore persistence warning:", err.code);
            });
        }
    } catch (e) {
        console.error("Firebase Init Failed", e);
    }
};

export const subscribeToLibrary = (
    libraryId: string, 
    onData: (data: Partial<ExportData>) => void,
    onMessages: (msgs: GroupMessage[]) => void,
    onResults: (results: GameResult[]) => void
) => {
    if (!db) return;
    if (unsubMain) unsubMain();
    if (unsubMsgs) unsubMsgs();
    if (unsubRes) unsubRes();

    const pathId = libraryId.trim().toLowerCase();

    unsubMain = onSnapshot(doc(db, 'pursuit_data', pathId), (snap: any) => {
        if (snap.exists() && !snap.metadata.hasPendingWrites) {
            const raw = snap.data();
            onData({
                games: raw.games || [],
                folders: raw.folders || [],
                tags: raw.tags || []
            });
        }
    });

    unsubMsgs = onSnapshot(doc(db, 'pursuit_messages', pathId), (snap: any) => {
        if (snap.exists() && !snap.metadata.hasPendingWrites) {
            onMessages(snap.data().messages || []);
        }
    });

    unsubRes = onSnapshot(doc(db, 'pursuit_results', pathId), (snap: any) => {
        if (snap.exists() && !snap.metadata.hasPendingWrites) {
            onResults(snap.data().results || []);
        }
    });

    return () => {
        if (unsubMain) unsubMain();
        if (unsubMsgs) unsubMsgs();
        if (unsubRes) unsubRes();
    };
};

/**
 * Saves large diagram assets separately to avoid 1MB document limits.
 */
export const saveGameDiagram = async (libraryId: string, gameId: string, diagramUrl: string): Promise<void> => {
    if (!db) return;
    const pathId = libraryId.trim().toLowerCase();
    const assetId = `${pathId}_${gameId}`;
    try {
        await setDoc(doc(db, 'pursuit_assets', assetId), {
            gameId,
            libraryId: pathId,
            diagramUrl,
            timestamp: Date.now()
        });
    } catch (e) {
        console.error("Diagram save failed:", e);
    }
};

/**
 * Fetches diagram asset on demand.
 */
export const fetchGameDiagram = async (libraryId: string, gameId: string): Promise<string | null> => {
    if (!db) return null;
    const pathId = libraryId.trim().toLowerCase();
    const assetId = `${pathId}_${gameId}`;
    try {
        const snap = await getDoc(doc(db, 'pursuit_assets', assetId));
        if (snap.exists()) {
            return snap.data().diagramUrl || null;
        }
    } catch (e) {
        console.error("Diagram fetch failed:", e);
    }
    return null;
};

/**
 * Deletes associated diagram assets.
 */
export const deleteGameAssets = async (libraryId: string, gameId: string): Promise<void> => {
    if (!db) return;
    const pathId = libraryId.trim().toLowerCase();
    const assetId = `${pathId}_${gameId}`;
    try {
        await deleteDoc(doc(db, 'pursuit_assets', assetId));
    } catch (e) {
        console.error("Asset deletion failed:", e);
    }
};

export const saveToFirebase = async (data: ExportData, config?: FirebaseConfig, libraryId: string = 'pursuit_global'): Promise<void> => {
    if (!db && config) initFirebase(config);
    if (!db) throw new Error("Database not initialized");
    
    const pathId = libraryId.trim().toLowerCase();

    // STRIP DIAGRAMS from main document to save space
    // We update the 'hasDiagram' flag so the UI knows there is an asset to fetch
    const gamesWithoutDiagrams = (data.games || []).map(game => {
        const { diagramUrl, ...rest } = game;
        return {
            ...rest,
            hasDiagram: !!diagramUrl || !!game.hasDiagram
        };
    });

    const sanitizedData = cleanData({
        ...data,
        games: gamesWithoutDiagrams
    });

    try {
        await Promise.all([
            setDoc(doc(db, 'pursuit_data', pathId), {
                games: sanitizedData.games || [],
                folders: sanitizedData.folders || [],
                tags: sanitizedData.tags || [],
                timestamp: Date.now()
            }),
            setDoc(doc(db, 'pursuit_messages', pathId), { 
                messages: sanitizedData.messages || [],
                timestamp: Date.now() 
            }),
            setDoc(doc(db, 'pursuit_results', pathId), { 
                results: sanitizedData.results || [],
                timestamp: Date.now() 
            })
        ]);
    } catch (e: any) {
        console.error("Save failed:", e);
        throw e;
    }
};
