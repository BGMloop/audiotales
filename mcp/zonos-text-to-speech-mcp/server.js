const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3026;

app.use(cors());
app.use(express.json());

app.post('/speak', async (req, res) => {
    try {
        const { text, language = 'en-us', emotion = 'neutral' } = req.body;
        
        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Text is required'
            });
        }
        
        // Mock TTS processing
        const mockAudioData = Buffer.from('Mock audio data').toString('base64');
        
        res.json({
            success: true,
            message: 'Text processed successfully',
            audio: mockAudioData,
            metadata: { 
                text, 
                language, 
                emotion,
                format: 'base64',
                duration: '1.5s'
            }
        });
    } catch (error) {
        console.error('TTS Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'zonos-text-to-speech',
        timestamp: new Date().toISOString()
    });
});

app.listen(port, () => {
    console.log(`Zonos Text-to-Speech server running on port ${port}`);
}); 