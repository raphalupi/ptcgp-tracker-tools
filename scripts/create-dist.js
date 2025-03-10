import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a write stream for the zip file in the project root
const output = fs.createWriteStream(path.join(__dirname, '../ptcgp-tracker-tools.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

// Listen for all archive data to be written
output.on('close', () => {
  console.log(`Archive created successfully: ${archive.pointer()} bytes`);
});

// Handle errors
archive.on('error', (err) => {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add manifest.json
archive.file(path.join(__dirname, '../manifest.json'), { name: 'manifest.json' });

// Add the dist directory contents
archive.directory(path.join(__dirname, '../dist/'), 'dist');

// Add README.md
archive.file(path.join(__dirname, '../README.md'), { name: 'README.md' });

// Finalize the archive
archive.finalize(); 