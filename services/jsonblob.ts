
import { cleanData } from './firebase';

const API_URL = 'https://jsonblob.com/api/jsonBlob';

export const createBlob = async (data: any): Promise<string> => {
    try {
        const clean = cleanData(data);
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(clean)
        });

        if (!response.ok) throw new Error('Failed to create sync channel');
        
        const location = response.headers.get('Location');
        if (!location) throw new Error('No location header returned');
        
        const id = location.split('/').pop();
        return id || '';
    } catch (e) {
        console.error("Sync Error:", e);
        throw e;
    }
};

export const updateBlob = async (id: string, data: any): Promise<boolean> => {
    try {
        const clean = cleanData(data);
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(clean)
        });

        return response.ok;
    } catch (e) {
        console.error("Sync Update Error:", e);
        return false;
    }
};

export const getBlob = async (id: string): Promise<any | null> => {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) return null;
        return await response.json();
    } catch (e) {
        console.error("Sync Fetch Error:", e);
        return null;
    }
};
