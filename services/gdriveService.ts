const API_BASE_URL = '/api';

/**
 * Saves a file by sending it to the secure backend.
 * @param fileName The desired name of the file.
 * @param content The text content of the file.
 * @returns A promise that resolves to the URL of the created file from the backend.
 */
export const saveFile = async (fileName: string, content: string): Promise<string> => {
    try {
        const response = await fetch(`${API_BASE_URL}/gdrive/save-file`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName, content }),
        });
        if (!response.ok) {
            throw new Error('Backend failed to save file.');
        }
        const { url } = await response.json();
        return url;
    } catch (error) {
        console.error("Failed to save file via backend:", error);
        return ''; // Return an empty string or handle the error as appropriate
    }
};
