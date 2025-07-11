const express = require('express');
const multer = require('multer');
const path = require('path');
const { clearTempUploads } = require('./utils/clearTempUploads');
const {
  generateThumbnail,
  generateVideoSegments,
} = require('./utils/ffmpeg-utils');
const fs = require('fs-extra');

const app = express();

const upload = multer({ dest: 'temp-uploads/' });

app.use(express.static('public'));
app.use('/videos', express.static(path.join(__dirname, 'public', 'videos')));
app.use(express.json());

// Clear temp-uploads directory on server startup for half finished upload.
clearTempUploads();

app.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ message: 'No file selected. Please select a file to upload.' });
  }

  let { title, date, info } = req.body;
  const filePath = req.file.path;

  console.log(title);

  if (!date) date = '';
  if (!title) title = path.parse(req.file.originalname).name;
  if (!info) info = '';

  const outputDir = path.join(__dirname, 'public', 'videos', title);
  await fs.ensureDir(outputDir);

  try {
    await generateThumbnail(filePath, outputDir);
    await generateVideoSegments(filePath, outputDir, title, res);
  } catch (error) {
    res.status(500).json({ message: 'Error processing video.' });
  }
});

app.get('/data', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'data.json'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
