import express, { Request, Response, Router } from 'express';
import multer from 'multer';
import OpenAI from 'openai';

import type { Task, TimeBlock, ScheduleResponse } from 'types/taskTypes';

import 'dotenv/config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const DEFAULT_MODEL = 'gpt-4o-mini-2024-07-18';

const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});


const tasksRouter = Router();

// POST /api/tasks/extract - Extract tasks from speech/text
tasksRouter.post('/extract', async (req: Request, res: Response) => {
  try {
    const { text, userContext } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text input is required' });
    }

    const prompt = `You are a task extraction AI. Analyze the following user input and extract all tasks mentioned. For each task, determine:
                        - Title (concise)
                        - Description (detailed)
                        - Estimated duration in minutes
                        - Priority (high/medium/low) based on urgency indicators
                        - Deadline (if mentioned, in ISO format)
                        - Subject/category (work, school, errands, etc.)

                        User context: ${userContext || 'None provided'}

                        User input: "${text}"

                        Return a JSON array of tasks with this exact structure:
                        [{
                        "title": "string",
                        "description": "string",
                        "estimatedDuration": number,
                        "priority": "high" | "medium" | "low",
                        "deadline": "ISO string or null",
                        "subject": "string"
                        }]

                        Only return the JSON array, no other text.`;

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0].message.content;
    let tasks = JSON.parse(content || '{"tasks": []}');
    
    // Handle if response is wrapped in an object
    if (tasks.tasks) tasks = tasks.tasks;
    
    // Add unique IDs
    const tasksWithIds = tasks.map((task: any, idx: number) => ({
      id: `task_${Date.now()}_${idx}`,
      ...task
    }));

    res.json({
      tasks: tasksWithIds,
      extractedCount: tasksWithIds.length
    });

  } catch (error: any) {
    console.error('Task extraction error:', error);
    res.status(500).json({ 
      error: 'Failed to extract tasks',
      details: error.message 
    });
  }
});


// POST /api/tasks/analyze-files - Analyze course files for difficulty
tasksRouter.post('/analyze-files', 
  upload.array('files', 5), 
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      const { tasks } = req.body;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const parsedTasks = typeof tasks === 'string' ? JSON.parse(tasks) : tasks;

      // Analyze each file
      const fileAnalyses = await Promise.all(
        files.map(async (file) => {
          const fileContent = file.buffer.toString('utf-8').slice(0, 4000); // Limit content

          const prompt = `Analyze this course material and determine:
1. Subject area
2. Difficulty level (easy/medium/hard)
3. Key topics covered
4. Estimated time needed to understand this material

File name: ${file.originalname}
Content preview:
${fileContent}

Return JSON:
{
  "subject": "string",
  "difficulty": "easy" | "medium" | "hard",
  "topics": ["string"],
  "estimatedStudyTime": number (minutes)
}`;

          const completion = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            response_format: { type: 'json_object' }
          });

          return {
            fileName: file.originalname,
            analysis: JSON.parse(completion.choices[0].message.content || '{}')
          };
        })
      );

      // Update tasks with file analysis
      const updatedTasks = parsedTasks.map((task: Task) => {
        const relatedFile = fileAnalyses.find(f => 
          task.subject && f.analysis.subject?.toLowerCase().includes(task.subject.toLowerCase())
        );

        if (relatedFile) {
          return {
            ...task,
            difficulty: relatedFile.analysis.difficulty,
            estimatedDuration: Math.max(task.estimatedDuration, relatedFile.analysis.estimatedStudyTime || 0)
          };
        }
        return task;
      });

      res.json({
        tasks: updatedTasks,
        fileAnalyses
      });

    } catch (error: any) {
      console.error('File analysis error:', error);
      res.status(500).json({ 
        error: 'Failed to analyze files',
        details: error.message 
      });
    }
});

export default tasksRouter;