/**
 * Common API Client for GAS
 */
class VolleyAPI {
  constructor(scriptUrl) {
    this.scriptUrl = scriptUrl;
  }

  async fetchSheet(sheetName) {
    try {
      const response = await fetch(`${this.scriptUrl}?sheet=${sheetName}`);
      return await response.json();
    } catch (err) {
      console.error(`Failed to fetch sheet ${sheetName}:`, err);
      return [];
    }
  }

  async postAction(action, data) {
    try {
      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        mode: 'no-cors', // Common for GAS
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      });
      // Note: 'no-cors' mode results in an opaque response (cannot read body)
      // To get feedback, use redirect or handle errors gracefully on client.
      return { success: true }; 
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
      return { success: false, error: err };
    }
  }
}

// Utility to calculate time difference
function getMinutesSince(isoString) {
  if (!isoString) return Infinity;
  const past = new Date(isoString);
  const now = new Date();
  return (now - past) / (1000 * 60);
}
