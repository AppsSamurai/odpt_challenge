export const API_KEY = "ujilulffygft5w68uup7i615deajov6yzsfji8pv0xufcinhedfg8avqzzc4yam6";
export const ODPT_URL = "https://api.odpt.org/api/v4";

export const INITIAL_HUBS = [
    { id: 'odpt.Station:JR-East.HokurikuShinkansen.Tokyo', name: 'Tokyo Station', lines: ['Hokuriku Shinkansen'] },
    { id: 'odpt.Station:JR-East.Chuo.Shinjuku', name: 'Shinjuku Station', lines: ['Chuo Line'] },
    { id: 'odpt.Station:JR-East.Takasaki.Ueno', name: 'Ueno Station', lines: ['Takasaki Line'] }
];

export const HUB_MAPPING = {
    'tamamura': 'Kuragano',
    'annaka': 'Annaka',
    'hakuba': 'Hakuba',
    'hakuba2': 'Hakuba',
    'hirakawa': 'Hirosaki',
    'kawagoe': 'Kawagoe',
    'kinokawa': 'Kinokawa',
    'sakai': 'Sakai-higashi',
    'showa': 'Numata',
    'tomioka': 'Joshu-Tomioka'
};

export const parseCSV = (text) => {
    if (!text) return [];
    const cleanText = text.replace(/^\ufeff/, '');
    const lines = cleanText.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const splitCSV = (line) => {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
                result.push(cur.trim());
                cur = '';
            } else cur += char;
        }
        result.push(cur.trim());
        return result;
    };

    const headers = splitCSV(lines[0]);
    return lines.slice(1).map(line => {
        const values = splitCSV(line);
        return headers.reduce((obj, header, i) => {
            if (header) {
                let val = values[i] || "";
                if (val.startsWith('"') && val.endsWith('"')) val = val.substring(1, val.length - 1);
                obj[header] = val;
            }
            return obj;
        }, {});
    });
};

export const addMins = (date, mins) => new Date(date.getTime() + mins * 60000);
export const formatTime = (date) => date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
