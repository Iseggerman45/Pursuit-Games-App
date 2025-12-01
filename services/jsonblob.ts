
const BASE_URL = 'https://jsonblob.com/api/jsonBlob';

export const createBlob = async (data: any): Promise<string> => {
    const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error('Failed to create sync storage');
    }

    // The API returns the location of the new blob in the headers
    const location = response.headers.get('Location');
    if (!location) {
        throw new Error('No location header received');
    }

    // Extract UUID from the URL (e.g., https://jsonblob.com/api/jsonBlob/123 -> 123)
    const uuid = location.split('/').pop();
    if (!uuid) throw new Error('Invalid ID received');
    
    return uuid;
};

export const updateBlob = async (id: string, data: any) => {
    const response = await fetch(`${BASE_URL}/${id}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json', 
            'Accept': 'application/json' 
        },
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        throw new Error('Failed to update sync storage');
    }
};

export const getBlob = async (id: string) => {
    const response = await fetch(`${BASE_URL}/${id}`, {
        headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch sync storage');
    }

    return await response.json();
};
