import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';

import { config } from './config.js';
import sendRoutes from './routes/send.routes.js';
import movegisticsRoutes from './routes/movegistics.routes.js';
import granotRoutes from './routes/granot.routes.js';
import checklistRoutes from './routes/checklist.routes.js';
import usCitiesRoutes from './routes/usCities.routes.js';
import { initTemplates } from './templates/templateCache.js';

const app = express();

app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (config.cors.allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  methods: ['POST', 'GET', 'OPTIONS', 'DELETE', 'PATCH', 'PUT']
};
app.use(cors(corsOptions));

app.use('/send', sendRoutes);
app.use('/Movegistics', movegisticsRoutes);
app.use('/Granot', granotRoutes);
app.use('/Checklist', checklistRoutes);
app.use('/us-cities', usCitiesRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

app.use((err, _req, res, _next) => {
  res.status(500).json({ error: err?.message || 'Internal Server Error' });
});

try {
  console.log('Initializing templates...');
  await initTemplates();
  console.log('Templates initialized successfully');
} catch (error) {
  console.error('Error initializing templates:', error);
  process.exit(1);
}

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});


