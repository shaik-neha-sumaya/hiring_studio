import { Router } from 'express';
import multer from 'multer';
import { asyncRoute, badRequest, notFound } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { extractText, supportedExtensions } from '../rag/ingest.js';
import { addDocument, knowledgeStats, listUploadedDocuments, removeDocument } from '../rag/knowledgeBase.js';

const router = Router();
router.use(requireAuth);

const CATEGORIES = ['technical', 'competency', 'behavioral', 'evaluation', 'methodology', 'process', 'general'];
const MIN_USEFUL_CHARS = 200;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

const readCategory = (value) => (CATEGORIES.includes(value) ? value : 'general');

const readRoles = (value) =>
  String(value ?? '')
    .split(',')
    .map((role) => role.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean)
    .slice(0, 6);

router.get(
  '/',
  asyncRoute(async (_req, res) => {
    res.json({ stats: knowledgeStats(), documents: await listUploadedDocuments() });
  }),
);

router.post(
  '/upload',
  upload.single('file'),
  asyncRoute(async (req, res) => {
    if (!req.file) throw badRequest(`Attach a file (${supportedExtensions.join(', ')}).`);

    const text = await extractText(req.file.buffer, req.file.originalname);
    if (text.length < MIN_USEFUL_CHARS) {
      throw badRequest('That file produced almost no text — it may be a scanned image rather than a text document.');
    }

    const result = await addDocument({
      source: req.file.originalname,
      title: String(req.body.title ?? '').trim() || req.file.originalname,
      category: readCategory(req.body.category),
      roles: readRoles(req.body.roles),
      text,
      ownerId: req.user.id,
    });

    res.status(201).json({ ...result, stats: knowledgeStats() });
  }),
);

router.post(
  '/text',
  asyncRoute(async (req, res) => {
    const text = String(req.body.text ?? '').trim();
    const title = String(req.body.title ?? '').trim();

    if (!title) throw badRequest('Give the note a title.');
    if (text.length < MIN_USEFUL_CHARS) {
      throw badRequest(`Paste at least ${MIN_USEFUL_CHARS} characters so the note is worth retrieving.`);
    }

    const result = await addDocument({
      source: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}.md`,
      title,
      category: readCategory(req.body.category),
      roles: readRoles(req.body.roles),
      text,
      ownerId: req.user.id,
    });

    res.status(201).json({ ...result, stats: knowledgeStats() });
  }),
);

router.delete(
  '/:id',
  asyncRoute(async (req, res) => {
    if (!(await removeDocument(req.params.id))) throw notFound('That document could not be found.');
    res.json({ deleted: true, stats: knowledgeStats() });
  }),
);

export default router;
