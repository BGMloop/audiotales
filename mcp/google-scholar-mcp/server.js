const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const port = process.env.PORT || 3028;

app.use(cors());
app.use(express.json());

// Cache for author data (in production, use Redis or similar)
const authorCache = new Map();

app.get('/author/:name', async (req, res) => {
    try {
        const { name } = req.params;
        
        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Author name is required'
            });
        }

        // Check cache first
        if (authorCache.has(name)) {
            console.log(`Returning cached data for ${name}`);
            return res.json({
                success: true,
                data: authorCache.get(name),
                source: 'cache'
            });
        }
        
        // Generate realistic mock data
        const mockAuthorData = {
            name: name,
            affiliation: 'Example University',
            citations: Math.floor(Math.random() * 50000) + 1000,
            h_index: Math.floor(Math.random() * 100) + 20,
            i10_index: Math.floor(Math.random() * 200) + 30,
            research_interests: [
                'Artificial Intelligence',
                'Machine Learning',
                'Neural Networks',
                'Deep Learning'
            ],
            publications: [
                {
                    title: `Advanced Research in ${name}'s Field`,
                    year: 2024,
                    citations: Math.floor(Math.random() * 1000) + 100,
                    authors: ['Author 1', name, 'Author 3'],
                    journal: 'Nature AI'
                },
                {
                    title: 'Novel Approaches to Machine Learning',
                    year: 2023,
                    citations: Math.floor(Math.random() * 500) + 50,
                    authors: [name, 'Author 2'],
                    journal: 'Science Robotics'
                }
            ],
            metrics: {
                citations_per_year: {
                    '2024': Math.floor(Math.random() * 1000),
                    '2023': Math.floor(Math.random() * 2000),
                    '2022': Math.floor(Math.random() * 1500)
                },
                top_venues: [
                    'Nature',
                    'Science',
                    'ICML',
                    'NeurIPS'
                ]
            }
        };
        
        // Store in cache
        authorCache.set(name, mockAuthorData);
        
        res.json({
            success: true,
            data: mockAuthorData,
            source: 'fresh'
        });
    } catch (error) {
        console.error('Scholar Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'google-scholar',
        timestamp: new Date().toISOString(),
        cache_size: authorCache.size
    });
});

// Clear cache periodically (every hour)
setInterval(() => {
    console.log('Clearing author cache');
    authorCache.clear();
}, 3600000);

app.listen(port, () => {
    console.log(`Google Scholar server running on port ${port}`);
}); 