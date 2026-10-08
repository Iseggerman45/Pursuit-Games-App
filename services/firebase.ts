
import * as firebaseAppModule from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc, deleteDoc, enableIndexedDbPersistence } from 'firebase/firestore';
import { FirebaseConfig, ExportData, GroupMessage, GameResult, Game, Player } from '../types';

const firebaseApp = firebaseAppModule as any;

let db: any = null;
let unsubMain: any = null;
let unsubMsgs: any = null;
let unsubRes: any = null;
let unsubPlayers: any = null;
let persistenceAttempted = false;

/**
 * Converts both new structured games and older games into one reliable shape.
 * Older games stored their manual inside "rules"; those games are upgraded in memory
 * without deleting the original rules field, so existing libraries remain compatible.
 */
const extractRuleSections = (rules: string = '') => {
    const result = { setup: '', gameplay: '', howToWin: '' };
    const matches = rules.split(/##\s*(Setup|Gameplay|How to Win)\s*/i);
    for (let i = 1; i < matches.length; i += 2) {
        const key = matches[i].toLowerCase();
        const value = (matches[i + 1] || '').trim();
        if (key === 'setup') result.setup = value;
        if (key === 'gameplay') result.gameplay = value;
        if (key === 'how to win') result.howToWin = value;
    }
    if (!result.gameplay && rules && !/##\s*(Setup|Gameplay|How to Win)/i.test(rules)) {
        result.gameplay = rules.trim();
    }
    return result;
};

export const normalizeGame = (raw: any): Game => {
    const game = raw || {};
    const legacy = extractRuleSections(typeof game.rules === 'string' ? game.rules : '');
    const setup = typeof game.setup === 'string' && game.setup.trim() ? game.setup.trim() : legacy.setup;
    const gameplay = typeof game.gameplay === 'string' && game.gameplay.trim() ? game.gameplay.trim() : legacy.gameplay;
    const howToWin = typeof game.howToWin === 'string' && game.howToWin.trim() ? game.howToWin.trim() : legacy.howToWin;
    const rules = typeof game.rules === 'string' && game.rules.trim()
        ? game.rules
        : `## Setup\n${setup}\n\n## Gameplay\n${gameplay}\n\n## How to Win\n${howToWin}`.trim();

    return {
        ...game,
        setup,
        gameplay,
        howToWin,
        rules,
        materials: typeof game.materials === 'string' ? game.materials : '',
        tags: Array.isArray(game.tags) ? game.tags : [],
        targetGroups: Array.isArray(game.targetGroups) ? game.targetGroups : [],
        rating: typeof game.rating === 'number' ? game.rating : 0,
        ratingCount: typeof game.ratingCount === 'number' ? game.ratingCount : 0,
    } as Game;
};


/**
 * Deeply cleans objects to ensure they are serializable and free of circular references.
 * Essential for preventing "Converting circular structure to JSON" crashes when
 * internal library objects (Firebase/React) leak into state.
 */
export const cleanData = (data: any): any => {
    const seen = new WeakSet();
    
    const sanitize = (obj: any, depth: number = 0): any => {
        if (depth > 12) return null; // Prevent runaway recursion
        if (obj === null || typeof obj !== 'object') return obj;
        
        // Handle circular references
        if (seen.has(obj)) return "[Circular]";
        
        // Strip common non-serializable objects
        if (
            obj.$$typeof || // React elements
            obj._owner || // React internals
            obj.nodeType || // DOM elements
            obj.window === obj || // Window object
            obj.constructor?.name?.startsWith('Q$') || // Firebase internals
            obj.constructor?.name === 'Sa' // Firebase internals
        ) {
            return null;
        }

        seen.add(obj);

        if (Array.isArray(obj)) {
            return obj.map(v => sanitize(v, depth + 1)).filter(v => v !== undefined);
        }

        // Handle Date objects
        if (obj instanceof Date) return obj.getTime();

        const newObj: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                // Skip internal-only keys
                if (key.startsWith('_') && key !== '_id') continue;
                
                const val = sanitize(obj[key], depth + 1);
                if (val !== undefined) {
                    newObj[key] = val;
                }
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
    onResults: (results: GameResult[]) => void,
    onPlayers: (players: Player[]) => void
) => {
    if (!db) return;
    if (unsubMain) unsubMain();
    if (unsubMsgs) unsubMsgs();
    if (unsubRes) unsubRes();
    if (unsubPlayers) unsubPlayers();

    const pathId = libraryId.trim().toLowerCase();

    unsubMain = onSnapshot(doc(db, 'pursuit_data', pathId), (snap: any) => {
        if (snap.exists() && !snap.metadata.hasPendingWrites) {
            const raw = snap.data();
            onData({
                games: (raw.games || []).map(normalizeGame),
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

    unsubPlayers = onSnapshot(doc(db, 'pursuit_players', pathId), (snap: any) => {
        if (snap.exists() && !snap.metadata.hasPendingWrites) {
            onPlayers(snap.data().players || []);
        }
    });

    return () => {
        if (unsubMain) unsubMain();
        if (unsubMsgs) unsubMsgs();
        if (unsubRes) unsubRes();
        if (unsubPlayers) unsubPlayers();
    };
};

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

    const gamesWithoutDiagrams = (data.games || []).map(game => {
        const normalized = normalizeGame(game);
        const { diagramUrl, ...rest } = normalized;
        return {
            ...rest,
            // Keep the old combined rules field populated so older app versions can still read the library.
            rules: normalized.rules,
            setup: normalized.setup || '',
            gameplay: normalized.gameplay || '',
            howToWin: normalized.howToWin || '',
            hasDiagram: !!diagramUrl || !!normalized.hasDiagram
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
            }),
            setDoc(doc(db, 'pursuit_players', pathId), { 
                players: sanitizedData.players || [],
                timestamp: Date.now() 
            })
        ]);
    } catch (e: any) {
        console.error("Save failed:", e);
        throw e;
    }
};
