import { Router } from 'express';
import { generateImage, getChatCompletion } from '@services/openAi';

const openaiRouter = Router();


openaiRouter.post('/chat', async (req, res) => {
  const { prompt } = req.body.messages;
  
  try {
    const promptResponse = await getChatCompletion(prompt);
    
    res.status(200).json({ 
      message: 'OpenAi responded successfully.', 
      response: promptResponse 
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});


openaiRouter.post('/generate-image', async (req, res) => {
  const { imagePrompt, imageQuality } = req.body;
  
  try {
    const imageUrl = await generateImage(imagePrompt, imageQuality);
    
    res.status(200).json({ 
      message: 'Image generated successfully.', 
      url: imageUrl 
    });

  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default openaiRouter;
