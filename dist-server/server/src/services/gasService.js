/**
 * Google Apps Script Integration Service
 * Communicates with Google Apps Script Web App Endpoint exposing Google Sheets as a Database.
 */
export class GASService {
    static getUrl() {
        return process.env.GOOGLE_APPS_SCRIPT_URL || '';
    }
    static isConfigured() {
        const url = this.getUrl();
        return !!url && url.startsWith('https://script.google.com');
    }
    static async querySheet(action, payload = {}) {
        const url = this.getUrl();
        if (!this.isConfigured()) {
            // Local fallback log
            console.log(`[GAS Bridge - Local Fallback] Executing action: ${action}`);
            return { success: true, mode: 'local' };
        }
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload }),
            });
            const text = await response.text();
            try {
                return JSON.parse(text);
            }
            catch (jsonError) {
                console.error(`[GAS Bridge Error] Failed to parse JSON from Google Apps Script response for ${action}:`);
                console.error(`Status: ${response.status} ${response.statusText}`);
                console.error(`Response Preview: ${text.substring(0, 1000)}`);
                return {
                    success: false,
                    error: 'Invalid JSON response from Google Apps Script',
                    status: response.status,
                    responsePreview: text.substring(0, 200)
                };
            }
        }
        catch (error) {
            console.error(`[GAS Bridge Error] Failed to execute ${action} on Google Apps Script:`, error);
            return { success: false, error: String(error) };
        }
    }
}
