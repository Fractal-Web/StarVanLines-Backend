import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

let usCitiesCache = null;

const loadUSCities = async () => {
    if (usCitiesCache) return usCitiesCache;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filePath = path.join(__dirname, '..', 'data', 'USCities.json');

    const fileContent = await fs.readFile(filePath, 'utf-8');
    usCitiesCache = JSON.parse(fileContent);
    return usCitiesCache;
};

router.get('/search', async (req, res, next) => {
    try {
        const q = (req.query.q || '').toString().trim().toLowerCase();
        if (!q) return res.json([]);

        const USCities = await loadUSCities();

        const filteredData = USCities.filter((item) => {
            const city = item.city?.toLowerCase?.();
            const state = item.state?.toLowerCase?.();
            const county = item.county?.toLowerCase?.();
            const zip = item.zip_code?.toString?.();
            const lat = item.latitude?.toString?.();
            const lng = item.longitude?.toString?.();

            return (
                (city && city.includes(q)) ||
                (state && state.includes(q)) ||
                (county && county.includes(q)) ||
                (zip && zip === q) ||
                (lat && lat === q) ||
                (lng && lng === q)
            );
        });

        res.json(filteredData.slice(0, 10));
    } catch (err) {
        next(err);
    }
});

router.get('/by-coords', async (req, res, next) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        const tolerance = req.query.tolerance ? parseFloat(req.query.tolerance) : 0.1;

        if (Number.isNaN(lat) || Number.isNaN(lng)) {
            return res.status(400).json({ error: 'lat and lng are required and must be numbers' });
        }

        const USCities = await loadUSCities();

        const filteredData = USCities.filter((item) => {
            const latDiff = Math.abs(item.latitude - lat);
            const lngDiff = Math.abs(item.longitude - lng);
            return latDiff <= tolerance && lngDiff <= tolerance;
        });

        res.json(filteredData);
    } catch (err) {
        next(err);
    }
});

export default router;
