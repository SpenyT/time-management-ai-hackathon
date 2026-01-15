import { Router, Request, Response } from 'express';
import db from '@database/pgDb';

const router = Router();

// --- GET (Read One) ---
// GET /api/books/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    const query = 'SELECT id, title, author_id FROM books WHERE id = $1';
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: `Book with ID ${id} not found.` });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(`Error fetching book ${id}:`, error);
    res.status(500).json({ message: 'Database error.' });
  }
});

// --- POST (Create) ---
// POST /api/books
router.post('/', async (req: Request, res: Response) => {
  const { title, author_id, isbn } = req.body;
  
  try {
    const query = 'INSERT INTO books (title, author_id, isbn) VALUES ($1, $2, $3) RETURNING id, title';
    const values = [title, author_id, isbn];
    const result = await db.query(query, values);

    res.status(201).json({
      message: 'Book created successfully.',
      book: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ message: 'Database error.' });
  }
});

export default router;