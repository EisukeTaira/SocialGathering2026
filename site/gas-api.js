/**
 * GAS API Communication Wrapper
 */

// NOTE: Replace with your actual GAS Web App URL after deployment
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxIPOAT9PH96GssZTJrcHTe6rudJe531hfmMccHHjPXATSlxcjDrvYKiO1jbCufzEv-iA/exec';

/**
 * Fetch match data from GAS (specific sheet)
 */
async function fetchMatches(sheetName = 'Matches') {
    try {
        const url = `${GAS_URL}?sheet=${sheetName}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Fetch failed');
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${sheetName}:`, error);
        return null;
    }
}

/**
 * Update data via GAS (any sheet)
 */
async function updateData(sheetName, id, updates) {
    try {
        const payload = {
            sheet: sheetName,
            ...(sheetName === 'Matches' ? { courtNumber: id } : { id: id }),
            ...updates
        };

        const response = await fetch(GAS_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        return true;
    } catch (error) {
        console.error(`Error updating ${sheetName}:`, error);
        return false;
    }
}

// 互換性維持のためのエイリアス
async function updateMatch(courtNumber, data) {
    return updateData('Matches', courtNumber, data);
}

// Export functions if using modules, or just keep them global for simple Script tags
if (typeof module !== 'undefined') {
    module.exports = { fetchMatches, updateMatch };
}
