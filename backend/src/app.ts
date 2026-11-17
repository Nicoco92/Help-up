import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import missionsRouter from './routes/missions';
import exploreRouter from './routes/explore.routes';
import applicationsRouter from './routes/applications';
import { errorHandler, notFound } from './middlewares/errorHandler';

// Documentation OpenAPI (src/docs/openapi.yaml, copié dans dist/docs au build)
const openapi = YAML.parse(fs.readFileSync(path.join(__dirname, 'docs', 'openapi.yaml'), 'utf8'));

const app = express();

// Sécurité et lecture du corps JSON
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

// Route publique de santé
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Documentation interactive : http://localhost:3000/api/docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));

// Routes métier
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/missions', missionsRouter);
app.use('/api/explore', exploreRouter);
app.use('/api/applications', applicationsRouter);

// Toujours en dernier : route inconnue, puis formatage de toutes les erreurs
app.use(notFound);
app.use(errorHandler);

export default app;
