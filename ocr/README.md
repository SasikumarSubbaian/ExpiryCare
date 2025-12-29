# OCR Worker

Dedicated OCR worker script that runs outside Next.js as a standalone Node.js process.

## Usage

```bash
# Basic usage (outputs raw text)
node ocr/worker.js <image_path>

# JSON mode (outputs text and confidence)
node ocr/worker.js <image_path> --json

# Example
node ocr/worker.js ./uploads/document.png

# Test mode (recommended for debugging)
node ocr/test.js <image_path>
# or
npm run ocr:test <image_path>

# Example test
node ocr/test.js ./test-images/Test_small.png

# Capture output
node ocr/worker.js ./uploads/document.png > ocr_output.txt

# Pipe to another command
node ocr/worker.js ./uploads/document.png | grep "expiry"
```

## Features

- **Standalone Process**: Runs outside Next.js, independent of web server
- **Speed Optimized**: Uses speed-optimized Tesseract settings
- **Hard Timeout**: 8-second timeout prevents hanging
- **Clean Output**: Raw OCR text to stdout, logs to stderr
- **Error Handling**: Safe error handling with clean process exit
- **Worker Lifecycle**: Proper worker creation, use, and termination

## Output

- **stdout**: Raw OCR text (can be piped or captured)
- **stderr**: Progress logs and error messages
- **Exit Code**: 0 (success), 1 (error)

## Example

```bash
$ node ocr/worker.js test-image.png
[OCR Worker] Starting OCR for: test-image.png
[OCR Worker] Worker created successfully
[OCR Worker] Parameters set (speed-optimized)
[OCR Worker] Progress: 45%
[OCR Worker] Progress: 100%
[OCR Worker] Worker terminated after successful OCR
[OCR Worker] OCR completed - Text length: 123 chars
EXPIRY DATE: 31/12/2026
BATCH NO: ABC123
```

## Error Handling

The script handles:
- Missing image file
- Invalid file paths
- OCR timeouts (8 seconds)
- Worker termination errors
- Process signals (SIGINT, SIGTERM)
- Uncaught exceptions

## Integration

This worker can be used by:
- Background job processors
- Queue systems (Bull, BullMQ)
- Cron jobs
- External services
- CLI tools

## Performance

- **Timeout**: 8 seconds (hard limit)
- **Optimization**: Speed-focused (dictionaries disabled)
- **Worker Management**: Proper lifecycle with guaranteed cleanup

