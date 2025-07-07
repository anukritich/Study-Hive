import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

router.get('/', async (req, res) => {
  const query = req.query.q;
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: query,
        key: apiKey,
        maxResults: 5,
        type: 'video',
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error('YouTube API error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

export default router;
