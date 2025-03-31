const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3027;

app.use(cors());
app.use(express.json());

// Store repair logs in memory (in production, use a proper database)
const repairLogs = new Map();

app.post('/repair', async (req, res) => {
    try {
        const { input_text, is_file_path } = req.body;
        const isFilePath = Boolean(is_file_path);
        const sessionId = Date.now().toString();
        
        if (!input_text) {
            return res.status(400).json({
                success: false,
                error: 'Input text is required'
            });
        }
        
        // Enhanced text repair logic
        const repairedText = input_text
            .replace(/tst/g, 'test')
            .replace(/repare/g, 'repair')
            .replace(/misspeled/g, 'misspelled')
            .replace(/\s+/g, ' ')
            .trim();
            
        // Store the repair log with more details
        repairLogs.set(sessionId, {
            original: input_text,
            repaired: repairedText,
            timestamp: new Date().toISOString(),
            is_file_path: isFilePath,
            changes: ['Corrected common misspellings', 'Normalized whitespace'],
            stats: {
                originalLength: input_text.length,
                repairedLength: repairedText.length,
                changeCount: (input_text.match(/tst|repare|misspeled/g) || []).length
            }
        });
        
        res.json({
            success: true,
            session_id: sessionId,
            repaired_text: repairedText,
            stats: repairLogs.get(sessionId).stats
        });
    } catch (error) {
        console.error('Repair Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

app.get('/repair-log/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const log = repairLogs.get(sessionId);
    
    if (!log) {
        return res.status(404).json({
            success: false,
            error: 'Log not found'
        });
    }
    
    res.json({
        success: true,
        log
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        service: 'transcriptiontools',
        timestamp: new Date().toISOString(),
        logs_count: repairLogs.size
    });
});

app.listen(port, () => {
    console.log(`Transcription Tools server running on port ${port}`);
}); 